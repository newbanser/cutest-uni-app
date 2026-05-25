<template>
  <view class="page-container">
    <view class="fullscreen-bg"></view>
    
    <view class="brand-area">
      <view class="brand-content">
        <image class="logo" :src="logoUrl" mode="aspectFit" @error="onLogoError" @load="onLogoLoad"></image>
        <button class="start-btn" hover-class="start-btn-pressed" @tap="startAnalysis" @click="startAnalysis">点我追踪</button>
      </view>
    </view>

    <view class="content-area">
      <view class="card user-card">
        <view class="user-info-wrapper">
          <view class="avatar-wrapper">
            <button 
              v-if="!userProfile.avatar" 
              class="default-avatar-btn" 
              open-type="chooseAvatar" 
              @chooseavatar="onChooseAvatar"
            >
              <text class="avatar-char">{{ userProfile.nickname.charAt(0) }}</text>
            </button>
            <button 
              v-else 
              class="user-avatar-btn" 
              open-type="chooseAvatar" 
              @chooseavatar="onChooseAvatar"
            >
              <image class="user-avatar" :src="userProfile.avatar" mode="aspectFill"></image>
            </button>
            <view class="edit-badge" @tap.stop="showAvatarActions">
              <text class="edit-icon">换</text>
            </view>
          </view>
          <view class="user-details">
            <view class="nickname-wrapper" @tap="editNickname">
              <text class="nickname">{{ userProfile.nickname }}</text>
              <text class="edit-tip">点击修改</text>
            </view>
            <text class="user-id">{{ userProfile.userId }}</text>
          </view>
        </view>
      </view>

      <view class="card personality-card" v-if="latestAnalysis">
        <text class="personality-title">我的格</text>
        <text class="update-date" v-if="!latestAnalysis.isNewUser">更新日期 {{ latestAnalysis.dateTime }}</text>
        <text class="update-date" v-else>待分析</text>
        <view class="personality-main">
          <view class="personality-content">
            <image class="personality-avatar" :src="latestAnalysis.personalityAvatar" mode="aspectFill"></image>
            <view class="personality-info">
              <view class="personality-header">
                <text class="personality-name">{{ latestAnalysis.personalityName }}</text>
              </view>
              <text class="camp-name" v-if="latestAnalysis.campName">{{ latestAnalysis.campName }}</text>
              <view class="dimensions" v-if="latestAnalysis.dimensions && latestAnalysis.dimensions.length > 0">
                <text class="dimension-tag" v-for="(item, index) in latestAnalysis.dimensions" :key="index">{{ item }}</text>
              </view>
            </view>
          </view>
        </view>
        <text class="description">{{ latestAnalysis.description }}</text>
        <image class="camp-badge" v-if="latestAnalysis.campBadgeIcon" :src="latestAnalysis.campBadgeIcon" mode="aspectFit"></image>
      </view>

      <view class="card history-card" v-if="hasHistory">
        <text class="history-title">上次分析</text>
        <view class="history-content">
          <view class="history-left">
            <image class="history-camp-icon" :src="previousCampIcon" mode="aspectFit"></image>
            <text class="history-label">上次所处阵营</text>
          </view>
          <view class="history-divider"></view>
          <view class="history-right">
            <image class="history-avatar" :src="previousPersonalityAvatar" mode="aspectFill"></image>
            <text class="history-label">上次分析人格</text>
          </view>
        </view>
      </view>

      <view class="card suggestion-card" :class="suggestionStyle" v-if="changeSuggestion">
        <text class="suggestion-title">变化追踪</text>
        <text class="suggestion-text">{{ changeSuggestion }}</text>
      </view>

      <text class="tip-text">本分析仅供娱乐参考，不能代替专业心理评估</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import personalitiesData from '@/data/personalities';

import { getPersonalityAvatar, getCampIconUrl, getLogoUrl } from '@/utils/imageHelper';
import scoring from '@/utils/scoring';

const { personalities } = personalitiesData.personalitiesData;
const userStore = useUserStore();

const userProfile = reactive({
  userId: 'cuteID',
  nickname: '小可爱',
  avatar: ''
});

const latestAnalysis = ref(null);
const hasHistory = ref(true);
const previousCampIcon = ref('');
const previousPersonalityAvatar = ref('');
const changeSuggestion = ref('');
const suggestionStyle = ref('default');
const logoUrl = ref('');

const loadImages = () => {
  logoUrl.value = getLogoUrl();
  console.log('Logo URL:', logoUrl.value);
};

const onLogoError = (e) => {
  console.error('Logo加载失败:', e);
  console.error('错误详情:', e.detail || e);
};

