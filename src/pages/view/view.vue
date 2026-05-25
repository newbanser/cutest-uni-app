<template>
  <view class="container">
    <view class="fullscreen-bg"></view>
    <view class="card personality-card" v-if="displayView">
      <text class="personality-title">我的格</text>
      <text class="update-date">更新日期 {{ displayView.dateTime }}</text>
      <view class="personality-main">
        <view class="personality-content">
          <image class="personality-avatar" :src="displayView.personalityAvatar" mode="aspectFill"></image>
          <view class="personality-info">
            <view class="personality-header">
              <text class="personality-name">{{ displayView.personalityName }}</text>
            </view>
            <text class="camp-name" v-if="displayView.campName">{{ displayView.campName }}</text>
            <view class="dimensions" v-if="displayView.dimensions.length > 0">
              <text class="dimension-tag" v-for="(item, index) in displayView.dimensions" :key="index">{{ item }}</text>
            </view>
          </view>
        </view>
      </view>
      <text class="description">{{ displayView.description }}</text>
      <image class="camp-badge" v-if="displayView.campBadgeIcon" :src="displayView.campBadgeIcon" mode="aspectFit"></image>
    </view>

    <view class="score-card" v-if="displayView">
      <view class="score-title">人格分值</view>
      <view class="dimension-row">
        <text class="dimension-label">E-外倾</text>
        <view class="dimension-bar-container">
          <view class="mini-bar progress-right">
            <view class="mini-fill" :style="{ width: displayView.percentages.E + '%' }">
              <text class="mini-text">{{ displayView.percentages.E }}%</text>
            </view>
          </view>
          <view class="mini-bar progress-left">
            <view class="mini-fill" :style="{ width: displayView.percentages.I + '%' }">
              <text class="mini-text">{{ displayView.percentages.I }}%</text>
            </view>
          </view>
        </view>
        <text class="dimension-label dimension-label-right">内倾-I</text>
      </view>
      <view class="dimension-row">
        <text class="dimension-label">S-现实</text>
        <view class="dimension-bar-container">
          <view class="mini-bar progress-right">
            <view class="mini-fill" :style="{ width: displayView.percentages.S + '%' }">
              <text class="mini-text">{{ displayView.percentages.S }}%</text>
            </view>
          </view>
          <view class="mini-bar progress-left">
            <view class="mini-fill" :style="{ width: displayView.percentages.N + '%' }">
              <text class="mini-text">{{ displayView.percentages.N }}%</text>
            </view>
          </view>
        </view>
        <text class="dimension-label dimension-label-right">直觉-N</text>
      </view>
      <view class="dimension-row">
        <text class="dimension-label">T-思维</text>
        <view class="dimension-bar-container">
          <view class="mini-bar progress-right">
            <view class="mini-fill" :style="{ width: displayView.percentages.T + '%' }">
              <text class="mini-text">{{ displayView.percentages.T }}%</text>
            </view>
          </view>
          <view class="mini-bar progress-left">
            <view class="mini-fill" :style="{ width: displayView.percentages.F + '%' }">
              <text class="mini-text">{{ displayView.percentages.F }}%</text>
            </view>
          </view>
        </view>
        <text class="dimension-label dimension-label-right">情感-F</text>
      </view>
      <view class="dimension-row">
        <text class="dimension-label">J-判断</text>
        <view class="dimension-bar-container">
          <view class="mini-bar progress-right">
            <view class="mini-fill" :style="{ width: displayView.percentages.J + '%' }">
              <text class="mini-text">{{ displayView.percentages.J }}%</text>
            </view>
          </view>
          <view class="mini-bar progress-left">
            <view class="mini-fill" :style="{ width: displayView.percentages.P + '%' }">
              <text class="mini-text">{{ displayView.percentages.P }}%</text>
            </view>
          </view>
        </view>
        <text class="dimension-label dimension-label-right">感知-P</text>
      </view>
    </view>

    <view v-if="displayView && displayView.traits && displayView.traits.length > 0" class="talents-card">
      <view class="talents-title">天赋特质</view>
      <view class="talents-list">
        <view v-for="(trait, index) in displayView.traits" :key="index" class="talent-tag">{{ trait }}</view>
      </view>
    </view>

    <view v-if="changeSuggestion" class="suggestion-card" :class="suggestionStyle">
      <text class="suggestion-title">环比趋势</text>
      <text class="suggestion-text">{{ changeSuggestion }}</text>
    </view>

    <text class="tip-text">本分析仅供娱乐参考，不能代替专业心理评估</text>

    <view class="view-trend-section">
      <view class="view-trend-btn" @tap="goToTrends">
        查看趋势
      </view>
      <view class="delete-record-btn" @tap="confirmDelete">
        删除记录
      </view>
    </view>

    <view v-if="showDeleteModal" class="modal-overlay" @tap="closeDeleteModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">确认删除</text>
        <text class="modal-text">确定要删除这条解析记录吗？</text>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="closeDeleteModal">取消</view>
          <view class="modal-btn confirm-btn" @tap="deleteRecord">删除</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import personalitiesData from '@/data/personalities';

