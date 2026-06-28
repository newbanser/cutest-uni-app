<template>
  <view class="page-container">
    <view class="content-area">
      <view class="changelog-card">
        <text class="section-title">写在前面</text>
        <text class="intro-content">我们的人格是动态变化的，我们与她或他的关系也应该是动态变化的。</text>
        <text class="intro-content">作为一名intj，我希望通过这个小程序，认清自己的同时，对复杂多变的关系做出合理解析，帮助我们看到本质。</text>
      </view>
      <view class="changelog-card">
        <text class="section-title">联系我们</text>
        <text class="intro-content">新版本上线，有问题请微信私信我 HGH_SHE</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';

onShow(() => {
  // 可以在这里加载更新内容
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx 24rpx 20rpx;
}

.intro-content {
  display: block;
  font-size: 28rpx;
  color: #666666;
  line-height: 1.8;
  text-align: justify;
  margin-bottom: 16rpx;
}

.intro-content:last-child {
  margin-bottom: 0;
}

.content-area {
  padding-bottom: 50rpx;
}

.changelog-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 36rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 20rpx;
}
</style>
