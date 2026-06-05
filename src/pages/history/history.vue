<template>
  <view class="page-container">
    <view class="fullscreen-bg"></view>
    
    <view class="content-area">
      <!-- 顶部Tab切换 -->
      <view class="tabs-container">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'personality' }"
          @tap="switchTab('personality')"
        >
          <text class="tab-text">人格测试记录</text>
        </view>
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'match' }"
          @tap="switchTab('match')"
        >
          <text class="tab-text">关系测试记录</text>
        </view>
      </view>
      
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
        <view class="card empty-match-card">
          <text class="empty-match-icon">💕</text>
          <text class="empty-match-text">暂无关系测试记录</text>
          <text class="empty-match-tip">完成关系测试后，记录将显示在这里</text>
        </view>
      </view>

      <text class="tip-text">本分析仅供娱乐参考，不能代替专业心理评估</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import personalitiesData from '@/data/personalities';
import TrendChart from '@/components/TrendChart.vue';
import { useUserStore } from '@/stores/user';

const { personalities } = personalitiesData.personalitiesData;
const userStore = useUserStore();

const activeTab = ref('personality');

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
};

onMounted(() => {
  refreshTrendData();
});

onShow(() => {
  refreshTrendData();
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

/* Tab切换样式 */
.tabs-container {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.tab-item {
  flex: 1;
  padding: 28rpx;
  text-align: center;
  border-radius: 16rpx;
  background-color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.tab-item.active {
  /* 选中状态无背景变化 */
}

.tab-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #606060;
}

.tab-item.active .tab-text {
  color: #000000;
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

/* 关系测试空白卡片 */
.empty-match-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-match-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-match-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12rpx;
}

.empty-match-tip {
  font-size: 24rpx;
  color: #646464;
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

.timeline-time-value {
  font-size: 26rpx;
  color: #333333;
}

.tip-text {
  font-size: 24rpx;
  color: #646464;
  line-height: 1.6;
  text-align: center;
  padding: 20rpx 0 10rpx;
  margin-top: 20rpx;
  margin-bottom: 10rpx;
  display: block;
}
</style>
