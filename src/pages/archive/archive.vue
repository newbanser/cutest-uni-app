<template>
  <view class="page-container">
    <view class="card avatar-card" v-if="personalityData">
      <view class="avatar-content">
        <image class="personality-avatar" :src="personalityData.avatar" mode="aspectFill"></image>
        <view class="avatar-info">
          <text class="personality-name">{{ personalityData.name }}</text>
          <text class="personality-number">人格代码：{{ personalityData.number }}</text>
        </view>
      </view>
      <image class="camp-badge" v-if="personalityData.campBadgeIcon" :src="personalityData.campBadgeIcon" mode="aspectFit"></image>
    </view>

    <view class="card camp-card" v-if="personalityData && personalityData.camp">
      <view class="card-title">所属阵营</view>
      <text class="camp-value">{{ personalityData.camp }}</text>
    </view>

    <view class="card dimensions-card" v-if="personalityData && personalityData.dimensionTags">
      <view class="card-title">维度标签</view>
      <view class="dimensions">
        <text class="dimension-tag" v-for="(tag, index) in personalityData.dimensionTags" :key="index">{{ tag }}</text>
      </view>
    </view>

    <view class="card description-card" v-if="personalityData && personalityData.description">
      <view class="card-title">人格概述</view>
      <text class="description-value">{{ personalityData.description }}</text>
    </view>

    <view class="card traits-card" v-if="personalityData && personalityData.traits">
      <view class="card-title">天赋特质</view>
      <view class="traits-list">
        <view v-for="(trait, index) in personalityData.traits" :key="index" class="trait-tag">{{ trait }}</view>
      </view>
    </view>

    <view class="card interpretation-card" v-if="personalityData && personalityData.interpretation">
      <view class="card-title">人格解读</view>
      <text class="interpretation-value">{{ personalityData.interpretation }}</text>
    </view>

    <text class="tip-text">人格介绍仅供参考，不能代替专业心理评估</text>
  </view>
</template>

<script>
import personalitiesData from '@/data/personalities';
import { getPersonalityAvatar, getCampIconUrl } from '@/utils/imageHelper';

export default {
  data() {
    return {
      personalityCode: '',
      personalityData: null,
      personalities: null
    };
  },
  created() {
    this.personalities = personalitiesData.personalitiesData.personalities;
    console.log('created hook: personalities is', this.personalities);
    console.log('created hook: personalities["ISTP"]', this.personalities['ISTP']);
  },
  onLoad(options) {
    console.log('onLoad options:', options);
    if (options && options.code) {
      this.personalityCode = options.code.toUpperCase();
    }
    console.log('onLoad personalityCode:', this.personalityCode);
    this.loadPersonalityDetail();
  },
  methods: {
    loadPersonalityDetail() {
      console.log('loadPersonalityDetail called, code:', this.personalityCode);
      console.log('this.personalities object:', this.personalities);
      
      if (this.personalities && this.personalityCode && this.personalities[this.personalityCode]) {
        const info = this.personalities[this.personalityCode];
        this.personalityData = {
          ...info,
          avatar: getPersonalityAvatar(this.personalityCode),
          campBadgeIcon: getCampIconUrl(this.personalityCode)
        };
        console.log('Set personalityData with personalityCode:', this.personalityData);
      } else {
        console.error('this.personalities or this.personalities[this.personalityCode] is falsy! Using unknown.');
        const info = this.personalities['unknown'];
        this.personalityData = {
          ...info,
          avatar: getPersonalityAvatar('unknown'),
          campBadgeIcon: getCampIconUrl('unknown')
        };
      }
    }
  }
};
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

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid #e0e0e0;
}

.avatar-card {
  position: relative;
  padding: 32rpx 28rpx;
}

.avatar-content {
  display: flex;
  align-items: center;
}

.personality-avatar {
  width: 160rpx;
  height: 160rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.avatar-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.personality-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 8rpx;
}

.personality-number {
  font-size: 24rpx;
  color: #646464;
}

.camp-badge {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 180rpx;
  height: 180rpx;
  opacity: 0.1;
  z-index: 1;
}

.camp-value {
  font-size: 28rpx;
  color: #000000;
  line-height: 1.6;
}

.dimensions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.dimension-tag {
  background-color: #000000;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
  padding: 8rpx 20rpx;
  border-radius: 60rpx;
  white-space: nowrap;
}

.description-value {
  font-size: 28rpx;
  color: #000000;
  line-height: 1.6;
}

.traits-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.trait-tag {
  background: #000000;
  color: #ffffff;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
}

.interpretation-value {
  font-size: 28rpx;
  color: #000000;
  line-height: 1.8;
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
</style>
