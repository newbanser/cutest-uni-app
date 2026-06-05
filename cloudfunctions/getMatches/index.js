const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { openid } = cloud.getWXContext()
  
  try {
    console.log(`[getMatches] 开始执行, openid: ${openid}`)
    
    const result = await db.collection('match_records')
      .where({
        initiator_openid: openid
      })
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get()
    
    console.log(`[getMatches] 查询成功, 共 ${result.data?.length || 0} 条记录`)
    
    return {
      success: true,
      data: result.data || []
    }
  } catch (err) {
    console.error(`[getMatches] 执行失败, 错误:`, err)
    return {
      success: false,
      message: err.message,
      error: err.message
    }
  }
}
