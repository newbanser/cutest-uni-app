<template>
  <view class="page-container">
    <view class="fullscreen-bg"></view>
    
    <view class="content-area">
      <!-- 人格测试记录内容 -->
      <view v-if="activeTab === 'personality'">
        <view class="card curve-card" v-if="showCurveCard">
          <text class="curve-title">历史趋势</text>
          <view class="curve-tabs">
            <view
              v-for="item in curveTabs"
              :key="item.key"
              class="curve-tab"
              :class="{ active: activeCurve === item.key }"
              @tap="switchCurve(item.key)"
            >
              {{ item.label }}
            </view>
          </view>
          <view class="curve-content">
            <TrendChart v-if="trendHasHistory" :dimension="activeCurve" :data="trendChartData" />
            <view v-else-if="hasFirstAnalysis" class="empty-state">
              <text class="empty-icon">📈</text>
              <text class="empty-text">完成更多解析，即可追踪你的人格变化趋势</text>
            </view>
            <view v-else class="empty-state">
              <text class="empty-icon"></text>
              <text class="empty-text">暂无数据，完成首次解析后即可查看你的人格变化曲线</text>
            </view>
          </view>
        </view>

        <view class="timeline">
          <view class="timeline-item" v-for="(item, index) in trendAnalysisRecords" :key="index">
            <view class="card timeline-card" @tap="viewTrendDetail(item)">
              <view class="timeline-header">
                <text class="timeline-personality-name">{{ item.displayPersonality || item.personality }}</text>
                <text 
                  class="timeline-mode-tag" 
                  :class="{ 'timeline-mode-simple': item.test_mode === 'simple', 'timeline-mode-hell': item.test_mode === 'hell' }"
                >
                  {{ item.test_mode === 'hell' ? '地狱模式' : '简单模式' }}
                </text>
              </view>
              <text class="timeline-time-value">{{ item.formattedDate }} {{ item.formattedTime }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 关系测试记录内容 -->
      <view v-else>
        <!-- 子Tab切换：我发起的 / 好友发起的 -->
        <view class="match-sub-tabs">
          <view
            class="match-sub-tab"
            :class="{ active: matchSubTab === 'mine' }"
            @tap="switchMatchSubTab('mine')"
          >
            我发起的
          </view>
          <view
            class="match-sub-tab"
            :class="{ active: matchSubTab === 'friend' }"
            @tap="switchMatchSubTab('friend')"
          >
            好友发起的
          </view>
        </view>

        <!-- 关系测试记录时间轴 -->
        <view class="timeline" v-if="filteredMatchRecords.length > 0">
          <view class="timeline-item" v-for="(item, index) in filteredMatchRecords" :key="index">
            <view class="card timeline-card" @tap="goToMatchResult(item)">
              <view class="timeline-header">
                <text class="timeline-personality-name">{{ getDisplayRelationName(item.matchData) || '未知关系' }}</text>
                <text class="timeline-mode-tag" :class="item._otherSideDeleted ? 'timeline-deleted-tag' : 'timeline-mode-hell'">
                  {{ item._otherSideDeleted ? '对方已删除' : (item.matchData?.matchScore != null ? item.matchData.matchScore : 0) + '%' }}
                </text>
              </view>
              <text class="timeline-time-value">{{ formatDate(item.timestamp) }}</text>
            </view>
          </view>
        </view>

        <!-- 调试面板：显示每条记录的原始数据 -->
        <view class="debug-section" v-if="debugShow">
          <view class="card">
            <text class="debug-title">🔍 调试: 匹配记录原始数据 (共 {{ matchRecords.length }} 条)</text>
            <view class="debug-note">云端{{ cloudRecordCount }}条 | 本地{{ localRecordCount }}条 | 过滤后{{ filteredMatchRecords.length }}条</view>
            <view v-for="(item, idx) in matchRecords" :key="'d'+idx" class="debug-item">
              <view class="debug-item-header">记录 #{{ idx+1 }}</view>
              <view class="debug-row"><text class="debug-label">_recordId:</text><text class="debug-val">{{ item._recordId || '—' }}</text></view>
              <view class="debug-row"><text class="debug-label">_mySide:</text><text class="debug-val">{{ item._mySide || '—' }}</text></view>
              <view class="debug-row"><text class="debug-label">_fromCloud:</text><text class="debug-val">{{ item._fromCloud }}</text></view>
              <view class="debug-row"><text class="debug-label">userA.cuteId:</text><text class="debug-val">{{ item.userA?.cuteId || '—' }}</text></view>
              <view class="debug-row"><text class="debug-label">userA.personalityCode:</text><text class="debug-val">{{ item.userA?.personalityCode || '—' }}</text></view>
              <view class="debug-row"><text class="debug-label">userB.cuteId:</text><text class="debug-val">{{ item.userB?.cuteId || '—' }}</text></view>
              <view class="debug-row"><text class="debug-label">userB.personalityCode:</text><text class="debug-val">{{ item.userB?.personalityCode || '—' }}</text></view>
              <view class="debug-row"><text class="debug-label">relationName:</text><text class="debug-val">{{ item.matchData?.relationName || '—' }}</text></view>
              <view class="debug-row"><text class="debug-label">matchScore:</text><text class="debug-val">{{ item.matchData?.matchScore != null ? item.matchData.matchScore : '—' }}</text></view>
              <view class="debug-row"><text class="debug-label">timestamp:</text><text class="debug-val">{{ formatDateTime(item.timestamp) }}</text></view>
            </view>
          </view>
        </view>

        <!-- 调试按钮 -->
        <view class="debug-toggle" @tap="toggleDebug">
          <text>{{ debugShow ? '收起调试' : '调试信息' }}</text>
        </view>
      </view>

      <text class="tip-text">本分析仅供娱乐参考，不能代替专业心理评估</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import personalitiesData from '@/data/personalities';
import TrendChart from '@/components/TrendChart.vue';
import { useUserStore } from '@/stores/user';
import scoring from '@/utils/scoring';

const { personalities } = personalitiesData.personalitiesData;
const userStore = useUserStore();

const activeTab = ref('personality');
const matchRecords = ref([]);
const debugShow = ref(false);

const toggleDebug = () => { debugShow.value = !debugShow.value; };

// 仅供调试用
const cloudRecordCount = computed(() => matchRecords.value.filter(r => r._fromCloud).length);
const localRecordCount = computed(() => matchRecords.value.filter(r => !r._fromCloud).length);

const loadMatchRecords = async () => {
  try {
    userStore.loadUserData();
    const cuteId = userStore.userData.cuteId;

    // 1. 加载本地记录
    const localRecords = uni.getStorageSync('matchRecords') || [];

    // 2. 加载云端记录
    let cloudRecords = [];
    try {
      const res = await uni.cloud.callFunction({
        name: 'getMatches',
        data: { myCuteId: cuteId }
      });
      if (res.result?.success && Array.isArray(res.result.data)) {
        cloudRecords = res.result.data.map(mapCloudRecord);
      }
    } catch (e) {
      console.log('[history] 云端记录加载失败，仅使用本地记录:', e);
    }

    // 3. 以云端记录为主，补充本地没有的记录
    //    （云端记录更完整，含 _mySide 和 personalityCode）
    let allRecords;
    if (cloudRecords.length > 0) {
      const cloudRelationNames = {};
      for (const cr of cloudRecords) {
        const name = cr.matchData?.relationName;
        if (name) cloudRelationNames[name] = true;
      }
      // 补充本地有但云端没有的记录
      for (const lr of localRecords) {
        const name = lr.matchData?.relationName;
        if (name && !cloudRelationNames[name]) {
          cloudRecords.push(lr);
        }
      }
      allRecords = cloudRecords;
    } else {
      allRecords = localRecords;
    }

    // 按时间倒序排列
    allRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    matchRecords.value = allRecords;
  } catch (e) {
    console.error('[history] loadMatchRecords 出错:', e);
    matchRecords.value = [];
  }
};

const mapCloudRecord = (cr) => ({
  _recordId: cr._id || '',
  userA: { cuteId: cr.recipient_cuteid || '', personalityCode: cr.recipient_personality || '' },
  userB: { cuteId: cr.initiator_cuteid || '', personalityCode: cr.initiator_personality || '' },
  matchData: cr.match_result || {},
  isPrivate: cr.is_secret || false,
  timestamp: cr.timestamp || Date.now(),
  source: cr.source || 'manual',
  _fromCloud: true,
  _mySide: cr._mySide || '',
  _otherSideDeleted: cr._otherSideDeleted || false
});

const goToMatchResult = (item) => {
  if (!item.matchData) return;
  const currentCuteId = userStore.userData.cuteId;
  // 用 cuteId 匹配确定本人和好友；cuteId 变更后通过 _mySide 确定
  let myCuteId, friendCuteId;
  if (item._mySide === 'initiator') {
    myCuteId = item.userB?.cuteId;
    friendCuteId = item.userA?.cuteId;
  } else if (item._mySide === 'recipient') {
    myCuteId = item.userA?.cuteId;
    friendCuteId = item.userB?.cuteId;
  } else {
    myCuteId = item.userA?.cuteId === currentCuteId ? item.userA.cuteId : item.userB?.cuteId;
    friendCuteId = item.userA?.cuteId === currentCuteId ? item.userB?.cuteId : item.userA?.cuteId;
  }
  if (!myCuteId || !friendCuteId) return;
  // 写入本地缓存，crush-result 通过 myID+friendID 即可读取，避免 URL 传 JSON 导致截断
  // 同时保存人格类型，避免 crush-result 从 matchResult 缓存读取错误的数据
  let myPersonality = '', friendPersonality = '';
  if (item.userA?.cuteId === myCuteId) {
    myPersonality = item.userA?.personalityCode || '';
    friendPersonality = item.userB?.personalityCode || '';
  } else if (item.userB?.cuteId === myCuteId) {
    myPersonality = item.userB?.personalityCode || '';
    friendPersonality = item.userA?.personalityCode || '';
  }
  // 如果云端记录缺 personalityCode（旧数据），用当前用户的最新记录回退
  if (!myPersonality) {
    const records = userStore.userData.analysis_records;
    if (records && records.length > 0) {
      myPersonality = records[records.length - 1].personality || '';
    }
  }
  if (!friendPersonality) {
    // 从 matchResultsMap 查找好友的人格类型（由 processMatchResult 按好友 cuteId 缓存）
    const matchResultsMap = uni.getStorageSync('matchResultsMap') || {};
    const savedForFriend = matchResultsMap[friendCuteId];
    if (savedForFriend) {
      if (savedForFriend.userA?.cuteId === friendCuteId) {
        friendPersonality = savedForFriend.userA.personalityCode || savedForFriend.userA.personality || '';
      } else if (savedForFriend.userB?.cuteId === friendCuteId) {
        friendPersonality = savedForFriend.userB.personalityCode || savedForFriend.userB.personality || '';
      }
    }
    // 仍然没有，从 matchResult 存储查找
    if (!friendPersonality) {
      const savedResult = uni.getStorageSync('matchResult');
      if (savedResult) {
        if (savedResult.userA?.cuteId === friendCuteId) {
          friendPersonality = savedResult.userA.personalityCode || savedResult.userA.personality || '';
        } else if (savedResult.userB?.cuteId === friendCuteId) {
          friendPersonality = savedResult.userB.personalityCode || savedResult.userB.personality || '';
        }
      }
    }
  }
  const matchCache = uni.getStorageSync('matchResultCache') || {};
  matchCache[myCuteId + '_' + friendCuteId] = {
    matchData: item.matchData,
    isPrivate: item.isPrivate || false,
    myPersonality,
    friendPersonality
  };
  uni.setStorageSync('matchResultCache', matchCache);
  uni.navigateTo({
    url: `/pages/crush-result/crush-result?myID=${encodeURIComponent(myCuteId)}&friendID=${encodeURIComponent(friendCuteId)}&recordId=${encodeURIComponent(item._recordId || '')}`
  });
};

const matchSubTab = ref('mine');

const filteredMatchRecords = computed(() => {
  const cuteId = userStore.userData.cuteId;
  // 按关系名去重（处理同一条匹配因 cuteId 变更等出现两条记录的问题）
  const seen = {};
  const deduped = [];
  for (const r of matchRecords.value) {
    const name = r.matchData?.relationName;
    if (!name) { deduped.push(r); continue; }
    const prev = seen[name];
    if (prev !== undefined) {
      // 同关系名出现在 1 小时内 → 视为同一条匹配
      if (Math.abs((r.timestamp || 0) - prev) < 3600000) {
        continue;
      }
    }
    seen[name] = r.timestamp || 0;
    deduped.push(r);
  }
  // userA = 接收方(target)，userB = 发起方(initiator)
  // _mySide 处理 cuteId 变更后新旧记录共存的情况
  if (matchSubTab.value === 'mine') {
    return deduped.filter(r => r.userB?.cuteId === cuteId || r._mySide === 'initiator');
  } else {
    return deduped.filter(r => r.userA?.cuteId === cuteId || r._mySide === 'recipient');
  }
});

const switchMatchSubTab = (tab) => {
  matchSubTab.value = tab;
};

const curveTabs = ref([
  { key: 'EI', label: '能量来源' },
  { key: 'SN', label: '认知方式' },
  { key: 'TF', label: '决策依据' },
  { key: 'JP', label: '行为偏好' }
]);
const activeCurve = ref('EI');
const showCurveCard = ref(true);

const trendAnalysisRecords = ref([]);
const trendAnalysisCount = ref(0);
const trendHasHistory = ref(false);
const hasFirstAnalysis = ref(false);
const trendChartData = ref([]);
const trendDimensionData = ref([]);

// 兼容旧匹配记录：显示新关系名
const getDisplayRelationName = (matchData) => {
  if (!matchData) return '未知关系';
  // 新记录：直接读取新字段
  if (matchData.levelName) return matchData.levelName;
  // 旧记录：通过迁移函数转换
  if (matchData.level) {
    const migrated = scoring.migrateLegacyMatchData(matchData);
    if (migrated) return migrated.levelName;
  }
  return matchData.relationName || '未知关系';
};

const formatDateTime = (timestamp) => {
  let ts = timestamp;
  if (ts && ts.toString().length === 10) {
    ts = ts * 1000;
  }
  const date = new Date(ts);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};

const formatDate = (timestamp) => {
  let ts = timestamp;
  if (ts && ts.toString().length === 10) {
    ts = ts * 1000;
  }
  const date = new Date(ts);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (timestamp) => {
  let ts = timestamp;
  if (ts && ts.toString().length === 10) {
    ts = ts * 1000;
  }
  const date = new Date(ts);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const calculateChartData = (records) => {
  if (!records || !Array.isArray(records) || records.length === 0) return [];
  
  const reversedRecords = [...records].reverse().slice(0, 10);
  
  return reversedRecords.map(record => {
    const percentages = record?.percentages || {};
    let score = 50;

    switch (activeCurve.value) {
      case 'EI':
        score = Number(percentages.E) || 50;
        break;
      case 'SN':
        score = Number(percentages.S) || 50;
        break;
      case 'TF':
        score = Number(percentages.T) || 50;
        break;
      case 'JP':
        score = Number(percentages.J) || 50;
        break;
    }

    return { score: Number(score) };
  });
};

const refreshTrendData = () => {
  userStore.loadUserData();
  const records = userStore.userData.analysis_records || [];
  
  trendAnalysisRecords.value = [...records].reverse().slice(0, 10).map(view => ({
    ...view,
    formattedDate: formatDate(view.timestamp),
    formattedTime: formatTime(view.timestamp),
    displayPersonality: view.personality
  }));
  
  trendAnalysisCount.value = records.length;
  hasFirstAnalysis.value = records.length >= 1;
  trendHasHistory.value = records.length >= 2;
  trendChartData.value = calculateChartData(records);
};

const viewTrendDetail = (item) => {
  uni.setStorageSync('currentViewId', item.id);
  uni.navigateTo({
    url: '/pages/xbti-result/xbti-result'
  });
};

const switchCurve = (key) => {
  activeCurve.value = key;
  const records = userStore.userData.analysis_records || [];
  trendChartData.value = calculateChartData(records);
};

const switchTab = (tab) => {
  activeTab.value = tab;
  uni.setNavigationBarTitle({
    title: tab === 'personality' ? '人格测试记录' : '关系测试记录'
  });
};

onMounted(() => {
  // 从 URL 参数读取默认 tab
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || currentPage.options || {};
  if (options.tab === 'match') {
    activeTab.value = 'match';
  }
  uni.setNavigationBarTitle({
    title: activeTab.value === 'personality' ? '人格测试记录' : '关系测试记录'
  });
  refreshTrendData();
  loadMatchRecords();
});

onShow(() => {
  refreshTrendData();
  loadMatchRecords();
});
</script>

<style lang="scss">
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  width: 100%;
  background-color: #f5f5f5;
}

.fullscreen-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-color: #f5f5f5;
}

.page-container {
  min-height: 100vh;
  padding: 0;
  padding-bottom: 20rpx;
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow-x: hidden;
}

.content-area {
  padding: 30rpx;
}

/* 关系测试子Tab切换样式 */
.match-sub-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.match-sub-tab {
  flex: 1;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #000000;
  transition: all 0.3s ease;
  border: 2px solid #000000;
  text-align: center;
}

.match-sub-tab.active {
  background: #000000;
  color: #ffffff;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.curve-card {
  padding: 28rpx;
}

.curve-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
  display: block;
  margin-bottom: 20rpx;
}

