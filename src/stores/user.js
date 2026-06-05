import { reactive } from 'vue';

const STORAGE_KEY = 'userData';
const CACHE_EXPIRE_MS = 60 * 60 * 1000;

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
  _last_fetch: 0,
  _is_fetched: false
});

const fetchUserData = async () => {
  try {
    console.log('[userStore] 从云端获取用户数据...');
    const res = await uni.cloud.callFunction({
      name: 'getPersonality',
      data: { cuteId: userData.cuteId }
    });
    
    if (res.result && res.result.success && res.result.data) {
      const cloudData = res.result.data;
      userData.cuteId = cloudData.cuteId || userData.cuteId;
      userData.current_personality = cloudData.personality || '';
      userData.current_personality_name = cloudData.personalityName || '';
      userData.current_percentages = cloudData.percentages || {};
      userData.gender = cloudData.gender || '';
      userData._last_fetch = Date.now();
      userData._is_fetched = true;
      
      saveUserData();
      console.log('[userStore] 云端数据获取成功:', userData);
      return true;
    }
    return false;
  } catch (e) {
    console.error('[userStore] 从云端获取数据失败:', e);
    return false;
  }
};

const loadUserData = () => {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY);
    if (saved && typeof saved === 'object') {
      const isExpired = saved._last_fetch && (Date.now() - saved._last_fetch) < CACHE_EXPIRE_MS;
      
      userData.cuteId = saved.cuteId || generateCuteId();
      userData.nickname = saved.nickname || generateNickname();
      userData.avatar = saved.avatar || '';
      userData.gender = saved.gender || '';
      userData.current_personality = saved.current_personality || '';
      userData.current_personality_name = saved.current_personality_name || '';
      userData.current_percentages = saved.current_percentages || {};
      userData.analysis_records = saved.analysis_records || [];
      userData._last_fetch = saved._last_fetch || 0;
      userData._is_fetched = saved._is_fetched || false;
      
      if (isExpired && userData._is_fetched) {
        console.log('[userStore] 使用本地缓存');
        return true;
      }
      
      if (!isExpired || !userData._is_fetched) {
        fetchUserData();
      }
    } else {
      saveUserData();
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
        percentages: userData.current_percentages
      }
    });
  } catch (e) {
    console.error('[userStore] 更新用户信息同步失败:', e);
  }
};

const addAnalysisRecord = (record) => {
  userData.analysis_records = [...userData.analysis_records, record];
  userData.current_personality = record.personality || '';
  userData.current_percentages = record.percentages || {};
  
  saveUserData();
  
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
        percentages: record.percentages
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

const resetAllData = () => {
  // 清除本地存储
  try {
    uni.removeStorageSync(STORAGE_KEY);
    uni.removeStorageSync('cuteId');
    uni.removeStorageSync('userGender');
    uni.removeStorageSync('userProfile');
    uni.removeStorageSync('matchResult');
    uni.removeStorageSync('matchTarget');
    uni.removeStorageSync('currentViewId');
    uni.removeStorageSync('currentView');
    uni.removeStorageSync('app_start_date');
  } catch (e) {
    console.error('[userStore] 清除本地存储失败:', e);
  }
  
  // 重新初始化数据
  userData.cuteId = generateCuteId();
  userData.nickname = generateNickname();
  userData.avatar = '';
  userData.gender = '';
  userData.current_personality = '';
  userData.current_personality_name = '';
  userData.current_percentages = {};
  userData.analysis_records = [];
  userData._last_fetch = 0;
  userData._is_fetched = false;
  
  saveUserData();
};

export const useUserStore = () => ({
  userData,
  loadUserData,
  updateProfile,
  addAnalysisRecord,
  resetAllData,
  saveUserData
});
