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
                  :class="{ 'timeline-mode-simple': item.test_mode === 'simple' || item.test_mode === 'simple_v2', 'timeline-mode-hell': item.test_mode === 'hell' }"
                >
                  {{
                    item.test_mode === 'hell' ? '地狱模式' :
                    item.test_mode === 'simple_v2' ? '简单模式' : '荣格模式'
                  }}
                </text>
              </view>
              <text class="timeline-time-value">{{ item.formattedDate }} {{ item.formattedTime }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 关系测试记录内容 -->
      <view v-else>
        <!-- 子Tab切换 -->
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
                <text class="timeline-mode-tag timeline-id-tag">{{ getRelationId(item.matchData) }} {{ getRelationLevel(item.matchData) }}</text>
              </view>
              <text class="timeline-time-value">{{ formatDate(item.timestamp) }}</text>
            </view>
          </view>
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

// 生成匹配记录的唯一配对键（按 cuteId 对排序拼接，避免不同方向被误判为不同记录）
const buildPairKey = (r) => {
  const a = r.recipient_cuteid || r.userA?.cuteId || '';
  const b = r.initiator_cuteid || r.userB?.cuteId || '';
  if (!a || !b) return '';
  return a < b ? `${a}|${b}` : `${b}|${a}`;
};

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
    let allRecords;
    if (cloudRecords.length > 0) {
      const cloudPairKeys = new Set();
      for (const cr of cloudRecords) {
        const key = cr._pairKey || buildPairKey(cr);
        if (key) cloudPairKeys.add(key);
      }
      // 补充本地有但云端没有的记录
      for (const lr of localRecords) {
        const key = buildPairKey(lr);
        if (key && !cloudPairKeys.has(key)) {
          cloudRecords.push(lr);
          cloudPairKeys.add(key);
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
  _pairKey: buildPairKey(cr),
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
  let myCuteId, friendCuteId;

  // 用 cuteId 匹配确定本人和好友
  if (item.userA?.cuteId === currentCuteId) {
    myCuteId = currentCuteId;
    friendCuteId = item.userB?.cuteId || '';
  } else if (item.userB?.cuteId === currentCuteId) {
    myCuteId = currentCuteId;
    friendCuteId = item.userA?.cuteId || '';
  } else {
    myCuteId = currentCuteId;
    friendCuteId = item.userA?.cuteId || '';
  }

  let myPersonality = '';
  // 先从 item 中找本人人格类型
  if (item.userA?.cuteId === currentCuteId) {
    myPersonality = item.userA?.personalityCode || '';
  } else if (item.userB?.cuteId === currentCuteId) {
    myPersonality = item.userB?.personalityCode || '';
  }
  // 如果云端记录缺 personalityCode，用当前用户的最新记录回退
  if (!myPersonality) {
    const records = userStore.userData.analysis_records;
    if (records && records.length > 0) {
      // 按 timestamp 取最新记录
      myPersonality = records.reduce((a, b) => (a.timestamp > b.timestamp ? a : b)).personality || '';
    }
  }

  let friendPersonality = '';
  if (!friendPersonality) {
    // 从 matchResultsMap 查找好友的人格类型
    const matchResultsMap = uni.getStorageSync('matchResultsMap') || {};
    const savedForFriend = matchResultsMap[friendCuteId];
    if (savedForFriend) {
      if (savedForFriend.userA?.cuteId === friendCuteId) {
        friendPersonality = savedForFriend.userA.personalityCode || savedForFriend.userA.personality || '';
      } else if (savedForFriend.userB?.cuteId === friendCuteId) {
        friendPersonality = savedForFriend.userB.personalityCode || savedForFriend.userB.personality || '';
      }
    }
    // 仍然没有，从 matchResultByFriend 按好友 cuteId 查找
    if (!friendPersonality) {
      const matchResultByFriend = uni.getStorageSync('matchResultByFriend') || {};
      const savedResult = matchResultByFriend[friendCuteId];
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
  // 按 cuteId 对去重
  const seen = {};
  const deduped = [];
  for (const r of matchRecords.value) {
    const key = r._pairKey || buildPairKey(r);
    if (!key) { deduped.push(r); continue; }
    const prev = seen[key];
    if (prev !== undefined) {
      // 同一对组合出现在 1 小时内 → 视为重复记录
      if (Math.abs((r.timestamp || 0) - prev) < 3600000) {
        continue;
      }
    }
    seen[key] = r.timestamp || 0;
    deduped.push(r);
  }
  // userA = 接收方(target)，userB = 发起方(initiator)
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
  if (matchData.levelName) return matchData.levelName;
  if (matchData.relationName) return matchData.relationName;
  return '未知关系';
};

// spec → 编号映射
const SPEC_ID_MAP = {
  drain_relation:'001', last_card:'005', power_clash:'008', greatest_love:'011',
  soul_accomplice:'014', money_partners:'017', better_with_time:'020',
  another_me:'023', destined_partner:'026', right_beside_you:'029',
  certified_fool:'032', former_path:'035',
};
// spec → 等级
const RANK_MAP = {
  drain_relation:'EXR', last_card:'SSR', power_clash:'SSR', greatest_love:'SSR',
  soul_accomplice:'SSR', money_partners:'SSR', better_with_time:'SR',
  another_me:'R', destined_partner:'R', right_beside_you:'R',
  certified_fool:'R', former_path:'N',
};
const getRelationId = (md) => {
  var spec = md?.spec || md?._dbKey;
  if (!spec) return '';
  return '#' + (SPEC_ID_MAP[spec] || '');
};
const getRelationLevel = (md) => {
  var spec = md?.spec || md?._dbKey;
  if (!spec) return '';
  return RANK_MAP[spec] || '';
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  let ts = timestamp;
  if (ts && ts.toString().length === 10) {
    ts = ts * 1000;
  }
  const date = new Date(ts);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
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

  trendAnalysisRecords.value = [...records]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10)
    .map(view => ({
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
  height: 220px;
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
  font-size: 32rpx;
  font-weight: 700;
  color: #000;
}

.timeline-mode-tag {
  padding: 8rpx 20rpx;
  border-radius: 60rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.timeline-id-tag {
  background-color: #000000;
  color: #ffffff;
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
  padding: 10rpx 0;
  margin: 10rpx 0;
  display: block;
}

button::after {
  border: none;
}
</style>
