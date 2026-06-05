<template>
  <view class="page-container">
    <view class="fullscreen-bg"></view>
    
    <view class="result-card">
      <view class="relation-section">
        <text class="relation-emoji">{{ matchData.color || '⚪' }}</text>
        <text class="relation-name">{{ matchData.relationName || '未知关系' }}</text>
        <text class="relation-level" v-if="matchData.level">等级：{{ matchData.level }}</text>
      </view>
      
      <view class="score-section">
        <view class="score-ring">
          <view class="score-inner">
            <text class="score-value">{{ matchData.matchScore || matchScore }}</text>
            <text class="score-unit">%</text>
          </view>
        </view>
        <text class="score-label">{{ getScoreLabel() }}</text>
      </view>
      
      <view class="comparison-section">
        <view class="person-item">
          <view class="person-avatar">
            <text class="avatar-text">{{ myType.charAt(0) }}</text>
          </view>
          <text class="person-type">{{ myType }}</text>
          <text class="person-label">我的人格</text>
        </view>
        
        <view class="vs-icon">VS</view>
        
        <view class="person-item">
          <view class="person-avatar friend">
            <text class="avatar-text">{{ friendType.charAt(0) }}</text>
          </view>
          <text class="person-type">{{ friendType }}</text>
          <text class="person-label">好友人格</text>
        </view>
      </view>
      
      <view class="detail-section" v-if="matchData.validCount !== undefined">
        <text class="section-title">匹配详情</text>
        <view class="detail-list">
          <view class="detail-item">
            <text class="detail-label">有效维度</text>
            <text class="detail-value">{{ matchData.validCount }}/4</text>
          </view>
          <view class="detail-item" v-if="matchData.xCount !== undefined">
            <text class="detail-label">X总数</text>
            <text class="detail-value">{{ matchData.xCount }}</text>
          </view>
          <view class="detail-item" v-if="matchData.rawM !== undefined">
            <text class="detail-label">匹配系数</text>
            <text class="detail-value">{{ matchData.rawM.toFixed(2) }}</text>
          </view>
        </view>
      </view>
      
      <view class="description-section">
        <text class="section-title">关系解读</text>
        <text class="description-text">{{ matchData.description || matchDescription }}</text>
      </view>
      
      <view class="action-buttons">
        <button class="action-btn secondary" @tap="goBack">返回</button>
        <button class="action-btn primary" @tap="shareResult">分享结果</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';

const myID = ref('');
const friendID = ref('');
const matchScore = ref(50);
const matchData = ref({});

const myType = ref('');
const friendType = ref('');
const dimensionResults = ref([]);
const matchDescription = ref('');

const dimensionNames = ['外向(E)/内向(I)', '感觉(S)/直觉(N)', '思维(T)/情感(F)', '判断(J)/感知(P)'];

onMounted(() => {
  console.log('=== crush-result onMounted 开始 ===');
  
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || {};
  
  console.log('当前 URL 参数 options:', options);
  
  myID.value = decodeURIComponent(options.myID || '');
  friendID.value = decodeURIComponent(options.friendID || '');
  
  let hasGotMatchData = false;
  
  // 1. 优先从 URL 参数的 matchResult 读取
  if (options.matchResult) {
    try {
      const parsed = JSON.parse(decodeURIComponent(options.matchResult));
      if (parsed && parsed.relationName) {
        matchData.value = parsed;
        hasGotMatchData = true;
        console.log('✅ 从 URL 参数获取匹配结果:', matchData.value);
      }
    } catch (e) {
      console.error('❌ 解析 URL matchResult 失败:', e);
    }
  }
  
  // 2. 如果 URL 没有，再看本地存储
  if (!hasGotMatchData) {
    const savedMatchResult = uni.getStorageSync('matchResult');
    console.log('📦 从本地存储读取 matchResult:', savedMatchResult);
    
    if (savedMatchResult && savedMatchResult.matchData) {
      matchData.value = savedMatchResult.matchData;
      hasGotMatchData = true;
      console.log('✅ 从本地存储获取 matchData:', matchData.value);
    }
  }
  
  console.log('hasGotMatchData:', hasGotMatchData, '当前 matchData:', matchData.value);
  
  if (!hasGotMatchData) {
    uni.showToast({
      title: '匹配数据丢失',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return;
  }
  
  // 从 matchResult 正确获取人格类型（必须来自测试数据）
  const matchResult = uni.getStorageSync('matchResult');
  if (matchResult) {
    // 我的数据（userB）
    if (matchResult.userB) {
      myType.value = matchResult.userB.personalityCode || matchResult.userB.personality || '未知';
    }
    // 好友的数据（userA）
    if (matchResult.userA) {
      friendType.value = matchResult.userA.personalityCode || matchResult.userA.personality || '未知';
    }
  }
  
  // 设置 matchScore
  matchScore.value = matchData.value.matchScore || 50;
  
  console.log('人格类型（来自测试数据）:', { myID: myID.value, friendID: friendID.value, myType: myType.value, friendType: friendType.value });
  
  // 计算维度和生成描述
  calculateDimensions();
  generateDescription();
});

const calculateDimensions = () => {
  const dimensions = ['E/I', 'S/N', 'T/F', 'J/P'];
  
  dimensionResults.value = dimensions.map((dim, index) => {
    const myValue = myType.value.charAt(index);
    const friendValue = friendType.value.charAt(index);
    const match = myValue === friendValue;
    
    return {
      name: dimensionNames[index],
      myValue: myValue,
      friendValue: friendValue,
      match: match
    };
  });
};

const getScoreLabel = () => {
  if (matchScore.value >= 80) return '天作之合 💕';
  if (matchScore.value >= 60) return '志同道合 💪';
  if (matchScore.value >= 40) return '互补相长 🌱';
  return '有待磨合 🤝';
};

const generateDescription = () => {
  const descriptions = {
    high: '你们的人格类型高度匹配！在四个维度上都有着相似的认知方式和价值观。这种默契让你们能够快速理解彼此，相处起来非常轻松愉快。珍惜这份缘分吧！',
    medium: '你们有不少相似之处，也有一些互补的地方。这种组合既能带来共鸣，也能带来新鲜视角。好好沟通，你们会成为很好的朋友或伴侣！',
    low: '你们的性格差异较大，看待世界的方式很不同。这可能会带来一些挑战，但也意味着你们可以从对方身上学到很多。理解和包容是关键！'
  };
  
  if (matchScore.value >= 80) {
    matchDescription.value = descriptions.high;
  } else if (matchScore.value >= 40) {
    matchDescription.value = descriptions.medium;
  } else {
    matchDescription.value = descriptions.low;
  }
};

const goBack = () => {
  uni.navigateBack();
};

const userStore = useUserStore();

onShareAppMessage(() => {
  return {
    title: '来测测你的81型融合人格吧！',
    path: '/pages/index/index',
    imageUrl: ''
  };
});

onShareTimeline(() => {
  const cuteId = userStore.userData.cuteId || '';
  return {
    title: `81型融合人格测试 - 我的密语：${cuteId}`,
    query: `from=${cuteId}`,
    imageUrl: ''
  };
});

const shareResult = () => {
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none'
  });
};
</script>

