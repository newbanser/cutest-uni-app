<template>
  <view class="page-container">
    <view class="fullscreen-bg"></view>
    
    <!-- 用户信息区域 -->
    <view class="user-card">
      <view class="user-avatar-container">
        <view class="user-avatar-wrapper">
          <!-- 微信头像选择按钮 -->
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
        <view class="avatar-edit-badge" @tap.stop="chooseImageAvatar">
          <image src="/static/images/set_avatar.png" class="badge-icon"></image>
        </view>
      </view>
      <view class="user-info">
        <view class="nickname-row">
          <text v-if="userStore.userData.nickname" class="user-nickname">{{ userStore.userData.nickname }}</text>
          <button 
            v-else 
            type="nickname" 
            class="nickname-btn"
            open-type="getUserInfo"
            @getuserinfo="onGetUserInfo"
          >
            <text class="nickname-placeholder">点击使用微信昵称</text>
          </button>
          <view class="edit-nickname" @tap="editNickname">
            <image src="/static/images/set_name.png" class="edit-icon-img"></image>
          </view>
        </view>
        <view class="cuteId-row" @tap="copyCuteId">
          <text class="cuteId-label">人格密语</text>
          <text class="cuteId-value">{{ userStore.userData.cuteId }}</text>
          <text class="cuteId-copy">点击复制</text>
        </view>
        <view class="gender-row">
          <text class="gender-label">性别</text>
          <text class="gender-value" @tap="openGenderModal">{{ getGenderText() }}</text>
        </view>
      </view>
      <view class="action-area">
        <view class="settings-btn" @tap="openSettingsModal">
          <text class="settings-icon">⚙️</text>
        </view>
        <view class="logout-btn" @tap="cancelAccount">
          <text class="logout-text">注销</text>
        </view>
      </view>
    </view>
    
    <!-- 快速统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-number">{{ userStore.userData.analysis_records.length }}</text>
        <text class="stat-label">解析次数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">0</text>
        <text class="stat-label">匹配次数</text>
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
        <image src="/static/images/history.png" class="menu-icon-img"></image>
        <text class="menu-label">历史记录</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goToCollection">
        <image src="/static/images/album.png" class="menu-icon-img"></image>
        <text class="menu-label">图鉴库</text>
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
            <text class="gender-emoji">♂️</text>
            <text class="gender-text">男生</text>
          </view>
          <view 
            :class="['gender-option', selectedGender === 'female' ? 'selected' : '']"
            @tap="selectGender('female')">
            <text class="gender-emoji">♀️</text>
            <text class="gender-text">女生</text>
          </view>
          <view 
            :class="['gender-option', selectedGender === 'x' ? 'selected' : '']"
            @tap="selectGender('x')">
            <text class="gender-emoji">🤫</text>
            <text class="gender-text">不告诉你</text>
          </view>
        </view>
        <button class="save-gender-btn" @tap="saveGender">确定</button>
      </view>
    </view>
    
    <!-- 设置弹窗 -->
    <view v-if="showSettingsModal" class="modal-overlay" @tap="closeSettingsModal">
      <view class="modal-content settings-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">设置</text>
          <view class="modal-close" @tap="closeSettingsModal">×</view>
        </view>
        <view class="settings-list">
          <view class="settings-item" @tap="editNickname">
            <text class="settings-label">修改昵称</text>
            <text class="settings-arrow">›</text>
          </view>
          <view class="settings-item" @tap="openGenderModal">
            <text class="settings-label">修改性别</text>
            <text class="settings-arrow">›</text>
          </view>
          <view class="settings-item" @tap="chooseImageAvatar">
            <text class="settings-label">更换头像</text>
            <text class="settings-arrow">›</text>
          </view>
        </view>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="closeSettingsModal">关闭</view>
        </view>
      </view>
    </view>
    
    <!-- 性别保密确认弹窗 -->
    <view v-if="showPrivacyConfirmModal" class="modal-overlay" @tap="closePrivacyConfirmModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">确认保密</text>
        <text class="modal-desc">性别保密无法明确某些关系，你确定么？</text>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="closePrivacyConfirmModal">再想想</view>
          <view class="modal-btn confirm-btn" @tap="confirmPrivacy">确定保密</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
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

// 获取微信用户信息（昵称）
const onGetUserInfo = (e) => {
  console.log('onGetUserInfo e:', e);
  // 增加更严格的空值检查
  if (!e || !e.detail) {
    console.log('事件对象为空');
    return;
  }
  console.log('onGetUserInfo e.detail:', e.detail);
  
  if (e.detail.errMsg && e.detail.errMsg.includes('fail')) {
    uni.showToast({
      title: '获取昵称失败',
      icon: 'none'
    });
    return;
  }
  
  // 微信小程序 getUserInfo 返回的数据
  const userInfo = e.detail.userInfo;
  if (userInfo && userInfo.nickName) {
    console.log('获取到微信昵称:', userInfo.nickName);
    userStore.updateProfile({
      nickname: userInfo.nickName.trim(),
      avatar: userInfo.avatarUrl || userStore.userData.avatar
    });
    uni.showToast({
      title: '昵称设置成功',
      icon: 'success'
    });
  } else {
    console.log('未获取到 userInfo 或 nickName');
    uni.showToast({
      title: '未获取到昵称',
      icon: 'none'
    });
  }
};

