<template>
  <view class="page-container">
    <!-- 顶部Tab切换 -->
    <view class="tabs-container">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'personality' }"
        @tap="switchTab('personality')"
      >
        <text class="tab-text">人格图鉴库</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'match' }"
        @tap="switchTab('match')"
      >
        <text class="tab-text">关系图鉴库</text>
      </view>
    </view>
    
    <!-- 人格图鉴库内容 -->
    <view v-if="activeTab === 'personality'">
      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">基本人格</text>
            <text class="category-count">{{ categoryStats.basic.unlocked }} / {{ categoryStats.basic.total }}</text>
          </view>
          <view class="personality-grid">
            <view
              v-for="code in basicPersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="goToDetail(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="hasRecord(code)" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">特别隐藏</text>
            <text class="category-count">{{ categoryStats.special.unlocked }} / {{ categoryStats.special.total }}</text>
          </view>
          <view class="personality-grid">
            <view
              v-for="code in specialPersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="goToDetail(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="hasRecord(code)" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">稀世隐藏</text>
            <text class="category-count">{{ categoryStats.rare.unlocked }} / {{ categoryStats.rare.total }}</text>
          </view>
          <view class="personality-grid">
            <view
              v-for="code in rarePersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="goToDetail(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="hasRecord(code)" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">至臻隐藏</text>
            <text class="category-count">{{ categoryStats.epic.unlocked }} / {{ categoryStats.epic.total }}</text>
          </view>
          <view class="personality-grid">
            <view
              v-for="code in epicPersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="goToDetail(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="hasRecord(code)" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">限定隐藏</text>
            <text class="category-count">{{ categoryStats.legendary.unlocked }} / {{ categoryStats.legendary.total }}</text>
          </view>
          <view class="personality-grid limited-grid">
            <view
              v-for="code in legendaryPersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="goToDetail(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="hasRecord(code)" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="tip-text">
        已解锁 {{ unlockedCount }} 种人格，继续测试解锁更多
      </view>
    </view>
    
    <!-- 关系图鉴库内容 -->
    <view v-else>
      <view class="card empty-match-card">
        <text class="empty-match-icon">💕</text>
        <text class="empty-match-text">暂无关系图鉴</text>
        <text class="empty-match-tip">完成关系测试后，图鉴将显示在这里</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getPersonalityAvatar } from '@/utils/imageHelper';

const userStore = useUserStore();

const activeTab = ref('personality');

const analysisRecords = ref([]);
const totalAnalysis = ref(0);
const recordCounts = ref({});

const loadUserData = () => {
  userStore.loadUserData();
  const records = userStore.userData.analysis_records || [];
  analysisRecords.value = records;
  totalAnalysis.value = records.length;
  
  const counts = {};
  records.forEach(record => {
    const personality = (record.personality || 'unknown').toLowerCase();
    counts[personality] = (counts[personality] || 0) + 1;
  });
  recordCounts.value = counts;
};

const hasRecord = (code) => {
  const lowerCode = code.toLowerCase();
  return recordCounts.value[lowerCode] > 0;
};

const getCount = (code) => {
  const lowerCode = code.toLowerCase();
  return recordCounts.value[lowerCode] || 0;
};

const basicPersonalities = ['istp', 'isfp', 'estp', 'esfp', 'infj', 'infp', 'enfj', 'enfp', 'istj', 'isfj', 'estj', 'esfj', 'intj', 'intp', 'entj', 'entp'];
const specialPersonalities = ['xstj', 'xstp', 'xsfj', 'xsfp', 'xntj', 'xntp', 'xnfj', 'xnfp', 'ixtj', 'ixtp', 'ixfj', 'ixfp', 'extj', 'extp', 'exfj', 'exfp', 'isxj', 'isxp', 'inxj', 'inxp', 'esxj', 'esxp', 'enxj', 'enxp', 'istx', 'isfx', 'intx', 'infx', 'estx', 'esfx', 'entx', 'enfx'];
const rarePersonalities = ['xxtj', 'xxtp', 'xxfj', 'xxfp', 'xsxj', 'xsxp', 'xnxj', 'xnxp', 'xstx', 'xsfx', 'xntx', 'xnfx', 'ixxj', 'ixxp', 'exxj', 'exxp', 'ixtx', 'ixfx', 'extx', 'exfx', 'isxx', 'inxx', 'esxx', 'enxx'];
const epicPersonalities = ['ixxx', 'exxx', 'xsxx', 'xnxx', 'xxtx', 'xxfx', 'xxxj', 'xxxp'];
const legendaryPersonalities = ['xxxx'];

const totalPersonalities = 81;

const categoryStats = computed(() => ({
  basic: {
    unlocked: basicPersonalities.filter(code => hasRecord(code)).length,
    total: basicPersonalities.length
  },
  special: {
    unlocked: specialPersonalities.filter(code => hasRecord(code)).length,
    total: specialPersonalities.length
  },
  rare: {
    unlocked: rarePersonalities.filter(code => hasRecord(code)).length,
    total: rarePersonalities.length
  },
  epic: {
    unlocked: epicPersonalities.filter(code => hasRecord(code)).length,
    total: epicPersonalities.length
  },
  legendary: {
    unlocked: legendaryPersonalities.filter(code => hasRecord(code)).length,
    total: legendaryPersonalities.length
  }
}));

const unlockedCount = computed(() => {
  return Object.keys(recordCounts.value).filter(code => code !== 'unknown' && recordCounts.value[code] > 0).length;
});

const switchTab = (tab) => {
  activeTab.value = tab;
};

const goToDetail = (code) => {
  console.log('goToDetail called with code:', code);
  uni.navigateTo({
    url: `/pages/archive/archive?code=${code}`
  });
};

onMounted(() => {
  loadUserData();
});

onShow(() => {
  loadUserData();
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
  padding-bottom: 20rpx;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
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

.category-section {
  margin-bottom: 24rpx;
}

.category-card {
  padding: 32rpx;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid #e0e0e0;
}

.category-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
}

.category-count {
  font-size: 24rpx;
  font-weight: 500;
  color: #666666;
}

.personality-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28rpx;
  row-gap: 36rpx;
  padding: 16rpx;
}

.limited-grid {
  display: flex;
  justify-content: center;
}

.personality-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  width: 110rpx;
  height: 110rpx;
}

.personality-item.locked {
  opacity: 0.35;
}

.personality-item.unlocked {
  opacity: 1;
}

.personality-badge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  background-color: #ff3b30;
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 700;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
  z-index: 10;
  border: 1px solid #e0e0e0;
}

.personality-avatar {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
}

.tip-text {
  font-size: 26rpx;
  color: #999999;
  text-align: center;
  padding: 30rpx 0;
  margin-top: 20rpx;
  display: block;
}

/* 关系图鉴空白卡片 */
.empty-match-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
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
</style>
