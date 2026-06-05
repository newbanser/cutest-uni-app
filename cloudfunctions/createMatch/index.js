const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { openid } = cloud.getWXContext()
  
  try {
    console.log(`[createMatch] 开始执行, openid: ${openid}`)
    
    const friendCuteId = event.friendCuteId || event.friendCuteid || event.friendCuteID || '';
    const matchRecord = {
      initiator_openid: openid,
      recipient_cuteid: friendCuteId,
      initiator_personality: event.initiatorPersonality || event.myPersonality || '',
      recipient_personality: event.recipientPersonality || event.friendPersonality || '',
      match_score: event.matchScore || 0,
      match_result: event.matchResult || {},
      is_secret: event.isPrivate || false,
      timestamp: event.timestamp || Date.now(),
      created_at: db.serverDate()
    }

    const result = await db.collection('match_records').add({
      data: matchRecord
    })
    
    console.log(`[createMatch] 保存成功, _id: ${result._id}`)
    
    return {
      success: true,
      message: '匹配记录创建成功',
      data: {
        _id: result._id
      }
    }
  } catch (err) {
    console.error(`[createMatch] 执行失败, 错误:`, err)
    return {
      success: false,
      message: err.message,
      error: err.message
    }
  }
}
