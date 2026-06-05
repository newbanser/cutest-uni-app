const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const startTime = Date.now()
  
  try {
    console.log('[saveAnalysis] 开始执行')
    console.log('[saveAnalysis] event:', JSON.stringify(event))
    console.log('[saveAnalysis] openid:', openid)
    console.log('[saveAnalysis] wxContext:', JSON.stringify(wxContext))
    
    // 验证openid
    if (!openid) {
      console.error('[saveAnalysis] ❌ openid为空')
      return { 
        success: false, 
        message: '无法获取用户标识，请重试' 
      }
    }
    
    const cuteId = event.cuteId || event.cuteid;
    const personalityRecord = {
      user_openid: openid,
      personality: event.personality || event.personalityCode || '',
      scores: event.scores || event.rawScores || event.raw_scores || {},
      percentages: event.percentages || {},
      test_mode: event.test_mode || 'simple',
      is_private: event.isPrivate || false,
      cuteid: cuteId || '',
      timestamp: event.timestamp || Date.now(),
      gender: event.gender || null,
      created_at: db.serverDate()
    }
    
    console.log('[saveAnalysis] 准备保存的数据:', JSON.stringify(personalityRecord))
    
    const result = await db.collection('personality_records').add({
      data: personalityRecord
    })
    
    console.log(`[saveAnalysis] 保存成功, _id: ${result._id}`)
    
    return {
      success: true,
      message: '保存成功',
      data: {
        _id: result._id
      }
    }
  } catch (err) {
    console.error('[saveAnalysis] 执行失败, 错误:', err)
    return {
      success: false,
      message: err.message,
      error: err.message
    }
  }
}
