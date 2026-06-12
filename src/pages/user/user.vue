<template>
  <view class="page-container">
    <view class="fullscreen-bg"></view>
    
    <!-- 用户信息区域 -->
    <view class="user-card">
      <view class="user-avatar-container" @tap.stop>
        <view class="user-avatar-wrapper">
          <button
            class="avatar-btn"
            open-type="chooseAvatar"
            @chooseavatar="onChooseAvatar"
            plain
          >
          </button>
          <image
            v-if="userStore.userData.avatar"
            class="user-avatar"
            :src="userStore.userData.avatar"
            mode="aspectFill"
          ></image>
          <image
            v-else
            class="user-avatar"
            src="/static/images/user_default.png"
            mode="aspectFill"
          ></image>
        </view>
        <!-- 性别角标 -->
        <view class="gender-badge" @tap.stop="openGenderModal">
          <image class="gender-badge-icon" :src="genderIcon" mode="aspectFit"></image>
        </view>
      </view>
      <view class="user-info">
        <!-- 昵称 → 使用open-type nickname调取微信昵称 -->
        <button
          class="nickname-btn"
          open-type="nickname"
          @nicknamereview="onNicknameReview"
          @tap="onNicknameTap"
        >
          <text class="user-nickname">{{ userStore.userData.nickname || '点击设置微信昵称' }}</text>
          <image v-if="userStore.userData.nickname" src="/static/images/set_name.png" class="edit-icon-img"></image>
        </button>
        <view class="cuteId-row" @tap="copyCuteId">
          <text class="cuteId-label">人格密语</text>
          <text class="cuteId-value">{{ userStore.userData.cuteId }}</text>
        </view>
      </view>
    </view>
    
    <!-- 快速统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-number">{{ storeLoading ? '--' : userStore.userData.analysis_count }}</text>
        <text class="stat-label">人格测试次数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ storeLoading ? '--' : matchCount }}</text>
        <text class="stat-label">关系测试次数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ calculateUseDays() }}</text>
        <text class="stat-label">使用天数</text>
      </view>
    </view>
    
    <!-- 功能菜单 -->
    <view class="menu-card">
      <view class="menu-item" @tap="goToHistory">
        <image src="/static/images/xbti_history.png" class="menu-icon-img"></image>
        <text class="menu-label">人格测试记录</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goToMatchHistory">
        <image src="/static/images/crush_history.png" class="menu-icon-img"></image>
        <text class="menu-label">关系测试记录</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goToCollection">
        <image src="/static/images/album.png" class="menu-icon-img"></image>
        <text class="menu-label">可爱图鉴库</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goToChangelog">
        <image src="/static/images/faq.png" class="menu-icon-img"></image>
        <text class="menu-label">常见问题</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>


    <!-- 昵称编辑弹窗 -->
    <view v-if="showNicknameModal" class="modal-overlay" @tap="closeNicknameModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">修改昵称</text>
        <input 
          class="modal-input" 
          v-model="newNickname" 
          placeholder="请输入昵称"
          maxlength="20"
          :focus="showNicknameModal"
        ></input>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="closeNicknameModal">取消</view>
          <view class="modal-btn confirm-btn" @tap="saveNickname">保存</view>
        </view>
      </view>
    </view>
    
    <!-- 性别选择弹窗 -->
    <view class="modal-overlay" v-if="showGenderModal" @tap="closeGenderModal">
      <view class="modal-container" @tap.stop>
        <view class="modal-close" @tap="closeGenderModal">×</view>
        <text class="modal-title">你的性别是？</text>
        <view class="gender-options">
          <view 
            :class="['gender-option', selectedGender === 'male' ? 'selected' : '']"
            @tap="selectGender('male')">
            <text class="gender-text">男的</text>
          </view>
          <view 
            :class="['gender-option', selectedGender === 'female' ? 'selected' : '']"
            @tap="selectGender('female')">
            <text class="gender-text">女的</text>
          </view>
          <view 
            :class="['gender-option', selectedGender === 'x' ? 'selected' : '']"
            @tap="selectGender('x')">
            <text class="gender-text">不告诉你</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 性别保密确认弹窗 -->
    <view v-if="showPrivacyConfirmModal" class="modal-overlay" @tap="closePrivacyConfirmModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">确定保密？</text>
        <text class="modal-desc">选择保密后，仍可在"我的"中随时修改</text>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="closePrivacyConfirmModal">重新选择</view>
          <view class="modal-btn confirm-btn" @tap="confirmPrivacy">确定保密</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const { loading: storeLoading } = userStore;
