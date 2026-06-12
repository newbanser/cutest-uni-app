const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { openid } = cloud.getWXContext()

  try {
    console.log(`[getMatches] 开始执行, openid: ${openid}`)

    const myCuteId = event.myCuteId || '';

    if (!myCuteId) {
      console.log('[getMatches] 缺少 myCuteId')
      return { success: false, message: '缺少 myCuteId', data: [] }
    }

    // 查询所有涉及该 cuteId 或 openid 的记录（cuteId 变更后也能通过 openid 找到旧记录）
    const result = await db.collection('match_records')
      .where(_.or([
        { initiator_cuteid: myCuteId },
        { recipient_cuteid: myCuteId },
        { initiator_openid: openid },
        { recipient_openid: openid }
      ]))
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get()

    console.log(`[getMatches] 查询成功, 共 ${result.data?.length || 0} 条记录`)

    // 标记每条记录中当前用户的角色，并过滤已删除的记录
    // 注意：initiator_openid 可能因云函数调用方与实际发起人不一致而产生误导
    // 因此优先用 cuteId 判定角色，openid 仅作 fallback
    const enriched = (result.data || []).map(r => {
      let mySide = '';
      let myDeleted = false;
      let otherSideDeleted = false;
      if (r.initiator_cuteid === myCuteId) {
        mySide = 'initiator';
        myDeleted = r.initiator_deleted || false;
        otherSideDeleted = r.recipient_deleted || false;
      } else if (r.recipient_cuteid === myCuteId) {
        mySide = 'recipient';
        myDeleted = r.recipient_deleted || false;
        otherSideDeleted = r.initiator_deleted || false;
      } else if (r.initiator_openid === openid) {
        mySide = 'initiator';
        myDeleted = r.initiator_deleted || false;
        otherSideDeleted = r.recipient_deleted || false;
      } else if (r.recipient_openid === openid) {
        mySide = 'recipient';
        myDeleted = r.recipient_deleted || false;
        otherSideDeleted = r.initiator_deleted || false;
      }
      // 如果自己已删除，跳过此记录
      if (myDeleted) return null;
      return { ...r, _mySide: mySide, _otherSideDeleted: otherSideDeleted }
    }).filter(r => r !== null)

    return {
      success: true,
      data: enriched
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