const onLogoLoad = (e) => {
  console.log('Logo加载成功:', e);
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

const loadUserData = () => {
  try {
    userStore.loadUserData();
    const userData = userStore.userData;
    const views = (userData?.analysis_records) || [];
    const defaultPersonality = 'unknown';
    const defaultPersonalityData = personalities[defaultPersonality] || {};

    let latest = null;
    let hasHistoryVal = true;
    let prevCampIcon = '';
    let prevPersonalityAvatarVal = '';
    let suggestion = '';
    let style = 'default';

    if (views.length > 0) {
      const latestView = views[views.length - 1];
      const personalityData = personalities[latestView.personality] || {};

      const dateTime = formatDateTime(latestView.timestamp);

      latest = {
        personalityAvatar: getPersonalityAvatar(latestView.personality),
        personalityName: personalityData.name || '',
        campName: personalityData.camp || '',
        description: personalityData.description || '',
        campBadgeIcon: getCampIconUrl(latestView.personality),
        timestamp: latestView.timestamp,
        dateTime,
        dimensions: personalityData.dimensionTags || [],
        isNewUser: false
      };

      if (views.length >= 2) {
        const previous = views[views.length - 2];
        prevCampIcon = getCampIconUrl(previous.personality);
        prevPersonalityAvatarVal = getPersonalityAvatar(previous.personality);
        const analysisResult = scoring.analyzeChanges(latestView, previous);
        suggestion = analysisResult.message;
        style = analysisResult.level;
      } else {
        prevCampIcon = getCampIconUrl(defaultPersonality);
        prevPersonalityAvatarVal = getPersonalityAvatar(defaultPersonality);
        const analysisResult = scoring.analyzeChanges(latestView, null);
        suggestion = analysisResult.message;
        style = analysisResult.level;
      }
    } else {
      latest = {
        personalityAvatar: getPersonalityAvatar(defaultPersonality),
        personalityName: defaultPersonalityData.name || '',
        campName: defaultPersonalityData.camp || '',
        description: defaultPersonalityData.description || '',
        campBadgeIcon: getCampIconUrl(defaultPersonality),
        timestamp: Date.now(),
        dimensions: defaultPersonalityData.dimensionTags || [],
        isNewUser: true
      };

      prevCampIcon = getCampIconUrl(defaultPersonality);
      prevPersonalityAvatarVal = getPersonalityAvatar(defaultPersonality);
      suggestion = '欢迎加入！完成解析后即可追踪你的人格变化。';
      style = 'default';
    }

    latestAnalysis.value = latest;
    hasHistory.value = hasHistoryVal;
    previousCampIcon.value = prevCampIcon;
    previousPersonalityAvatar.value = prevPersonalityAvatarVal;
    changeSuggestion.value = suggestion;
    suggestionStyle.value = style;
  } catch (e) {
    console.error('加载用户数据出错:', e);
  }
};

const startAnalysis = () => {
  uni.navigateTo({
    url: '/pages/analysis/analysis'
  });
};

const loadUserProfile = () => {
  try {
    const saved = uni.getStorageSync('userProfile');
    if (saved && typeof saved === 'object') {
      userProfile.userId = (typeof saved.userId === 'string' && saved.userId.trim()) ? saved.userId : 'cuteID';
      userProfile.nickname = (typeof saved.nickname === 'string' && saved.nickname.trim()) ? saved.nickname : '小可爱';
      userProfile.avatar = (typeof saved.avatar === 'string') ? saved.avatar : '';
    }
  } catch (e) {
    console.log('加载用户信息失败:', e);
    uni.showToast({
      title: '加载用户信息失败',
      icon: 'none',
      duration: 1500
    });
  }
};

const saveUserProfile = () => {
  try {
    uni.setStorageSync('userProfile', userProfile);
  } catch (e) {
    console.log('保存用户信息失败:', e);
    uni.showToast({
      title: '保存失败',
      icon: 'none',
      duration: 1500
    });
  }
};

const showAvatarActions = () => {
  uni.showActionSheet({
    itemList: ['从相册选择', '拍照'],
    success: (res) => {
      if (res.tapIndex === 0) {
        chooseImage('album');
      } else if (res.tapIndex === 1) {
        chooseImage('camera');
      }
    },
    fail: (err) => {
      console.log('用户取消选择:', err);
    }
  });
};

const onChooseAvatar = (e) => {
  try {
    console.log('选择头像结果:', e);
    if (e.detail && e.detail.avatarUrl) {
      userProfile.avatar = e.detail.avatarUrl;
      saveUserProfile();
      uni.showToast({ title: '头像更新成功！' });
    } else {
      throw new Error('未获取到头像');
    }
  } catch (err) {
    console.log('头像选择失败:', err);
    uni.showToast({
      title: '请点击编辑按钮选择',
      icon: 'none',
      duration: 2000
    });
  }
};

const chooseImage = (sourceType) => {
  uni.chooseImage({
    count: 1,
    sourceType: [sourceType],
    success: (res) => {
      try {
        if (res.tempFilePaths && res.tempFilePaths.length > 0) {
          userProfile.avatar = res.tempFilePaths[0];
          saveUserProfile();
          uni.showToast({ title: '头像更新成功！' });
        } else {
          throw new Error('未选择图片');
        }
      } catch (err) {
        console.log('图片选择失败:', err);
        uni.showToast({
          title: '选择失败，请重试',
          icon: 'none'
        });
      }
    },
    fail: (err) => {
      console.log('选择图片失败:', err);
      if (err.errMsg && err.errMsg.includes('cancel')) {
        console.log('用户取消选择');
      } else {
        uni.showToast({
          title: '选择失败，请重试',
          icon: 'none'
        });
      }
    }
  });
};

const editNickname = () => {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: '请输入新昵称',
    content: userProfile.nickname,
    success: (res) => {
      try {
        if (res.confirm) {
          const newNickname = res.content ? res.content.trim() : '';
          if (newNickname) {
            if (newNickname.length > 20) {
              uni.showToast({
                title: '昵称不能超过20字',
                icon: 'none'
              });
              return;
            }
            userProfile.nickname = newNickname;
            saveUserProfile();
            uni.showToast({ title: '昵称更新成功！' });
          } else {
            uni.showToast({
              title: '昵称不能为空',
              icon: 'none'
            });
          }
        }
      } catch (err) {
        console.log('修改昵称失败:', err);
        uni.showToast({
          title: '修改失败，请重试',
          icon: 'none'
        });
      }
    },
    fail: (err) => {
      console.log('取消修改昵称:', err);
    }
  });
};

