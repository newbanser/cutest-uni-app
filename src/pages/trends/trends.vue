<template>
  <view class="page-container">
    <!-- 综合人格卡片 -->
    <view class="card personality-card" v-if="comprehensivePersonality">
      <text class="personality-title">综合人格</text>
      <view class="personality-main">
        <view class="personality-content">
          <image class="personality-avatar" :src="comprehensivePersonality.personalityAvatar" mode="aspectFill"></image>
          <view class="personality-info">
            <view class="personality-header">
              <text class="personality-name">{{ comprehensivePersonality.personalityName }}</text>
            </view>
            <text class="camp-name">{{ comprehensivePersonality.campName }}</text>
            <view class="dimensions" v-if="comprehensivePersonality.dimensions && comprehensivePersonality.dimensions.length > 0">
              <text class="dimension-tag" v-for="(item, index) in comprehensivePersonality.dimensions" :key="index">{{ item }}</text>
            </view>
          </view>
        </view>
      </view>
      <text class="description">{{ comprehensivePersonality.description }}</text>
    </view>
    
    <!-- 综合评价卡片 -->
    <view class="card evaluation-card" v-if="hasFirstAnalysis">
      <view class="evaluation-title">综合评价</view>
      <view class="evaluation-intro">基于近十次有效解析的综合评估，得出的倾向与分值</view>
      <view class="dimension-list">
        <view class="dimension-item" v-for="dim in dimensionData" :key="dim.key">
          <view class="dimension-top">
            <view class="dimension-name">{{ dim.name }}</view>
            <view class="dimension-label">{{ dim.label }}</view>
          </view>
          <view class="mini-bar">
            <view class="mini-fill" :style="{ width: dim.score + '%' }">
              <text class="mini-text">{{ dim.score }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="card curve-card" v-if="showCurveCard">
      <text class="curve-title">趋势曲线</text>
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
        <TrendChart v-if="hasHistory" :dimension="activeCurve" :data="chartData" />
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

    <view class="tip-text">
      仅展示最近十次追踪的解析结果
    </view>

    <view class="timeline">
      <view class="timeline-item" v-for="(item, index) in analysisRecords" :key="index">
        <view class="card timeline-card" @tap="viewDetail(item)">
          <text class="personality-name">{{ item.personality }}</text>
          <text class="time-value">{{ item.formattedDate }} {{ item.formattedTime }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import scoring from '@/utils/scoring';
import TrendChart from '@/components/TrendChart.vue';
import personalitiesData from '@/data/personalities';
import { getPersonalityAvatar } from '@/utils/imageHelper';

const userStore = useUserStore();
const { personalities } = personalitiesData.personalitiesData;

const curveTabs = ref([
  { key: 'EI', label: '能量' },
  { key: 'SN', label: '认知' },
  { key: 'TF', label: '决策' },
  { key: 'JP', label: '态度' }
]);
const activeCurve = ref('EI');
const showCurveCard = ref(true);
const refreshKey = ref(0);

// 用一个版本号来强制触发 computed 重新计算
const version = ref(0);

const getMostFrequentType = (views) => {
  if (!views || views.length === 0) return '-';

  const typeCount = {};
  views.forEach(view => {
    const type = view.personality;
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  let maxCount = 0;
  let mostFrequent = '-';
  Object.keys(typeCount).forEach(type => {
    if (typeCount[type] > maxCount) {
      maxCount = typeCount[type];
      mostFrequent = type;
    }
  });

  return mostFrequent;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 使用 ref 变量，确保能强制更新
const analysisRecords = ref([]);
const analysisCount = ref(0);
const mostFrequentType = ref('-');
const hasHistory = ref(false);
const hasFirstAnalysis = ref(false);
const suggestion = ref('');
const suggestionStyle = ref('default');
const chartData = ref([]);

// 综合人格相关数据
const comprehensivePersonality = ref(null);
const hasComprehensivePersonality = ref(false);
const dimensionData = ref([]);

// 计算四个维度数据的函数
const calculateDimensionData = (records) => {
  if (!records || !Array.isArray(records) || records.length === 0) return [];
  
  const recentRecords = [...records].reverse().slice(0, 10);
  
  // 计算四个维度的平均分值
  let totalE = 0, totalI = 0, totalS = 0, totalN = 0;
  let totalT = 0, totalF = 0, totalJ = 0, totalP = 0;
  let validRecordCount = 0;
  
  recentRecords.forEach(record => {
    if (record) {
      const scores = record.raw_scores || record.rolling_scores || record.percentages || {};
      totalE += scores.E || 0;
      totalI += scores.I || 0;
      totalS += scores.S || 0;
      totalN += scores.N || 0;
      totalT += scores.T || 0;
      totalF += scores.F || 0;
      totalJ += scores.J || 0;
      totalP += scores.P || 0;
      validRecordCount++;
    }
  });
  
  if (validRecordCount === 0) return [];
  
  const count = validRecordCount;
  const avgRawScores = {
    E: totalE / count,
    I: totalI / count,
    S: totalS / count,
    N: totalN / count,
    T: totalT / count,
    F: totalF / count,
    J: totalJ / count,
    P: totalP / count
  };
  
  const THRESHOLD = 10;
  const dimensions = [
    {
      key: 'EI',
      name: '能量取向',
      left: 'E',
      right: 'I',
      leftName: '外倾',
      rightName: '内倾'
    },
    {
      key: 'SN',
      name: '认知方式',
      left: 'S',
      right: 'N',
      leftName: '实感',
      rightName: '直觉'
    },
    {
      key: 'TF',
      name: '判断方式',
      left: 'T',
      right: 'F',
      leftName: '思考',
      rightName: '情感'
    },
    {
      key: 'JP',
      name: '生活态度',
      left: 'J',
      right: 'P',
      leftName: '判断',
      rightName: '感知'
    }
  ];
  
  return dimensions.map(dim => {
    const leftScore = avgRawScores[dim.left];
    const rightScore = avgRawScores[dim.right];
    const total = leftScore + rightScore;
    
    let label = '';
    let score = 50;
    
    if (total > 0) {
      const leftPercent = Math.round((leftScore / total) * 100);
      const diffPercent = Math.abs(leftScore - rightScore) / total * 100;
      
      if (diffPercent >= THRESHOLD) {
        if (leftScore >= rightScore) {
          label = `${dim.leftName}-${dim.left}`;
          score = leftPercent;
        } else {
          label = `${dim.rightName}-${dim.right}`;
          score = 100 - leftPercent;
        }
      } else {
        label = '融合-X';
        score = leftPercent;
      }
    } else {
      label = '融合-X';
      score = 50;
    }
    
    return {
      key: dim.key,
      name: dim.name,
      label: label,
      score: score
    };
  });
};

// 计算 chartData 的函数
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

// 计算综合人格的函数
const calculateComprehensivePersonality = (records) => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    hasComprehensivePersonality.value = false;
    return null;
  }
  
  const recentRecords = [...records].reverse().slice(0, 10);
  
  // 计算四个维度的平均分值
  let totalE = 0, totalI = 0, totalS = 0, totalN = 0;
  let totalT = 0, totalF = 0, totalJ = 0, totalP = 0;
  let validRecordCount = 0;
  
  recentRecords.forEach(record => {
    if (record) {
      const scores = record.raw_scores || record.rolling_scores || record.percentages || {};
      totalE += scores.E || 0;
      totalI += scores.I || 0;
      totalS += scores.S || 0;
      totalN += scores.N || 0;
      totalT += scores.T || 0;
      totalF += scores.F || 0;
      totalJ += scores.J || 0;
      totalP += scores.P || 0;
      validRecordCount++;
    }
  });
  
  if (validRecordCount === 0) {
    hasComprehensivePersonality.value = false;
    return null;
  }
  
  const count = validRecordCount;
  const avgRawScores = {
    E: totalE / count,
    I: totalI / count,
    S: totalS / count,
    N: totalN / count,
    T: totalT / count,
    F: totalF / count,
    J: totalJ / count,
    P: totalP / count
  };
  
  // 使用与 calculateDimensionData 中相同的逻辑来确定人格类型
  const THRESHOLD = 10;
  let personalityCode = '';
  
  // 能量取向：E vs I
  const eiTotal = avgRawScores.E + avgRawScores.I;
  if (eiTotal > 0) {
    const eiDiff = Math.abs(avgRawScores.E - avgRawScores.I) / eiTotal * 100;
    if (eiDiff >= THRESHOLD) {
      personalityCode += avgRawScores.E >= avgRawScores.I ? 'E' : 'I';
    } else {
      personalityCode += 'X';
    }
  } else {
    personalityCode += 'X';
  }
  
  // 认知方式：S vs N
  const snTotal = avgRawScores.S + avgRawScores.N;
  if (snTotal > 0) {
    const snDiff = Math.abs(avgRawScores.S - avgRawScores.N) / snTotal * 100;
    if (snDiff >= THRESHOLD) {
      personalityCode += avgRawScores.S >= avgRawScores.N ? 'S' : 'N';
    } else {
      personalityCode += 'X';
    }
  } else {
    personalityCode += 'X';
  }
  
  // 判断方式：T vs F
  const tfTotal = avgRawScores.T + avgRawScores.F;
  if (tfTotal > 0) {
    const tfDiff = Math.abs(avgRawScores.T - avgRawScores.F) / tfTotal * 100;
    if (tfDiff >= THRESHOLD) {
      personalityCode += avgRawScores.T >= avgRawScores.F ? 'T' : 'F';
    } else {
      personalityCode += 'X';
    }
  } else {
    personalityCode += 'X';
  }
  
  // 生活态度：J vs P
  const jpTotal = avgRawScores.J + avgRawScores.P;
  if (jpTotal > 0) {
    const jpDiff = Math.abs(avgRawScores.J - avgRawScores.P) / jpTotal * 100;
    if (jpDiff >= THRESHOLD) {
      personalityCode += avgRawScores.J >= avgRawScores.P ? 'J' : 'P';
    } else {
      personalityCode += 'X';
    }
  } else {
    personalityCode += 'X';
  }
  
  // 获取人格信息
  const personalityInfo = personalities[personalityCode] || personalities['unknown'];
  
  hasComprehensivePersonality.value = true;
  
  return {
    personalityAvatar: getPersonalityAvatar(personalityCode),
    personalityName: personalityInfo.name || '未知',
    campName: personalityInfo.camp || '',
    description: personalityInfo.description || '',
    dimensions: personalityInfo.dimensionTags || [],
    personalityCode
  };
};

// 刷新函数 - 每次页面显示时都重新读取 storage
const forceRefresh = () => {
  // 直接从 storage 读取最新数据
  const saved = uni.getStorageSync('userData');
  const records = saved?.analysis_records || [];
  
  // 直接更新所有字段
  analysisRecords.value = [...records].reverse().slice(0, 10).map(view => ({
    ...view,
    formattedDate: formatDate(view.timestamp),
    formattedTime: formatTime(view.timestamp)
  }));
  
  analysisCount.value = records.length;
  mostFrequentType.value = getMostFrequentType(records);
  hasHistory.value = records.length >= 2;
  hasFirstAnalysis.value = records.length >= 1;
  chartData.value = calculateChartData(records);
  
  // 计算综合人格和维度数据
  comprehensivePersonality.value = calculateComprehensivePersonality(records);
  dimensionData.value = calculateDimensionData(records);
};

const viewDetail = (item) => {
  uni.setStorageSync('currentViewId', item.id);
  uni.navigateTo({
    url: '/pages/view/view'
  });
};

const switchCurve = (key) => {
  activeCurve.value = key;
  // 切换曲线类型时也需要重新计算 chartData
  const saved = uni.getStorageSync('userData');
  const records = saved?.analysis_records || [];
  chartData.value = calculateChartData(records);
};

onMounted(() => {
  console.log('Trends onMounted called');
  forceRefresh();
});

onShow(() => {
  console.log('Trends onShow called');
  forceRefresh();
});
</script>

<style lang="scss">
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  background-color: #f4f4f4;
}

.page-container {
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 180rpx;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
}

.card {
  background-color: #ffffff;
  border-radius: 32rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
}

.title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.stats-row {
  display: flex;
  gap: 24rpx;
}

.stat-card {
  flex: 1;
}

.stat-label {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
  display: block;
  margin-bottom: 12rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #000000;
}

.suggestion-card {
  background-color: #ffffff;
  border: 2px solid #000000;
  border-radius: 32rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;
  box-shadow: 6rpx 6rpx 0 #000000;
}

.suggestion-card.default {
  background-color: #ffffff;
}

.suggestion-card.low {
  background-color: #FFF100;
}

.suggestion-card.medium {
  background-color: #FA325A;
}

.suggestion-card.high {
  background-color: #000000;
}

.suggestion-card.high .suggestion-text {
  color: #ffffff;
}

.suggestion-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
  display: block;
  margin-bottom: 16rpx;
}

.suggestion-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #000000;
  line-height: 1.6;
}

