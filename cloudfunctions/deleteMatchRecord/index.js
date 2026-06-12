const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { openid } = cloud.getWXContext()

  try {
    console.log('[deleteMatchRecord] 开始执行, openid:', openid)

    const recordId = event.recordId
    if (!recordId) {
      return { success: false, message: 'recordId 不能为空' }
    }

    // 查找记录，验证归属
    const record = await db.collection('match_records').doc(recordId).get()
    if (!record.data) {
      return { success: false, message: '记录不存在' }
    }

    const doc = record.data
    let updateField = ''

    if (doc.initiator_openid === openid) {
      updateField = 'initiator_deleted'
    } else if (doc.recipient_openid === openid) {
      updateField = 'recipient_deleted'
    } else {
      // 无 openid 时尝试匹配 cuteId（兼容旧数据）
      const userResult = await db.collection('users')
        .where({ openid })
        .get()
      const myCuteId = userResult.data?.[0]?.cuteid || ''
      if (doc.initiator_cuteid === myCuteId) {
        updateField = 'initiator_deleted'
      } else if (doc.recipient_cuteid === myCuteId) {
        updateField = 'recipient_deleted'
      } else {
        return { success: false, message: '无权删除此记录' }
      }
    }

    // 软删除（设置自己一侧的标记）
    await db.collection('match_records').doc(recordId).update({
      data: { [updateField]: true }
    })

    console.log('[deleteMatchRecord] ✅ 删除成功, 字段:', updateField)
    return { success: true }
  } catch (err) {
    console.error('[deleteMatchRecord] ❌ 执行失败:', err)
    return { success: false, message: err.message }
  }
}