<style lang="scss">
button::after {
  border: none;
}

.page-container {
  min-height: 100vh;
  padding: 30rpx;
  padding-top: 120rpx;
}

.fullscreen-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  z-index: -1;
}

.result-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.relation-section {
  text-align: center;
  margin-bottom: 30rpx;
  padding: 30rpx;
  background: linear-gradient(135deg, #fff5f7 0%, #ffffff 100%);
  border-radius: 16rpx;
}

.relation-emoji {
  font-size: 80rpx;
  display: block;
  margin-bottom: 10rpx;
}

.relation-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #FA325A;
  display: block;
  margin-bottom: 8rpx;
}

.relation-level {
  font-size: 24rpx;
  color: #999999;
  display: block;
}

.score-section {
  text-align: center;
  margin-bottom: 40rpx;
}

.score-ring {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: conic-gradient(#FA325A 0deg, #FF6B8A 360deg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: #ffffff;
  }
}

.score-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.score-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #FA325A;
}

.score-unit {
  font-size: 24rpx;
  color: #FA325A;
  margin-left: 5rpx;
}

.score-label {
  font-size: 32rpx;
  font-weight: bold;
  color: #000000;
}

.comparison-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.person-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.person-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FA325A 0%, #FF6B8A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15rpx;
  
  &.friend {
    background: linear-gradient(135deg, #FA325A 0%, #FF6B8A 100%);
  }
}

.avatar-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
}

.person-type {
  font-size: 28rpx;
  font-weight: bold;
  color: #000000;
  margin-bottom: 5rpx;
}

.person-label {
  font-size: 22rpx;
  color: #666666;
}

.vs-icon {
  font-size: 28rpx;
  font-weight: bold;
  color: #FA325A;
  padding: 10rpx 20rpx;
  background: #fff5f7;
  border-radius: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #000000;
  margin-bottom: 20rpx;
  display: block;
}

.dimension-section {
  margin-bottom: 30rpx;
}

.dimension-list {
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 20rpx;
}

.dimension-item {
  display: flex;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #eeeeee;
  
  &:last-child {
    border-bottom: none;
  }
}

.dimension-name {
  width: 140rpx;
  font-size: 24rpx;
  color: #666666;
  flex-shrink: 0;
}

.dimension-bar {
  flex: 1;
  height: 16rpx;
  background: #e0e0e0;
  border-radius: 8rpx;
  margin: 0 20rpx;
  overflow: hidden;
}

.dimension-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.5s ease;
  
  &.matched {
    background: linear-gradient(90deg, #FA325A 0%, #FF6B8A 100%);
  }
  
  &.unmatched {
    background: linear-gradient(90deg, #FA325A 0%, #FF6B8A 100%);
    opacity: 0.5;
  }
}

.dimension-result {
  width: 80rpx;
  font-size: 24rpx;
  color: #999999;
  text-align: right;
  font-family: monospace;
}

.detail-section {
  margin-bottom: 30rpx;
}

.detail-list {
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  gap: 20rpx;
}

.detail-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.detail-label {
  font-size: 22rpx;
  color: #999999;
}

.detail-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #FA325A;
}

.description-section {
  margin-bottom: 40rpx;
}

.description-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.8;
  background: #f5f5f5;
  padding: 20rpx;
  border-radius: 16rpx;
  border-left: 6rpx solid #FA325A;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  
  &.primary {
    background: #FA325A;
    color: #ffffff;
  }
  
  &.secondary {
    background: #ffffff;
    color: #000000;
    border: 2rpx solid #e0e0e0;
  }
}
</style>