let userData = {
  user_id: 'user_' + Date.now(),
  total_analysis_count: 0,
  analysis_records: [],
  current_rolling_scores: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
  last_analysis_time: 0
};

const loadUserData = () => {
  try {
    const saved = uni.getStorageSync('userData');
    if (saved && typeof saved === 'object') {
      userData.user_id = saved.user_id || 'user_' + Date.now();
      userData.total_analysis_count = saved.total_analysis_count || 0;
      userData.analysis_records = Array.isArray(saved.analysis_records) ? [...saved.analysis_records] : [];
      userData.current_rolling_scores = saved.current_rolling_scores && typeof saved.current_rolling_scores === 'object' 
        ? { ...saved.current_rolling_scores } 
        : { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
      userData.last_analysis_time = saved.last_analysis_time || 0;
      
      if (userData.total_analysis_count !== userData.analysis_records.length) {
        userData.total_analysis_count = userData.analysis_records.length;
      }
      
      console.log('loadUserData loaded:', userData.analysis_records.length);
    }
  } catch (e) {
    console.error('Load user data error:', e);
  }
};

const saveUserData = () => {
  try {
    const toSave = {
      user_id: userData.user_id,
      total_analysis_count: userData.total_analysis_count,
      analysis_records: [...userData.analysis_records],
      current_rolling_scores: { ...userData.current_rolling_scores },
      last_analysis_time: userData.last_analysis_time
    };
    uni.setStorageSync('userData', toSave);
    console.log('saveUserData saved:', toSave.analysis_records.length);
  } catch (e) {
    console.error('Save user data error:', e);
  }
};

const addAnalysisRecord = (record) => {
  console.log('addAnalysisRecord before:', userData.analysis_records.length);
  userData.analysis_records = [...userData.analysis_records, record];
  userData.total_analysis_count = userData.analysis_records.length;
  userData.current_rolling_scores = { ...record.rolling_scores };
  userData.last_analysis_time = record.timestamp;
  console.log('addAnalysisRecord after:', userData.analysis_records.length);
  saveUserData();
  console.log('addAnalysisRecord saved:', uni.getStorageSync('userData')?.analysis_records?.length);
};

const clearUserData = () => {
  userData = {
    user_id: 'user_' + Date.now(),
    total_analysis_count: 0,
    analysis_records: [],
    current_rolling_scores: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
    last_analysis_time: 0
  };
  saveUserData();
};

export const useUserStore = () => ({
  userData,
  loadUserData,
  saveUserData,
  addAnalysisRecord,
  clearUserData
});
