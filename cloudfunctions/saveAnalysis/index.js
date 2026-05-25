// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-d2gz1iuxn08055996'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { personality, scores, answers, dateTime } = event
  
  try {
    const result = await db.collection('analysis').add({
      data: {
        personality: personality,
        scores: scores,
        answers: answers,
        dateTime: dateTime,
        isNewUser: false,
        createTime: db.serverDate()
      }
    })
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: '保存成功',
        data: result
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: '保存失败',
        error: error.message
      })
    }
  }
}