import { getPersonalityAvatar, getCampIconUrl } from '@/utils/imageHelper';
import scoring from '@/utils/scoring';

const { personalities } = personalitiesData.personalitiesData;
const userStore = useUserStore();

const view = ref(null);
const personality = ref('');
const personalityInfo = ref(null);
const percentages = ref({});
const dimensions = ref([]);
const changes = ref({});
const displayView = ref(null);
const changeSuggestion = ref('');
const suggestionStyle = ref('');
const showDeleteModal = ref(false);
const currentViewId = ref(null);

const getPreviousView = (records, currentId) => {
  if (!records || records.length < 2) return null;
  const index = records.findIndex(r => r.id === currentId);
  if (index > 0) {
    return records[index - 1];
  }
  return null;
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

const loadView = () => {
  try {
    userStore.loadUserData();
    const userData = userStore.userData;
    const storedViewId = uni.getStorageSync('currentViewId');

    if (!userData || !userData.analysis_records) {
      uni.showToast({ title: '数据加载失败', icon: 'none' });
      return;
    }

    let targetViewId = storedViewId;
    if (!targetViewId) {
      const records = userData.analysis_records;
      if (records && records.length > 0) {
        targetViewId = records[records.length - 1].id;
      } else {
        uni.showToast({ title: '暂无解析记录', icon: 'none' });
        return;
      }
    }

    currentViewId.value = targetViewId;

    const targetView = userData.analysis_records.find(r => r.id === targetViewId);
    if (!targetView) {
      uni.showToast({ title: '解析数据不存在', icon: 'none' });
      return;
    }

    const personalityType = (targetView.personality || 'unknown').toUpperCase();
    const personalityData = personalities[personalityType] || personalities['unknown'] || {};
    const previousView = getPreviousView(userData.analysis_records, targetViewId);
    const analyzedChanges = scoring.analyzeChanges(targetView, previousView);
    const changeSuggestionText = analyzedChanges.message || '';
    const suggestionStyleValue = analyzedChanges.level || 'default';

    const dateTime = formatDateTime(targetView.timestamp);

    const displayData = {
      personalityAvatar: getPersonalityAvatar(personalityType),
      campIcon: getCampIconUrl(personalityType),
      personalityName: personalityData.name || personalityType || '未知',
      campName: personalityData.camp || '',
      description: personalityData.description || '',
      percentages: targetView.percentages || {},
      campBadgeIcon: getCampIconUrl(personalityType),
      timestamp: targetView.timestamp,
      dateTime,
      dimensions: personalityData.dimensionTags || [],
      traits: personalityData.traits || []
    };

    const dimensionsArray = [
      { key: 'EI', name: '外向/内向', left: 'E', right: 'I' },
      { key: 'SN', name: '实感/直觉', left: 'S', right: 'N' },
      { key: 'TF', name: '思维/情感', left: 'T', right: 'F' },
      { key: 'JP', name: '判断/感知', left: 'J', right: 'P' }
    ].map(dim => ({
      ...dim,
      leftPercent: targetView.percentages && targetView.percentages[dim.left] ? targetView.percentages[dim.left] : 50,
      rightPercent: targetView.percentages && targetView.percentages[dim.right] ? targetView.percentages[dim.right] : 50,
      dominant: (targetView.percentages && targetView.percentages[dim.left] >= targetView.percentages[dim.right]) ? dim.left : dim.right
    }));

    view.value = targetView;
    personality.value = personalityType;
    personalityInfo.value = personalityData;
    percentages.value = targetView.percentages || {};
    dimensions.value = dimensionsArray;
    changes.value = analyzedChanges;
    displayView.value = displayData;
    changeSuggestion.value = changeSuggestionText;
    suggestionStyle.value = suggestionStyleValue;
  } catch (error) {
    console.error('loadView error:', error);
    uni.showToast({ title: '加载失败: ' + error.message, icon: 'none' });
  }
};

const goToTrends = () => {
  uni.switchTab({
    url: '/pages/trends/trends',
    success: () => {
      console.log('跳转成功');
    },
    fail: (err) => {
      console.error('跳转失败', err);
      uni.reLaunch({ url: '/pages/trends/trends' });
    }
  });
};

const confirmDelete = () => {
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
};

const deleteRecord = () => {
  try {
    userStore.loadUserData();
    const userData = userStore.userData;
    if (!userData || !userData.analysis_records) {
      uni.showToast({ title: '数据加载失败', icon: 'none' });
      return;
    }

    if (!currentViewId.value) {
      uni.showToast({ title: '记录ID不存在', icon: 'none' });
      return;
    }

    const originalCount = userData.analysis_records.length;
    userData.analysis_records = userData.analysis_records.filter(r => r.id !== currentViewId.value);

    if (userData.analysis_records.length === originalCount) {
      uni.showToast({ title: '删除失败', icon: 'none' });
      return;
    }

    userStore.saveUserData();

    uni.showToast({
      title: '删除成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      uni.navigateBack({
        fail: () => {
          uni.switchTab({ url: '/pages/trends/trends' });
        }
      });
    }, 1500);
  } catch (error) {
    console.error('deleteRecord error:', error);
    uni.showToast({ title: '删除失败: ' + error.message, icon: 'none' });
  }
  showDeleteModal.value = false;
};

