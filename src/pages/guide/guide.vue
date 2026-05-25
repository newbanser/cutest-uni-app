<template>
  <view class="page-container">
    <view class="stats-row">
      <view class="card stat-card">
        <text class="stat-label">已解锁</text>
        <text class="stat-value">{{ unlockedCount }} / {{ totalPersonalities }}</text>
      </view>
      <view class="card stat-card">
        <text class="stat-label">解析次数</text>
        <text class="stat-value">{{ totalAnalysis }} 次</text>
      </view>
    </view>

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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getPersonalityAvatar } from '@/utils/imageHelper';

const userStore = useUserStore();

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
  padding-bottom: 180rpx;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
}

.card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
}

.stats-row {
  display: flex;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
}

.stat-label {
  font-size: 26rpx;
  font-weight: 500;
  color: #000000;
  display: block;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 600;
  color: #000000;
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
  border-bottom: 2px solid #000000;
}

.category-title {
  font-size: 30rpx;
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
  gap: 16rpx;
  row-gap: 24rpx;
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
  border: 2px solid #000000;
}

.personality-avatar {
  width: 120rpx;
  height: 120rpx;
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
</style>
