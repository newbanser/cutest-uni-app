import { reactive, ref } from 'vue';

const STORAGE_KEY = 'userData';
const CACHE_EXPIRE_MS = 0; // 临时设为0，强制每次从云端拉取

const generateCuteId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateNickname = () => {
  const maxFourDigit = 9999;
  const randomNum = Math.floor(Math.random() * (maxFourDigit + 1));
  return '小可爱' + randomNum.toString();
};

const userData = reactive({
  cuteId: generateCuteId(),
  nickname: generateNickname(),
  avatar: '',
  gender: '',
  current_personality: '',
  current_personality_name: '',
  current_percentages: {},
  analysis_records: [],
  analysis_count: 0,
  relationship_match_count: 0,
  _last_fetch: 0,
  _is_fetched: false
});

const loading = ref(false);

const fetchUserData = async () => {
  try {
    console.log('[userStore] 从云端获取用户数据...');
    const res = await uni.cloud.callFunction({
      name: 'getPersonality',
      data: { getRecords: true } // 不传 cuteid，云函数用 openid 查询；同时拉取完整记录列表
    });
    
    if (res.result && res.result.success && res.result.data) {
      const cloudData = res.result.data;
      userData.cuteId = cloudData.cuteId || userData.cuteId;
      userData.current_personality = cloudData.personality || '';
      userData.current_personality_name = cloudData.personalityName || '';
      userData.current_percentages = cloudData.percentages || {};
      userData.gender = cloudData.gender || '';
      // 关系测试次数：以本地 matchRecords 记录数为准（最准确，不受云端影响）
      let localMatchCount = 0;
      try {
        const localRecords = uni.getStorageSync('matchRecords') || [];
        if (Array.isArray(localRecords)) localMatchCount = localRecords.length;
      } catch (e) {}
      // 本地有记录时优先使用本地计数；无记录（新设备）才用云端
      userData.relationship_match_count = localMatchCount > 0
        ? localMatchCount
        : Math.max(cloudData.relationship_match_count || 0, userData.relationship_match_count);
      userData.analysis_count = Math.max(cloudData.personality_test_count || 0, userData.analysis_count);
      // 恢复人格测试记录列表（首页和历史页依赖 analysis_records）
      if (cloudData.records && cloudData.records.length > 0) {
        userData.analysis_records = cloudData.records.map(r => ({
          id: r._id || r.id,
          personality: r.personality || '',
          personalityName: r.personalityName || '',
          percentages: r.percentages || {},
          raw_scores: r.scores || {},
          timestamp: r.timestamp || Date.now(),
          test_mode: r.test_mode || 'simple',
          gender: r.gender || ''
        }));
      }
      userData._last_fetch = Date.now();
      userData._is_fetched = true;

      saveUserData();
      console.log('[userStore] 云端数据获取成功, relationship_match_count:', cloudData.relationship_match_count, 'personality_test_count:', cloudData.personality_test_count, 'records.length:', cloudData.records?.length);
      return true;
    }
    return false;
  } catch (e) {
    console.error('[userStore] 从云端获取数据失败:', e);
    return false;
  } finally {
    loading.value = false;
  }
};

const loadUserData = () => {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY);
    console.log('[userStore loadUserData] STORAGE_KEY:', STORAGE_KEY, 'saved:', !!saved, 'records:', saved?.analysis_records?.length);
    if (saved && typeof saved === 'object') {
      const isFresh = saved._last_fetch && (Date.now() - saved._last_fetch) < CACHE_EXPIRE_MS;

      userData.cuteId = saved.cuteId || generateCuteId();
      userData.nickname = saved.nickname || generateNickname();
      userData.avatar = saved.avatar || '';
      userData.gender = saved.gender || '';
      userData.current_personality = saved.current_personality || '';
      userData.current_personality_name = saved.current_personality_name || '';
      userData.current_percentages = saved.current_percentages || {};
      userData.analysis_records = saved.analysis_records || [];
      userData.analysis_count = saved.analysis_count || 0;
      userData.relationship_match_count = saved.relationship_match_count || 0;
      userData._last_fetch = saved._last_fetch || 0;
      userData._is_fetched = saved._is_fetched || false;

      // 缓存有效且有记录内容才跳过云端拉取（防止空缓存被当作有效）
      if (isFresh && userData._is_fetched && userData.analysis_records.length > 0) {
        console.log('[userStore] 本地缓存有效，直接使用');
        return;
      }

      // 缓存过期或从未拉过 → 从云端同步
      if (!userData._is_fetched) {
        loading.value = true;
      }
      fetchUserData();
    } else {
      loading.value = true;
      saveUserData();
      fetchUserData();
    }
  } catch (e) {
    console.error('[userStore] 加载用户数据出错:', e);
  }
};

