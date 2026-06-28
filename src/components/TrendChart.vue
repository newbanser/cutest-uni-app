<template>
  <view class="trend-chart-wrapper">
    <view class="chart-header-section">
      <view class="header-item">
        <text class="header-arrow">▲</text>
        <text class="header-label">{{ dimensionInfo.topLabel }}</text>
      </view>
    </view>

    <view class="chart-main-area">
      <view class="bars-wrapper">
        <view
          v-for="(item, index) in chartData"
          :key="index"
          class="bar-unit"
          :style="{ transform: `translateY(${item.offset}rpx)` }"
        >
          <text class="bar-percentage top">{{ item.topPercent }}%</text>
          <view class="bar-container">
            <view class="bar-segment"></view>
          </view>
          <text class="bar-percentage bottom">{{ item.bottomPercent }}%</text>
        </view>
      </view>
      <view class="center-reference-line">
        <view class="line-dot"></view>
        <view class="line-arrow-right"></view>
      </view>
    </view>

    <view class="chart-footer-section">
      <view class="footer-item">
        <text class="footer-arrow">▼</text>
        <text class="footer-label">{{ dimensionInfo.bottomLabel }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  dimension: { type: String, default: 'EI' },
  data: { type: Array, default: () => [] }
});

const dimensionInfoMap = {
  EI: { topLabel: '更偏向外倾-E', bottomLabel: '更偏向内倾-I', topKey: 'E', bottomKey: 'I' },
  SN: { topLabel: '更偏向感觉-S', bottomLabel: '更偏向直觉-N', topKey: 'S', bottomKey: 'N' },
  TF: { topLabel: '更偏向思考-T', bottomLabel: '更偏向情感-F', topKey: 'T', bottomKey: 'F' },
  JP: { topLabel: '更偏向判断-J', bottomLabel: '更偏向感知-P', topKey: 'J', bottomKey: 'P' }
};

const dimensionInfo = computed(() => dimensionInfoMap[props.dimension] || dimensionInfoMap.EI);

const chartData = computed(() => {
  const data = [];
  const validData = Array.isArray(props.data) ? props.data : [];
  const count = validData.length;

  for (let i = 0; i < count; i++) {
    const item = validData[i] || {};
    const score = Number(item.score) || 50;
    
    const topPercent = Math.max(0, Math.min(100, score));
    const bottomPercent = Math.max(0, Math.min(100, 100 - topPercent));
    const offset = (50 - topPercent) * 1.2;

    data.push({
      offset: offset,
      topPercent: topPercent,
      bottomPercent: bottomPercent
    });
  }
  return data;
});
</script>

<style lang="scss">
.trend-chart-wrapper {
  width: 100%;
  padding: 32rpx 24rpx;
  box-sizing: border-box;
}

.chart-header-section {
  display: flex;
  justify-content: center;
  margin-bottom: 0rpx;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.header-arrow {
  font-size: 36rpx;
  color: #FA325A;
  font-weight: bold;
}

.header-label {
  font-size: 24rpx;
  color: #000000;
  font-weight: 700;
}

.chart-main-area {
  position: relative;
  height: 320rpx;
  display: flex;
  align-items: center;
}

.center-reference-line {
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  height: 4rpx;
  background: #000000;
  z-index: 10;
}

.line-dot {
  position: absolute;
  left: -12rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 12rpx;
  height: 12rpx;
  background: #000000;
  border-radius: 50%;
}

.line-arrow-right {
  position: absolute;
  right: -16rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-left: 16rpx solid #000000;
}

.bars-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  z-index: 5;
}

.bar-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36rpx;
  height: 100%;
  justify-content: center;
}

.bar-percentage {
  font-size: 22rpx;
  color: #333333;
  font-weight: 600;
}

.bar-percentage.top {
  margin-bottom: 12rpx;
}

.bar-percentage.bottom {
  margin-top: 12rpx;
}

.bar-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bar-segment {
  width: 30rpx;
  height: 120rpx;
  background: #FA325A;
  border-radius: 15rpx;
  border: 2rpx solid #000000;
  box-shadow: 3rpx 3rpx 0 #000000;
}

.chart-footer-section {
  display: flex;
  justify-content: center;
  margin-top: 0rpx;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.footer-arrow {
  font-size: 36rpx;
  color: #666666;
  font-weight: bold;
}

.footer-label {
  font-size: 24rpx;
  color: #666666;
  font-weight: 700;
}
</style>