onMounted(() => {
  loadView();
});
</script>

<style lang="scss">
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  width: 100%;
  background-color: transparent;
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

.container {
  padding: 32rpx;
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

.personality-card {
  position: relative;
  padding: 28rpx;
}

.personality-title {
  display: none;
}

.update-date {
  font-size: 22rpx;
  color: #646464;
  margin-bottom: 20rpx;
  display: block;
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

.personality-english {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
  margin-right: 16rpx;
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
  margin-top: 40rpx;
  display: block;
  text-align: center;
}

.camp-badge {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 100px;
  height: 90px;
  opacity: 0.1;
  z-index: 1;
}

.score-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
}

.score-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 24rpx;
}

.dimension-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.dimension-row:last-child {
  margin-bottom: 0;
}

.dimension-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #000000;
  width: 100rpx;
  flex-shrink: 0;
  text-align: right;
  margin-right: 24rpx;
}

.dimension-label-right {
  text-align: left;
  margin-left: 8rpx;
  margin-right: 0;
}

.dimension-bar-container {
  flex: 1;
  display: flex;
  gap: 4rpx;
  max-width: 380rpx;
}

.mini-bar {
  width: 48%;
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
}

.progress-right .mini-fill {
  margin-left: auto;
  border-radius: 12rpx 0 0 12rpx;
}

.progress-left .mini-fill {
  border-radius: 0 12rpx 12rpx 0;
}

.mini-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
}

.talents-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
}

.talents-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 20rpx;
}

.talents-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.talent-tag {
  background: #000000;
  color: #ffffff;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
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

.suggestion-card.high .suggestion-title,
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

.view-trend-section {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.view-trend-btn {
  width: 280rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #fff;
  color: #000000;
  border: 2px solid #000000;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  padding: 0;
  box-shadow: 4rpx 4rpx 0 #000000;
  text-align: center;
}

.delete-record-btn {
  width: 280rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #FA325A;
  color: #ffffff;
  border: 2px solid #000000;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  padding: 0;
  box-shadow: 4rpx 4rpx 0 #000000;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 600rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx;
  border: 2px solid #000000;
  box-shadow: 8rpx 8rpx 0 #000000;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.modal-text {
  font-size: 28rpx;
  color: #333333;
  display: block;
  text-align: center;
  margin-bottom: 32rpx;
}

.modal-actions {
  display: flex;
  gap: 24rpx;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  text-align: center;
  border: 2px solid #000000;
  box-shadow: 4rpx 4rpx 0 #000000;
}

.cancel-btn {
  background: #f5f5f5;
  color: #000000;
}

.confirm-btn {
  background: #FA325A;
  color: #ffffff;
}

button::after {
  border: none;
}

</style>
