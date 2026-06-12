const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { openid } = cloud.getWXContext()

  try {
    console.log('[deletePersonalityRecord] 开始执行, openid:', openid)

    const recordId = event.recordId
    if (!recordId) {
      return { success: false, message: 'recordId 不能为空' }
    }

    // 查找记录，验证归属
    const record = await db.collection('personality_records').doc(recordId).get()
    if (!record.data) {
      return { success: false, message: '记录不存在' }
    }
    if (record.data.user_openid !== openid) {
      return { success: false, message: '无权删除此记录' }
    }

    // 软删除
    await db.collection('personality_records').doc(recordId).update({
      data: { deleted: true }
    })

    // 更新 users 集合中的人格测试计数（取当前未删除的记录数）
    const { total } = await db.collection('personality_records')
      .where({ user_openid: openid, deleted: _.neq(true) })
      .count()

    // 通过 cuteId 或 openid 找到 users 文档更新计数
    const userResult = await db.collection('users')
      .where({ openid })
      .get()
    if (userResult.data && userResult.data.length > 0) {
      await db.collection('users').doc(userResult.data[0]._id).update({
        data: { personality_test_count: total }
      })
    }

    console.log('[deletePersonalityRecord] ✅ 删除成功, 剩余记录数:', total)
    return { success: true, personality_test_count: total }
  } catch (err) {
    console.error('[deletePersonalityRecord] ❌ 执行失败:', err)
    return { success: false, message: err.message }
  }
}