.timeline-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-card:active {
  background-color: #FA325A;
}

.timeline-card:active .personality-name,
.timeline-card:active .time-value {
  color: #ffffff;
}

.personality-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.time-value {
  font-size: 26rpx;
  color: #333333;
}

.curve-card {
  padding: 28rpx;
}

.curve-title {
  font-size: 30rpx;
  font-weight: 700;
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
  font-size: 28rpx;
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

.curve-chart {
  width: 100%;
  height: 280px;
}

.curve-canvas {
  width: 100%;
  height: 280px;
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

/* 综合人格卡片样式 */
.personality-card {
  position: relative;
  padding: 28rpx;
}

.personality-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
  display: block;
  margin-bottom: 20rpx;
}

.personality-main {
  display: flex;
  justify-content: center;
}

.personality-content {
  display: flex;
  align-items: center;
}

.personality-avatar {
  width: 160rpx;
  height: 160rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.personality-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.personality-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.personality-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
}

.camp-name {
  font-size: 26rpx;
  color: #646464;
  margin-bottom: 16rpx;
}

.dimensions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.dimension-tag {
  background-color: #000000;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
  padding: 6rpx 16rpx;
  border-radius: 60rpx;
  white-space: nowrap;
}

.description {
  font-size: 26rpx;
  color: #000000;
  line-height: 1.6;
  margin-top: 20rpx;
  display: block;
  text-align: center;
}

/* 综合评价卡片样式 */
.evaluation-card {
  padding: 30rpx;
}

.evaluation-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 16rpx;
}

.evaluation-intro {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
  margin-bottom: 30rpx;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.dimension-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dimension-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #000000;
}

.evaluation-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
}

.evaluation-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 16rpx;
}

.evaluation-intro {
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 24rpx;
  line-height: 1.5;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.dimension-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dimension-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
}

.dimension-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
}

.mini-bar {
  width: 100%;
  height: 40rpx;
  background: #000000;
  border: 4rpx solid #000000;
  border-radius: 16rpx;
  overflow: hidden;
  box-sizing: border-box;
}

.mini-fill {
  height: 100%;
  background: #FA325A;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10rpx 0 0 10rpx;
}

.mini-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
}
</style>
