const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('[getPersonality] 开始执行, event:', JSON.stringify(event))
    
    const cuteId = event.cuteId || event.cuteid;
    if (!cuteId) {
      return { success: false, message: 'cuteid参数不能为空' }
    }
    
    const cuteid = String(cuteId).trim()
    console.log('[getPersonality] 要查询的cuteid:', cuteid)
    
    // 查询 users 集合
    const usersResult = await db.collection('users')
      .where({ cuteid: cuteid })
      .get()
    
    console.log('[getPersonality] users集合查询结果:', JSON.stringify(usersResult))
    
    if (usersResult.data && usersResult.data.length > 0) {
      const userData = usersResult.data[0]
      console.log('[getPersonality] ✅ 从 users 集合找到数据')
      
      return {
        success: true,
        data: {
          cuteid: userData.cuteid,
          cuteId: userData.cuteid,
          personality: userData.current_personality,
          personalityCode: userData.current_personality,
          personalityName: userData.current_personality_name || '',
          percentages: userData.current_percentages || {},
          gender: userData.gender
        }
      }
    }
    
    // 查询 personality_records 集合
    const recordsResult = await db.collection('personality_records')
      .where({ cuteid: cuteid })
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get()
    
    console.log('[getPersonality] personality_records查询结果:', JSON.stringify(recordsResult))
    
    if (recordsResult.data && recordsResult.data.length > 0) {
      const latestRecord = recordsResult.data[0]
      console.log('[getPersonality] ✅ 从 personality_records 集合找到数据')
      
      return {
        success: true,
        data: {
          cuteid: latestRecord.cuteid,
          cuteId: latestRecord.cuteid,
          personality: latestRecord.personality || latestRecord.personalityCode || '',
          personalityCode: latestRecord.personality || latestRecord.personalityCode || '',
          personalityName: '',
          percentages: latestRecord.percentages || {},
          gender: latestRecord.gender
        }
      }
    }
    
    console.log('[getPersonality] ❌ 未找到 cuteid:', cuteid)
    return { success: false, message: '未找到用户数据', queryCuteid: cuteid }
  } catch (err) {
    console.error('[getPersonality] ❌ 执行失败:', err)
    return { success: false, message: err.message, error: err.message }
  }
}