const saveUserData = () => {
  try {
    const toSave = {
      cuteId: userData.cuteId,
      nickname: userData.nickname,
      avatar: userData.avatar,
      gender: userData.gender,
      current_personality: userData.current_personality,
      current_personality_name: userData.current_personality_name,
      current_percentages: userData.current_percentages,
      analysis_records: userData.analysis_records,
      analysis_count: userData.analysis_count,
      relationship_match_count: userData.relationship_match_count,
      _last_fetch: userData._last_fetch,
      _is_fetched: userData._is_fetched
    };
    uni.setStorageSync(STORAGE_KEY, toSave);
  } catch (e) {
    console.error('[userStore] 保存用户数据出错:', e);
  }
};

const updateProfile = async (profile) => {
  if (profile.nickname !== undefined) userData.nickname = profile.nickname;
  if (profile.avatar !== undefined) userData.avatar = profile.avatar;
  if (profile.gender !== undefined) userData.gender = profile.gender;
  if (profile.relationship_match_count !== undefined) userData.relationship_match_count = profile.relationship_match_count;

  saveUserData();

  try {
    await uni.cloud.callFunction({
      name: 'savePersonality',
      data: {
        cuteId: userData.cuteId,
        nickname: userData.nickname,
        avatar: userData.avatar,
        gender: userData.gender,
        personalityCode: userData.current_personality,
        personalityName: userData.current_personality_name,
        percentages: userData.current_percentages,
        relationship_match_count: userData.relationship_match_count,
        personality_test_count: userData.analysis_count
      }
    });
  } catch (e) {
    console.error('[userStore] 更新用户信息同步失败:', e);
  }
};

const addAnalysisRecord = (record) => {
  console.log('[userStore addAnalysisRecord] 写入前 analysis_records 长度:', userData.analysis_records.length);
  userData.analysis_records = [...userData.analysis_records, record];
  userData.analysis_count += 1;
  userData.current_personality = record.personality || '';
  userData.current_percentages = record.percentages || {};
  console.log('[userStore addAnalysisRecord] 写入后 analysis_records 长度:', userData.analysis_records.length, 'personality:', record.personality);

  saveUserData();
  console.log('[userStore addAnalysisRecord] saveUserData 完成，验证读回:', uni.getStorageSync(STORAGE_KEY)?.analysis_records?.length);
  
  try {
    uni.cloud.callFunction({
      name: 'savePersonality',
      data: {
        cuteId: userData.cuteId,
        nickname: userData.nickname,
        avatar: userData.avatar,
        gender: userData.gender || record.gender,
        personalityCode: record.personality,
        personalityName: record.personalityName || '',
        percentages: record.percentages,
        relationship_match_count: userData.relationship_match_count,
        personality_test_count: userData.analysis_count
      }
    });
    uni.cloud.callFunction({
      name: 'saveAnalysis',
      data: {
        cuteId: userData.cuteId,
        personality: record.personality,
        scores: record.raw_scores || {},
        percentages: record.percentages,
        gender: record.gender,
        timestamp: record.timestamp,
        test_mode: record.test_mode || 'simple'
      }
    });
  } catch (e) {
    console.error('[userStore] 保存记录同步失败:', e);
  }
};

export const useUserStore = () => ({
  userData,
  loading,
  loadUserData,
  updateProfile,
  addAnalysisRecord,
  saveUserData
});