const matchCount = computed(() => {
  return userStore.userData.relationship_match_count || 0;
});
const showNicknameModal = ref(false);
const newNickname = ref('');
const startDate = ref(Date.now());

// 计算使用天数
const calculateUseDays = () => {
  try {
    const savedStartDate = uni.getStorageSync('app_start_date');
    if (savedStartDate) {
      startDate.value = savedStartDate;
    } else {
      startDate.value = Date.now();
      uni.setStorageSync('app_start_date', startDate.value);
    }
    const days = Math.floor((Date.now() - startDate.value) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  } catch (e) {
    return 0;
  }
};

// 选择微信头像
const onChooseAvatar = (e) => {
  console.log('onChooseAvatar e:', e);
  // 增加更严格的空值检查
  if (!e || !e.detail) {
    console.log('事件对象为空');
    return;
  }
  console.log('onChooseAvatar e.detail:', e.detail);
  
  // 检查是否是取消操作
  if (e.detail.errMsg && e.detail.errMsg.includes('fail')) {
    // 用户取消了选择，不做任何处理
    console.log('用户取消了头像选择');
    return;
  }
  
  let avatarUrl = null;
  // 尝试从不同的位置获取头像URL
  if (e.detail.avatarUrl) {
    avatarUrl = e.detail.avatarUrl;
  } else if (typeof e.detail === 'string') {
    avatarUrl = e.detail;
  }
  
  if (avatarUrl) {
    console.log('设置头像:', avatarUrl);
    userStore.updateProfile({
      avatar: avatarUrl
    });
    uni.showToast({
      title: '头像更新成功',
      icon: 'success'
    });
  } else {
    console.log('未获取到头像URL');
  }
};

// 微信昵称选择回调
const onNicknameReview = (e) => {
  if (e.detail && e.detail.nickname) {
    userStore.updateProfile({ nickname: e.detail.nickname });
    uni.showToast({ title: '昵称设置成功', icon: 'success' });
  } else {
    editNickname();
  }
};

// 直接点击昵称按钮，打开手动编辑弹窗（兼容open-type nickname可能不生效的情况）
const onNicknameTap = () => {
  editNickname();
};

// 性别角标显示
const genderIcon = computed(() => {
  const gender = userStore.userData.gender;
  if (gender === 'male') return '/static/images/gender_m.png';
  if (gender === 'female') return '/static/images/gender_f.png';
  if (gender === 'x') return '/static/images/gender_x.png';
  return '/static/images/gender_u.png';
});

// 编辑昵称（弹窗）
const editNickname = () => {
  newNickname.value = userStore.userData.nickname || '';
  showNicknameModal.value = true;
};

// 关闭昵称弹窗
const closeNicknameModal = () => {
  showNicknameModal.value = false;
};

// 保存昵称
const saveNickname = () => {
  if (!newNickname.value.trim()) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none'
    });
    return;
  }
  userStore.updateProfile({
    nickname: newNickname.value.trim()
  });
  uni.showToast({
    title: '保存成功',
    icon: 'success'
  });
  closeNicknameModal();
};

// 跳转到历史记录
const goToHistory = () => {
  uni.navigateTo({
    url: '/pages/history/history'
  });
};

// 跳转到关系测试记录
const goToMatchHistory = () => {
  uni.navigateTo({
    url: '/pages/history/history?tab=match'
  });
};

// 跳转到图鉴库
const goToCollection = () => {
  uni.navigateTo({
    url: '/pages/guide/guide'
  });
};

// 跳转到常见问题
const goToChangelog = () => {
  uni.navigateTo({
    url: '/pages/changelog/changelog'
  });
};

// 复制人格密语到剪贴板
const copyCuteId = () => {
  const cuteId = userStore.userData.cuteId;
  if (!cuteId) {
    uni.showToast({
      title: '暂无人格密语',
      icon: 'none'
    });
    return;
  }
  uni.setClipboardData({
    data: cuteId,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success'
      });
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      });
    }
  });
};

// 性别相关状态
const showGenderModal = ref(false);
const showPrivacyConfirmModal = ref(false);
const selectedGender = ref('');

