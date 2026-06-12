const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

const countMatchRecords = async (cuteId, openid) => {
  try {
    const conditions = [];
    if (cuteId) {
      conditions.push({ initiator_cuteid: cuteId });
      conditions.push({ recipient_cuteid: cuteId });
    }
    if (openid) {
      conditions.push({ initiator_openid: openid });
      conditions.push({ recipient_openid: openid });
    }
    if (conditions.length === 0) return 0;
    const result = await db.collection('match_records')
      .where(_.or(conditions))
      .count();
    return result.total || 0;
  } catch (e) {
    console.error('[getPersonality] 查询匹配记录数失败:', e);
    return 0;
  }
};

const formatUserData = (doc) => {
  return {
    cuteid: doc.cuteid,
    cuteId: doc.cuteid,
    personality: doc.current_personality || doc.personality || '',
    personalityCode: doc.current_personality || doc.personality || '',
    personalityName: doc.current_personality_name || '',
    percentages: doc.current_percentages || doc.percentages || {},
    gender: doc.gender,
    relationship_match_count: doc.relationship_match_count || 0,
    personality_test_count: doc.personality_test_count || 0
  }
}

exports.main = async (event, context) => {
  try {
    console.log('[getPersonality] 开始执行, event:', JSON.stringify(event))

    const cuteId = event.cuteId || event.cuteid;

    if (cuteId) {
      // ===== 匹配查询：用 cuteid 查对方的数据 =====
      const cuteid = String(cuteId).trim()
      console.log('[getPersonality] 匹配查询, cuteid:', cuteid)

      // 查询 users 集合
      const usersResult = await db.collection('users')
        .where({ cuteid })
        .get()

      if (usersResult.data && usersResult.data.length > 0) {
        console.log('[getPersonality] ✅ 从 users 集合找到匹配数据')
        const userData = formatUserData(usersResult.data[0])
        // 补全人格测试次数（兼容老用户）
        try {
          const { total } = await db.collection('personality_records')
            .where({ cuteid: userData.cuteId, deleted: _.neq(true) })
            .count()
          if (total > (userData.personality_test_count || 0)) userData.personality_test_count = total
        } catch (e) { console.error('[getPersonality] 查询记录数失败:', e) }
        // 补全关系测试次数：users 集合已有值则优先使用（match_records 可能不完整）
        if (!userData.relationship_match_count) {
          const matchTotal = await countMatchRecords(userData.cuteId, null)
          if (matchTotal > 0) userData.relationship_match_count = matchTotal
        }
        // 需要完整的记录列表
        if (event.getRecords) {
          try {
            const recResult = await db.collection('personality_records')
              .where({ cuteid, deleted: _.neq(true) })
              .orderBy('timestamp', 'desc')
              .get()
            userData.records = recResult.data || []
          } catch (e) { console.error('[getPersonality] 查询记录列表失败:', e) }
        }
        return { success: true, data: userData }
      }

      // 降级到 personality_records
      const recordsResult = await db.collection('personality_records')
        .where({ cuteid, deleted: _.neq(true) })
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()

      if (recordsResult.data && recordsResult.data.length > 0) {
        console.log('[getPersonality] ✅ 从 personality_records 找到匹配数据')
        const userData = formatUserData(recordsResult.data[0])
        // 补全人格测试次数（兼容老用户）
        try {
          const { total } = await db.collection('personality_records')
            .where({ cuteid: userData.cuteId, deleted: _.neq(true) })
            .count()
          if (total > (userData.personality_test_count || 0)) userData.personality_test_count = total
        } catch (e) { console.error('[getPersonality] 查询记录数失败:', e) }
        // 补全关系测试次数：users 集合已有值则优先使用（match_records 可能不完整）
        if (!userData.relationship_match_count) {
          const matchTotal = await countMatchRecords(userData.cuteId, null)
          if (matchTotal > 0) userData.relationship_match_count = matchTotal
        }
        // 需要完整的记录列表
        if (event.getRecords) {
          try {
            const recResult = await db.collection('personality_records')
              .where({ cuteid, deleted: _.neq(true) })
              .orderBy('timestamp', 'desc')
              .get()
            userData.records = recResult.data || []
          } catch (e) { console.error('[getPersonality] 查询记录列表失败:', e) }
        }
        return { success: true, data: userData }
      }

      console.log('[getPersonality] ❌ 匹配查询未找到 cuteid:', cuteid)
      return { success: false, message: '未找到用户数据' }
    }

    // ===== 本人查询：用 openid 查自己的数据 =====
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    console.log('[getPersonality] 本人查询, openid:', openid)

    if (!openid) {
      return { success: false, message: '无法获取用户标识' }
    }

    // 查询 users 集合
    const usersResult = await db.collection('users')
      .where({ openid })
      .get()

    if (usersResult.data && usersResult.data.length > 0) {
      console.log('[getPersonality] ✅ 从 users 集合找到本人数据')
      const userData = formatUserData(usersResult.data[0])
      // 补全人格测试次数（兼容老用户）
      try {
        const { total } = await db.collection('personality_records')
          .where({ user_openid: openid, deleted: _.neq(true) })
          .count()
        if (total > (userData.personality_test_count || 0)) userData.personality_test_count = total
      } catch (e) { console.error('[getPersonality] 查询记录数失败:', e) }
      // 补全关系测试次数：优先使用 users 集合中存储的值（更完整）
      if (!userData.relationship_match_count) {
        try {
          const matchResult = await db.collection('match_records')
            .where(_.or([
              { initiator_cuteid: userData.cuteId },
              { recipient_cuteid: userData.cuteId },
              { initiator_openid: openid },
              { recipient_openid: openid }
            ]))
            .count()
          const matchTotal = matchResult.total || 0
          console.log('[getPersonality] 匹配记录查询结果:', matchTotal, '(users存储值:', userData.relationship_match_count, ')')
          if (matchTotal > 0) {
            userData.relationship_match_count = matchTotal
            console.log('[getPersonality] 关系测试次数已更新为:', matchTotal)
          }
        } catch (e) { console.error('[getPersonality] 查询匹配记录数失败:', e) }
      }
      // 需要完整的记录列表
      if (event.getRecords) {
        try {
          const recResult = await db.collection('personality_records')
            .where({ user_openid: openid, deleted: _.neq(true) })
            .orderBy('timestamp', 'desc')
            .get()
          userData.records = recResult.data || []
        } catch (e) { console.error('[getPersonality] 查询记录列表失败:', e) }
      }
      return { success: true, data: userData }
    }

    // 降级到 personality_records
    const recordsResult = await db.collection('personality_records')
      .where({ user_openid: openid, deleted: _.neq(true) })
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get()

    if (recordsResult.data && recordsResult.data.length > 0) {
      console.log('[getPersonality] ✅ 从 personality_records 找到本人数据')
      const userData = formatUserData(recordsResult.data[0])
      // 补全人格测试次数（兼容老用户）
      try {
        const { total } = await db.collection('personality_records')
          .where({ user_openid: openid, deleted: _.neq(true) })
          .count()
        if (total > (userData.personality_test_count || 0)) userData.personality_test_count = total
      } catch (e) { console.error('[getPersonality] 查询记录数失败:', e) }
      // 补全关系测试次数：优先使用 users 集合中存储的值（更完整）
      if (!userData.relationship_match_count) {
        try {
          const matchResult = await db.collection('match_records')
            .where(_.or([
              { initiator_cuteid: userData.cuteId },
              { recipient_cuteid: userData.cuteId },
              { initiator_openid: openid },
              { recipient_openid: openid }
            ]))
            .count()
          const matchTotal = matchResult.total || 0
          console.log('[getPersonality] 匹配记录查询结果:', matchTotal, '(users存储值:', userData.relationship_match_count, ')')
          if (matchTotal > 0) {
            userData.relationship_match_count = matchTotal
            console.log('[getPersonality] 关系测试次数已更新为:', matchTotal)
          }
        } catch (e) { console.error('[getPersonality] 查询匹配记录数失败:', e) }
      }
      // 需要完整的记录列表
      if (event.getRecords) {
        try {
          const recResult = await db.collection('personality_records')
            .where({ user_openid: openid, deleted: _.neq(true) })
            .orderBy('timestamp', 'desc')
            .get()
          userData.records = recResult.data || []
        } catch (e) { console.error('[getPersonality] 查询记录列表失败:', e) }
      }
      return { success: true, data: userData }
    }

    console.log('[getPersonality] ❌ 本人查询未找到 openid:', openid)
    return { success: false, message: '未找到用户数据' }
  } catch (err) {
    console.error('[getPersonality] ❌ 执行失败:', err)
    return { success: false, message: err.message }
  }
}
