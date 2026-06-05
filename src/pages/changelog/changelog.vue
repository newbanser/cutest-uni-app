<template>
  <view class="page-container">
    <!-- 写在前面 - 独立卡片 -->
    <view class="intro-card">
      <text class="intro-title">写在前面</text>
      <text class="intro-content">我们的人格是动态变化的，我们与她或他的关系也应该是动态变化的。</text>
      <text class="intro-content">作为一名intj，我希望通过这个小程序，认清自己的同时，对复杂多变的关系做出合理解析，帮助我们看到本质。</text>
    </view>

    <view class="content-area">
      <view class="changelog-card">
        <text class="section-title">更新说明</text>
        <text class="section-subtitle">了解最新功能与变化</text>

        <!-- 版本更新 -->
        <view class="update-section">
          <text class="update-title">📝 版本更新</text>
          <view class="update-item">新增简化测试模式，题目更少更轻松</view>
          <view class="update-item">优化人格融合算法，结果更准确</view>
          <view class="update-item">新增人格匹配测试功能</view>
          <view class="update-item">支持历史记录查看和删除</view>
          <view class="update-item">优化海报生成功能，一键保存分享</view>
        </view>

        <!-- 功能介绍 -->
        <view class="update-section">
          <text class="update-title">✨ 功能介绍</text>
          <text class="update-content">
            81型融合人格测试基于MBTI和荣格心理学理论，通过分析你在不同情境下的选择，计算出独特的81种人格类型组合。
          </text>
          <view class="update-item">人格测试：追踪自己的人格变化</view>
          <view class="update-item">关系测试：了解与他人的关系匹配度</view>
          <view class="update-item">历史记录：保存多次测试结果进行对比</view>
          <view class="update-item">海报分享：一键生成精美人格海报</view>
        </view>

        <!-- 使用指南 -->
        <view class="update-section">
          <text class="update-title">📖 使用指南</text>
          <text class="update-content">
            如何开始测试？
          </text>
          <view class="update-item">选择"人格测试"进入测试页面</view>
          <view class="update-item">根据真实情况选择情境描述</view>
          <view class="update-item">完成所有题目后查看结果</view>
          <view class="update-item">点击"保存图片"生成分享海报</view>
        </view>

        <!-- 隐私说明 -->
        <view class="update-section">
          <text class="update-title">🔒 隐私说明</text>
          <text class="update-content">
            我们非常重视您的隐私保护。所有测试数据仅存储在您的本地设备中，我们不会收集或上传任何个人信息。您可以随时删除历史记录，保护您的隐私。
          </text>
        </view>

        <!-- 关于我们 -->
        <view class="update-section">
          <text class="update-title">💡 关于我们</text>
          <text class="update-content">
            81型融合人格测试是一个有趣的心理学测试应用，旨在帮助您更好地了解自己的人格特点。本分析仅供娱乐参考，不能代替专业心理评估。
          </text>
        </view>

        <!-- 联系方式 -->
        <view class="update-section">
          <text class="update-title">📧 联系我们</text>
          <text class="update-content">
            如果您有任何问题或建议，欢迎通过应用内分享功能联系我们。
          </text>
        </view>
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
  padding: 24rpx;
}

.intro-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.intro-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 20rpx;
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
  margin-bottom: 12rpx;
}

.section-subtitle {
  display: block;
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 40rpx;
}

.update-section {
  margin-bottom: 40rpx;
  padding-bottom: 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.update-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.update-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 20rpx;
}

.update-content {
  display: block;
  font-size: 28rpx;
  color: #666666;
  line-height: 1.8;
  text-align: justify;
  margin-bottom: 16rpx;
}

.update-item {
  display: block;
  font-size: 28rpx;
  color: #666666;
  line-height: 2;
  padding-left: 20rpx;
  position: relative;
  margin-bottom: 8rpx;
}

.update-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #FA325A;
}
</style>