onMounted(() => {
  loadImages();
  loadUserProfile();
  loadUserData();
});

onShow(() => {
  loadUserProfile();
  loadUserData();
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

.page-container {
  min-height: 100vh;
  padding: 0;
  padding-bottom: 180rpx;
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow-x: hidden;
}

.brand-area {
  width: 100%;
  height: 750rpx;
  position: relative;
  background-color: #f5f5f5;
  padding: 30rpx;
  box-sizing: border-box;
}

.content-area {
  padding: 30rpx;
  padding-top: 20rpx;
}

.brand-content {
  position: absolute;
  top: calc(44px + env(safe-area-inset-top));
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 60rpx;
}

.logo {
  width: 420rpx;
  height: auto;
  min-height: 200rpx;
  display: block;
}

.start-btn {
  width: 400rpx;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #ffffff;
  color: #000000;
  font-size: 32rpx;
  font-weight: 700;
  border-radius: 44rpx;
  border: 2px solid #000000;
  padding: 0;
  flex-shrink: 0;
  text-align: center;
  box-shadow: 4rpx 4rpx 0 #000000;
}

.start-btn:active,
.start-btn-pressed {
  background-color: #fa325a;
  color: #000000;
}

.card {
  background-color: #ffffff;
  border-radius: 32rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
}

.user-card {
  padding: 32rpx 28rpx;
  margin-bottom: 24rpx;
}

.user-info-wrapper {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar-wrapper {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  flex-shrink: 0;
}

.default-avatar-btn,
.user-avatar-btn {
  width: 120rpx;
  height: 120rpx;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.default-avatar-btn::after,
.user-avatar-btn::after {
  border: none;
}

.default-avatar-btn {
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 3px solid #000000;
  box-shadow: 4rpx 4rpx 0 #000000;
}

.avatar-char {
  font-size: 52rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #000000;
  box-shadow: 4rpx 4rpx 0 #000000;
}

.edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background-color: #FA325A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  box-shadow: 2rpx 2rpx 0 #000000;
}

.edit-icon {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.nickname-wrapper {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
  line-height: 1.2;
}

.edit-tip {
  font-size: 20rpx;
  color: #646464;
  background-color: #f5f5f5;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  border: 1px solid #e0e0e0;
}

.user-id {
  font-size: 24rpx;
  color: #999;
  font-weight: 500;
}

.personality-card {
  position: relative;
  padding: 28rpx;
  margin-top: 0;
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

.history-card {
  padding: 28rpx;
}

.history-title {
  display: none;
}

.history-content {
  display: flex;
  align-items: center;
}

.history-left,
.history-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.history-camp-icon {
  width: 110rpx;
  height: 110rpx;
  margin-bottom: 12rpx;
}

.history-avatar {
  width: 110rpx;
  height: 110rpx;
  margin-bottom: 12rpx;
}

.history-label {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 8rpx;
}

.history-divider {
  width: 2px;
  height: 140rpx;
  background-color: #000000;
  margin: 0 24rpx;
}

.suggestion-card {
  background-color: #ffffff;
  border: 2px solid #000000;
  border-radius: 32rpx;
  padding: 36rpx;
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

button::after {
  border: none;
}
</style>
