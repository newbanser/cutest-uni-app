const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { openid } = cloud.getWXContext()

  try {
    console.log(`[clearMatchData] 开始执行, openid: ${openid}`)

    // 1. 查询当前用户相关的所有匹配记录
    const matchResult = await db.collection('match_records')
      .where(_.or([
        { initiator_openid: openid },
        { recipient_openid: openid }
      ]))
      .get()

    console.log(`[clearMatchData] 找到 ${matchResult.data?.length || 0} 条匹配记录`)

    // 2. 逐条删除（云数据库批量删除需要先获取所有记录 ID）
    const deletePromises = (matchResult.data || []).map(doc =>
      db.collection('match_records').doc(doc._id).remove()
    )
    await Promise.all(deletePromises)
    console.log(`[clearMatchData] ✅ 已删除 ${deletePromises.length} 条匹配记录`)

    // 3. 重置 users 集合中的关系测试次数
    const userResult = await db.collection('users')
      .where({ openid })
      .get()

    if (userResult.data && userResult.data.length > 0) {
      await db.collection('users').doc(userResult.data[0]._id).update({
        data: { relationship_match_count: 0 }
      })
      console.log('[clearMatchData] ✅ 已重置 relationship_match_count 为 0')
    }

    return {
      success: true,
      message: `已删除 ${deletePromises.length} 条匹配记录，重置计数为 0`,
      deletedCount: deletePromises.length
    }
  } catch (err) {
    console.error('[clearMatchData] ❌ 执行失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
}