.curve-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.curve-tab {
  flex: 1;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #000000;
  transition: all 0.3s ease;
  border: 2px solid #000000;
  text-align: center;
}

.curve-tab.active {
  background: #000000;
  color: #ffffff;
}

.curve-content {
  height: 280px;
  padding: 20rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 24rpx;
  color: #646464;
  text-align: center;
}

.timeline-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.timeline-card:active {
  background-color: #FA325A;
}

.timeline-card:active .timeline-personality-name,
.timeline-card:active .timeline-time-value,
.timeline-card:active .timeline-mode-tag {
  color: #ffffff;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-personality-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.timeline-mode-tag {
  padding: 8rpx 20rpx;
  border-radius: 60rpx;
  font-size: 20rpx;
  font-weight: 700;
}

.timeline-mode-simple {
  background-color: #f0f0f0;
  color: #000000;
}

.timeline-mode-hell {
  background-color: #000000;
  color: #ffffff;
}

.timeline-deleted-tag {
  background-color: #FA325A;
  color: #ffffff;
  padding: 8rpx 20rpx;
  border-radius: 60rpx;
  font-size: 20rpx;
  font-weight: 700;
}

.timeline-time-value {
  font-size: 26rpx;
  color: #333333;
}

.tip-text {
  font-size: 24rpx;
  color: #646464;
  line-height: 1.6;
  text-align: center;
  padding: 20rpx 0;
  margin-top: 20rpx;
  margin-bottom: 24rpx;
  display: block;
}

/* 调试面板样式 */
.debug-toggle {
  text-align: center;
  padding: 16rpx;
  margin-top: 8rpx;
  margin-bottom: 40rpx;
}

.debug-toggle text {
  font-size: 22rpx;
  color: #999;
  text-decoration: underline;
}

.debug-section {
  margin-top: 16rpx;
}

.debug-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #000;
  display: block;
  margin-bottom: 8rpx;
}

.debug-note {
  font-size: 22rpx;
  color: #FA325A;
  margin-bottom: 16rpx;
}

.debug-item {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
  border: 1px solid #eee;
}

.debug-item-header {
  font-size: 22rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
  border-bottom: 1px solid #eee;
  padding-bottom: 6rpx;
}

.debug-row {
  display: flex;
  margin-bottom: 4rpx;
}

.debug-label {
  font-size: 20rpx;
  color: #666;
  width: 200rpx;
  flex-shrink: 0;
}

.debug-val {
  font-size: 20rpx;
  color: #000;
  word-break: break-all;
}
</style>