// 打开性别选择弹窗
const openGenderModal = () => {
  // 如果用户已经有性别设置，显示当前选择；否则为空
  selectedGender.value = userStore.userData.gender || '';
  showGenderModal.value = true;
};

// 关闭性别选择弹窗
const closeGenderModal = () => {
  showGenderModal.value = false;
};

// 选择性别（点选直接保存，无需确定按钮）
const selectGender = (gender) => {
  selectedGender.value = gender;

  // 选择"保密"需要二次确认
  if (gender === 'x') {
    showGenderModal.value = false;
    showPrivacyConfirmModal.value = true;
    return;
  }

  userStore.updateProfile({
    gender: gender
  });
  uni.showToast({
    title: '性别更新成功',
    icon: 'success'
  });
  closeGenderModal();
};

// 确认保密性别
const confirmPrivacy = () => {
  userStore.updateProfile({
    gender: 'x'
  });
  uni.showToast({
    title: '性别已保密',
    icon: 'success'
  });
  showPrivacyConfirmModal.value = false;
};

// 关闭性别保密确认弹窗
const closePrivacyConfirmModal = () => {
  showPrivacyConfirmModal.value = false;
  // 重新打开性别选择弹窗
  setTimeout(() => {
    showGenderModal.value = true;
  }, 100);
};

onMounted(() => {
  userStore.loadUserData();
});

onShow(() => {
  userStore.loadUserData();
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 20rpx;
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

.user-card {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.user-avatar-container {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  flex-shrink: 0;
}

.user-avatar-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-btn {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  line-height: 1;
  z-index: 5;
  box-shadow: none;
  outline: none;
}

.avatar-btn::after {
  border: none;
  content: none;
  display: none;
}

/* 性别角标 */
.gender-badge {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 48rpx;
  height: 48rpx;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  border: 2rpx solid #e0e0e0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.gender-badge-icon {
  width: 32rpx;
  height: 32rpx;
  display: block;
}

.user-avatar {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.user-info {
  margin-left: 30rpx;
  flex: 1;
}

.nickname-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: 1.2;
  font-size: inherit;
  min-height: 60rpx;
  box-sizing: content-box;
}

.nickname-btn::after {
  border: none;
}

.user-nickname {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
}

.edit-icon-img {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}

.cuteId-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 2rpx;
}

.cuteId-label {
  font-size: 24rpx;
  color: #646464;
}

.cuteId-value {
  font-size: 28rpx;
  color: #646464;
  font-weight: 700;
  font-family: monospace;
}

.stats-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  margin-top: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-number {
  font-size: 48rpx;
  font-weight: 700;
  color: #FA325A;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #646464;
}

.menu-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  margin-top: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}

.menu-icon-img {
  width: 44rpx;
  height: 44rpx;
  margin-right: 24rpx;
}

.menu-label {
  flex: 1;
  font-size: 30rpx;
  color: #000000;
}

.menu-arrow {
  font-size: 40rpx;
  color: #999999;
}

/* 弹窗样式 */
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
  width: 560rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.modal-container {
  width: 560rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 40rpx 28rpx;
  position: relative;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.modal-close {
  position: absolute;
  top: 16rpx;
  right: 20rpx;
  font-size: 40rpx;
  color: #999999;
  line-height: 1;
  padding: 8rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
  text-align: center;
  display: block;
  margin-bottom: 32rpx;
}

.modal-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  margin-bottom: 30rpx;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  font-size: 30rpx;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666666;
}

.confirm-btn {
  background: linear-gradient(135deg, #FA325A 0%, #FF6B6B 100%);
  color: #ffffff;
}

/* 性别选择弹窗样式 */
.gender-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.gender-option {
  background-color: #f5f5f5;
  border-radius: 20rpx;
  padding: 24rpx;
  text-align: center;
  border: 2px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.gender-option.selected {
  background-color: #FA325A;
  border-color: #FA325A;
}

.gender-option.selected .gender-emoji,
.gender-option.selected .gender-text {
  color: #ffffff;
}

.gender-emoji {
  font-size: 40rpx;
  display: block;
}

.gender-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
  display: block;
}

/* 弹窗描述文字 */
.modal-desc {
  font-size: 28rpx;
  color: #666666;
  text-align: center;
  display: block;
  margin-bottom: 30rpx;
}
</style>