// 从相册选择或拍照
const chooseImageAvatar = () => {
  uni.showActionSheet({
    itemList: ['从相册选择', '拍照'],
    success: (res) => {
      if (res && res.tapIndex !== undefined && res.tapIndex !== null) {
        if (res.tapIndex === 0) {
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album'],
            success: (chooseRes) => {
              if (chooseRes && chooseRes.tempFilePaths && chooseRes.tempFilePaths.length > 0) {
                const tempFilePath = chooseRes.tempFilePaths[0];
                userStore.updateProfile({
                  avatar: tempFilePath
                });
                uni.showToast({
                  title: '头像更新成功',
                  icon: 'success'
                });
              }
            }
          });
        } else if (res.tapIndex === 1) {
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['camera'],
            success: (chooseRes) => {
              if (chooseRes && chooseRes.tempFilePaths && chooseRes.tempFilePaths.length > 0) {
                const tempFilePath = chooseRes.tempFilePaths[0];
                userStore.updateProfile({
                  avatar: tempFilePath
                });
                uni.showToast({
                  title: '头像更新成功',
                  icon: 'success'
                });
              }
            }
          });
        }
      }
    }
  });
};

// 编辑昵称
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

// 注销账户
const cancelAccount = () => {
  uni.showModal({
    title: '确认注销账户？',
    content: '注销后，你的所有数据将被永久删除，且无法恢复。',
    confirmText: '确认注销',
    confirmColor: '#FA325A',
    success: (res) => {
      if (res.confirm) {
        uni.showModal({
          title: '再次确认',
          content: '确定要注销账户吗？此操作不可逆！',
          confirmText: '确定',
          confirmColor: '#FA325A',
          success: (res2) => {
            if (res2.confirm) {
              userStore.resetAllData();
              uni.showToast({
                title: '已注销',
                icon: 'success'
              });
              setTimeout(() => {
                uni.reLaunch({
                  url: '/pages/index/index'
                });
              }, 1500);
            }
          }
        });
      }
    }
  });
};

// 跳转到历史记录
const goToHistory = () => {
  uni.navigateTo({
    url: '/pages/history/history'
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
const showSettingsModal = ref(false);
const showPrivacyConfirmModal = ref(false);
const selectedGender = ref('');

// 获取性别文本
const getGenderText = () => {
  const gender = userStore.userData.gender;
  if (gender === 'male') return '男生';
  if (gender === 'female') return '女生';
  if (gender === 'x') return '不告诉你';
  return '未设置';
};

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

// 选择性别
const selectGender = (gender) => {
  selectedGender.value = gender;
};

// 保存性别
const saveGender = () => {
  if (!selectedGender.value) {
    uni.showToast({
      title: '请选择性别',
      icon: 'none'
    });
    return;
  }
  
  // 如果选择"不告诉你"，需要二次确认
  if (selectedGender.value === 'x') {
    showGenderModal.value = false;
    showPrivacyConfirmModal.value = true;
    return;
  }
  
  userStore.updateProfile({
    gender: selectedGender.value
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

// 打开设置弹窗
const openSettingsModal = () => {
  showSettingsModal.value = true;
};

// 关闭设置弹窗
const closeSettingsModal = () => {
  showSettingsModal.value = false;
};

onMounted(() => {
  userStore.loadUserData();
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 40rpx;
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

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: -8rpx;
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

.badge-icon {
  width: 32rpx;
  height: 32rpx;
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

.nickname-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nickname-btn {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: 1;
  font-size: inherit;
}

.nickname-btn::after {
  border: none;
}

.nickname-placeholder {
  font-size: 40rpx;
  font-weight: 700;
  color: #999999;
  margin-bottom: 16rpx;
}

.user-nickname {
  font-size: 40rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 16rpx;
}

.edit-nickname {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-icon-img {
  width: 36rpx;
  height: 36rpx;
}

.cuteId-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
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

.cuteId-copy {
  font-size: 24rpx;
  color: #646464;
  margin-left: 12rpx;
}

.action-area {
  flex-shrink: 0;
}

.logout-btn {
  padding: 8rpx 20rpx;
  background: #000000;
  border-radius: 44rpx;
}

.logout-text {
  font-size: 26rpx;
  color: #ffffff;
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
  width: 500rpx;
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
  font-size: 28rpx;
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

/* 性别行样式 */
.gender-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
}

.gender-label {
  font-size: 24rpx;
  color: #646464;
}

.gender-value {
  font-size: 28rpx;
  color: #000000;
  font-weight: 500;
}

/* 设置按钮样式 */
.settings-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.settings-icon {
  font-size: 40rpx;
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

.save-gender-btn {
  width: 100%;
  background-color: #000000;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
  padding: 20rpx;
  border-radius: 14rpx;
  text-align: center;
  border: none;
}

.save-gender-btn::after {
  border: none;
}

/* 设置弹窗样式 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.modal-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
  padding: 8rpx;
}

.settings-content {
  padding: 30rpx 40rpx;
}

.settings-list {
  margin-bottom: 30rpx;
}

.settings-item {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.settings-label {
  flex: 1;
  font-size: 30rpx;
  color: #000000;
}

.settings-arrow {
  font-size: 40rpx;
  color: #999999;
}

/* 弹窗描述文字 */
.modal-desc {
  font-size: 26rpx;
  color: #666666;
  text-align: center;
  display: block;
  margin-bottom: 30rpx;
}
</style>
