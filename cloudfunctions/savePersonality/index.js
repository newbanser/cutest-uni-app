const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  console.log('[savePersonality] 开始执行')
  console.log('[savePersonality] event:', JSON.stringify(event))
  
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  console.log('[savePersonality] openid:', openid)
  
  if (!openid) {
    console.warn('[savePersonality] 警告: 无法获取openid')
    return { success: false, message: '无法获取用户标识' }
  }
  
  const cuteId = event.cuteId || event.cuteid;
  if (!cuteId) {
    return { success: false, message: 'cuteid不能为空' }
  }
  
  try {
    const userData = {
      openid,
      cuteid: cuteId,
      nickname: event.nickname || '',
      avatar: event.avatar || '',
      gender: event.gender || null,
      current_personality: event.personalityCode || event.personality || '',
      current_personality_name: event.personalityName || '',
      current_percentages: event.percentages || {},
      personality_test_count: event.personality_test_count || 0,
      updated_at: db.serverDate()
    }

    // relationship_match_count 由 createMatch 云函数管理，不在 profile 更新中覆盖
    if (event.relationship_match_count !== undefined) {
      userData.relationship_match_count = event.relationship_match_count;
    }
    
    console.log('[savePersonality] 准备保存的数据:', JSON.stringify(userData))
    
    // 用 cuteid 查询
    const cuteidResult = await db.collection('users')
      .where({ cuteid: cuteId })
      .get()
    
    console.log('[savePersonality] cuteid查询结果:', JSON.stringify(cuteidResult))
    
    if (cuteidResult.data && cuteidResult.data.length > 0) {
      // 找到，更新
      await db.collection('users').doc(cuteidResult.data[0]._id).update({
        data: userData
      })
      console.log('[savePersonality] ✅ 用户数据更新成功')
      return { success: true, message: '用户数据更新成功' }
    }
    
    // 用 openid 查询
    const openidResult = await db.collection('users')
      .where({ openid })
      .get()
    
    console.log('[savePersonality] openid查询结果:', JSON.stringify(openidResult))
    
    if (openidResult.data && openidResult.data.length > 0) {
      // 找到，用 openid 更新，保留原来的 cuteid
      await db.collection('users').doc(openidResult.data[0]._id).update({
        data: userData
      })
      console.log('[savePersonality] ✅ 用户数据更新成功（通过openid）')
      return { success: true, message: '用户数据更新成功' }
    }
    
    // 都找不到，创建新用户
    userData.created_at = db.serverDate()
    const addResult = await db.collection('users').add({
      data: userData
    })
    console.log('[savePersonality] ✅ 用户创建成功, _id:', addResult._id)
    return { success: true, message: '用户数据保存成功' }
  } catch (err) {
    console.error('[savePersonality] ❌ 执行失败:', err)
    return { success: false, message: err.message }
  }
}
