const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

async function incrementMatchCount(cuteId) {
  if (!cuteId) return
  // 查找用户文档
  const userResult = await db.collection('users').where({ cuteid: cuteId }).get()
  if (userResult.data && userResult.data.length > 0) {
    // 已存在文档 → 递增
    await db.collection('users').doc(userResult.data[0]._id).update({
      data: { relationship_match_count: _.inc(1) }
    })
  } else {
    // 文档不存在 → 不创建空文档（该 CuteId 可能是输入错误的口令，或尚未注册的用户）
    // 避免产生没有 openid 的孤立文档，后续被其他人随机到同 CuteId 时产生冲突
    console.log(`[createMatch] incrementMatchCount: cuteId=${cuteId} 在 users 集合中不存在，跳过计数`)
  }
}

exports.main = async (event, context) => {
  const { openid } = cloud.getWXContext()

  try {
    console.log(`[createMatch] 开始执行, openid: ${openid}`)

    const friendCuteId = event.friendCuteId || event.friendCuteid || event.friendCuteID || '';
    const myCuteId = event.myCuteId || event.myCuteid || '';

    // 1. 保存匹配记录到 match_records 集合
    const matchRecord = {
      initiator_cuteid: myCuteId,
      initiator_personality: event.initiatorPersonality || '',
      recipient_cuteid: friendCuteId,
      recipient_personality: event.targetPersonality || '',
      match_result: event.matchResult || {},
      is_secret: event.isPrivate || false,
      source: event.source || 'manual',
      timestamp: event.timestamp || Date.now(),
      created_at: db.serverDate()
    }

    // 补全双方 openid（通过 cuteId 查询，不依赖调用方的 openid）
    // 链接流程中调用方 openid ≠ 发起方 openid，因此必须用 cuteId 查
    try {
      const initiatorResult = await db.collection('users')
        .where({ cuteid: myCuteId })
        .get()
      if (initiatorResult.data && initiatorResult.data.length > 0) {
        matchRecord.initiator_openid = initiatorResult.data[0].openid || ''
      }
    } catch (e) {
      console.error('[createMatch] 查询发起方openid失败:', e)
    }
    try {
      const recipientResult = await db.collection('users')
        .where({ cuteid: friendCuteId })
        .get()
      if (recipientResult.data && recipientResult.data.length > 0) {
        matchRecord.recipient_openid = recipientResult.data[0].openid || ''
      }
    } catch (e) {
      console.error('[createMatch] 查询接收方openid失败:', e)
    }

    const result = await db.collection('match_records').add({
      data: matchRecord
    })

    console.log(`[createMatch] 匹配记录保存成功, _id: ${result._id}`)

    // 2. 更新双方的关系测试次数（文档不存在时自动创建）
    await incrementMatchCount(myCuteId)
    console.log(`[createMatch] 发起方(${myCuteId}) 次数已+1`)

    await incrementMatchCount(friendCuteId)
    console.log(`[createMatch] 接收方(${friendCuteId}) 次数已+1`)

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
