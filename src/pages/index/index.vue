<template>
  <view class="page-container">
    <view class="nav-bar"></view>
    
    <view class="brand-area">
      <image class="brand-logo" src="/static/images/logo.png" mode="aspectFit"></image>
      <view class="brand-slogan">
        <text class="slogan-line">MBTI已经无法定义你的独一无二</text>
        <text class="slogan-line">来测测你的81型融合人格吧</text>
      </view>
    </view>
    
    <view class="content-area">
      <canvas canvas-id="shareCanvas" id="shareCanvas" class="share-canvas" style="width: 750px; height: 1200px; visibility: hidden; position: fixed; left: -9999px; top: -9999px;"></canvas>

      <view class="card entry-card">
        <view class="test-entry-left" @tap="handleRelationTest">
          <text class="test-entry-subtitle">CRUSH TEST</text>
          <text class="test-entry-title">关系测试</text>
          <text class="test-entry-desc">测测我们的关系</text>
        </view>
        <view class="test-entry-divider"></view>
        <view class="test-entry-right" @tap="goToPersonalityTest">
          <text class="test-entry-subtitle">XBTI TEST</text>
          <text class="test-entry-title">人格测试</text>
          <text class="test-entry-desc">追踪自己的人格</text>
        </view>
      </view>
      
      <view class="card personality-card" v-if="comprehensivePersonality" @tap="goToPersonalityDetail">
        <text class="trend-title" style="display: none;">人格</text>
        <view class="personality-header-bar">
          <text class="header-bar-text">{{ reminderMessage }}</text>
          <text class="more-link" @tap.stop="goToPersonalityDetail">查看更多></text>
        </view>
        <text class="update-date">更新日期 {{ comprehensivePersonality.dateTime }}</text>
        <view class="trend-personality-main">
          <view class="trend-personality-content">
            <image class="trend-personality-avatar" :src="comprehensivePersonality.personalityAvatar" mode="aspectFit"></image>
            <view class="trend-personality-info">
              <view class="trend-personality-header">
                <text class="trend-personality-name">{{ comprehensivePersonality.personalityName }}</text>
              </view>
              <text class="trend-camp-name">{{ comprehensivePersonality.campName }}</text>
              <view class="trend-dimensions" v-if="comprehensivePersonality.dimensions && comprehensivePersonality.dimensions.length > 0">
                <text class="trend-dimension-tag" v-for="(item, index) in comprehensivePersonality.dimensions" :key="index">{{ item }}</text>
              </view>
            </view>
          </view>
        </view>
        <text class="trend-description">{{ comprehensivePersonality.description }}</text>
        <image class="trend-camp-badge" v-if="comprehensivePersonality.campBadgeIcon" :src="comprehensivePersonality.campBadgeIcon" mode="aspectFit"></image>
      </view>

      <text class="tip-text">本分析仅供娱乐参考，不能代替专业心理评估。</text>
    </view>

    <view class="modal-overlay" v-if="showShareModalFlag" @tap="closeShareModal">
      <view class="modal-container" @tap.stop>
        <view class="modal-close" @tap="closeShareModal">×</view>
        <text class="modal-title">选择分享模式</text>
        <view class="share-options">
          <button class="share-card" open-type="share">
            <text class="share-name">直接分享好友</text>
            <text class="share-desc">分享小程序马上测</text>
          </button>
          <view class="share-card" @tap="copyCuteId">
            <text class="share-name">复制人格密语</text>
            <text class="share-desc">生成七位密语口令</text>
          </view>
          <view class="share-card" @tap="generateCuteidImage">
            <text class="share-name">生成密语海报</text>
            <text class="share-desc">生成朋友圈海报</text>
          </view>
        </view>
      </view>
    </view>

    <view class="modal-overlay" v-if="showTestModeModal" @tap="closeTestModeModal">
      <view class="modal-container" @tap.stop>
        <view class="modal-close" @tap="closeTestModeModal">×</view>
        <text class="modal-title">选择测试模式</text>
        <view class="mode-options">
          <view class="mode-card" @tap="goDirectTest">
            <text class="mode-name">直接测试</text>
            <text class="mode-desc">分享你的人格密语</text>
          </view>
          <view class="mode-card" @tap="goInputCuteid">
            <text class="mode-name">输入密语</text>
            <text class="mode-desc">输入好友的人格密语</text>
          </view>
        </view>
      </view>
    </view>

    <view class="modal-overlay" v-if="showModeModal" @tap="closeModeModal">
      <view class="modal-container" @tap.stop>
        <view class="modal-close" @tap="closeModeModal">×</view>
        <text class="modal-title">选择测试难度</text>
        <view class="mode-options">
          <view class="mode-card" @tap="goToSimpleMode">
            <text class="mode-name">简单模式</text>
            <text class="mode-desc">基于荣格八维的基础题</text>
          </view>
          <view class="mode-card" @tap="goToHellMode">
            <text class="mode-name">地狱模式</text>
            <text class="mode-desc">题目和选项全模糊，挑战你的真实人格</text>
          </view>
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

    <!-- 性别保密确认弹窗 -->
    <view class="modal-overlay" v-if="showPrivacyConfirmModal" @tap="closePrivacyConfirmModal">
      <view class="modal-container" @tap.stop>
        <view class="modal-close" @tap="closePrivacyConfirmModal">×</view>
        <text class="modal-title">确定保密？</text>
        <text class="modal-desc">选择保密后，仍可在"我的"中随时修改</text>
        <view class="privacy-buttons">
          <button class="privacy-btn privacy-btn-cancel" @tap="closePrivacyConfirmModal">重新选择</button>
          <button class="privacy-btn privacy-btn-confirm" @tap="confirmPrivacy">确定保密</button>
        </view>
      </view>
    </view>
    
    <!-- 输入密语弹窗 -->
    <view class="modal-overlay" v-if="showInputCuteIdModal" @tap="closeInputCuteIdModal">
      <view class="modal-container" @tap.stop>
        <view class="modal-close" @tap="closeInputCuteIdModal">×</view>
        <text class="modal-title">请输入对方的密语</text>
        <input 
          class="cuteId-input" 
          v-model="inputCuteId" 
          placeholder="人格密语是一串7位的字母数字组合" 
          maxlength="7"
        />
        <view class="input-cuteId-buttons">
          <button class="input-cuteId-btn input-cuteId-btn-cancel" @tap="closeInputCuteIdModal">取消</button>
          <button class="input-cuteId-btn input-cuteId-btn-direct" @tap="doDirectMatch">直接测试</button>
          <button class="input-cuteId-btn input-cuteId-btn-private" @tap="doPrivateMatch">偷偷测试</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/stores/user';
import personalitiesData from '@/data/personalities';
import { getPersonalityAvatar, getCampIconUrl } from '@/utils/imageHelper';
import scoring from '@/utils/scoring';

export default {
  data() {
    return {
      personalities: personalitiesData.personalitiesData.personalities,
      userProfile: {
        userId: '',
        nickname: '',
        avatar: ''
      },
      showShareModalFlag: false,
      showTestModeModal: false,
      showModeModal: false,
      _comprehensivePersonality: null,
      _reminderMessage: '',
      isMatchShare: false, // 标记是否来自"关系测试"流程
      // 性别设置相关
      showGenderModal: false,
      showPrivacyConfirmModal: false,
      selectedGender: '',
      pendingAction: null, // 保存性别后要执行的操作
      // 输入密语相关
      showInputCuteIdModal: false,
      inputCuteId: ''
    };
  },
  computed: {
    comprehensivePersonality() {
      const records = this.userStore.userData.analysis_records;
      if (!records || records.length === 0) {
        const personalityInfo = this.personalities['unknown'];
        return {
          personalityAvatar: getPersonalityAvatar('unknown'),
          personalityName: personalityInfo?.name || '未知',
          campName: personalityInfo?.camp || '',
          description: personalityInfo?.description || '',
          dimensions: personalityInfo?.dimensionTags || [],
          personalityCode: 'unknown',
          campBadgeIcon: getCampIconUrl('unknown'),
          dateTime: ''
        };
      }
      
      const latestRecord = records[records.length - 1];
      const personalityCode = latestRecord.personality || 'unknown';
      const personalityInfo = this.personalities[personalityCode] || this.personalities['unknown'];
      
      return {
        personalityAvatar: getPersonalityAvatar(personalityCode),
        personalityName: personalityInfo?.name || '未知',
        campName: personalityInfo?.camp || '',
        description: personalityInfo?.description || '',
        dimensions: personalityInfo?.dimensionTags || [],
        personalityCode,
        campBadgeIcon: getCampIconUrl(personalityCode),
        dateTime: this.formatDateTime(latestRecord.timestamp)
      };
    },
    reminderMessage() {
      const records = this.userStore.userData.analysis_records;
      if (!records || records.length === 0) {
        return '当前暂无测试记录';
      }
      
      const latestRecord = records[records.length - 1];
      const now = Date.now();
      const timeDiff = now - latestRecord.timestamp;
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 3) {
        return '测试保质期已过，当前结果无法代表真实的你';
      } else if (daysDiff >= 1) {
        return '测试即将临期，马上更新测试结果吧';
      } else {
        return '要不要分享给朋友，测测匹配度';
      }
    },
    cuteId() {
      return this.userStore.userData.cuteId;
    }
  },
  methods: {
    copyCuteId() {
      uni.setClipboardData({
        data: this.cuteId,
        success: () => {
          uni.showToast({
            title: '复制成功',
            icon: 'success',
            duration: 1500
          });
        },
        fail: () => {
          uni.showToast({
            title: '复制失败',
            icon: 'none',
            duration: 1500
          });
        }
      });
    },
    handleRelationTest() {
      // 检查是否需要设置性别
      const hasGender = this.userStore.userData.gender;
      if (!hasGender) {
        this.pendingAction = 'showTestModeModal';
        this.openGenderModal(true); // 传入 true 表示是新用户第一次设置
        return;
      }
      
      // 检查是否有人格测试记录
      if (this.userStore.userData.analysis_records.length === 0) {
        uni.showModal({
          title: '需要先完成人格测试',
          content: '进行关系测试需要先完成人格测试，获取你的人格数据',
          confirmText: '去测试',
          cancelText: '回到首页',
          success: (res) => {
            if (res.confirm) {
              this.pendingAction = 'goToPersonalityTest';
              this.goToPersonalityTest();
            }
          }
        });
        return;
      }
      
      // 显示测试模式选择弹窗
      this.showTestModeModal = true;
    },
    openShareModal() {
      this.showShareModalFlag = true;
    },
    closeShareModal() {
      this.showShareModalFlag = false;
      this.isMatchShare = false;
    },
    closeTestModeModal() {
      this.showTestModeModal = false;
    },
    goDirectTest() {
      this.closeTestModeModal();
      this.isMatchShare = true;
      this.showShareModalFlag = true;
    },
    goInputCuteId() {
      this.closeTestModeModal();
      this.openInputCuteIdModal();
    },
    openInputCuteIdModal() {
      this.inputCuteId = '';
      this.showInputCuteIdModal = true;
    },
    closeInputCuteIdModal() {
      this.showInputCuteIdModal = false;
    },
    doDirectMatch() {
      if (!this.inputCuteId || this.inputCuteId.length !== 7) {
        uni.showToast({
          title: '请输入完整的7位密语',
          icon: 'none'
        });
        return;
      }
      this.closeInputCuteIdModal();
      this.processMatch(this.inputCuteId.toUpperCase(), false);
    },
    doPrivateMatch() {
      if (!this.inputCuteId || this.inputCuteId.length !== 7) {
        uni.showToast({
          title: '请输入完整的7位密语',
          icon: 'none'
        });
        return;
      }
      this.closeInputCuteIdModal();
      this.processMatch(this.inputCuteId.toUpperCase(), true);
    },
    generateCuteIdImage() {
      this.closeShareModal();
      const ctx = uni.createCanvasContext('shareCanvas');
      
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, 750, 1200);
      
      ctx.setFontSize(32);
      ctx.setFillStyle('#333333');
      ctx.setTextAlign('center');
      ctx.fillText('我的人格密语', 750 / 2, 200);
      
      ctx.setFontSize(48);
      ctx.setFillStyle('#FA325A');
      ctx.setStrokeStyle('#FA325A');
      ctx.setLineWidth(2);
      ctx.strokeText(this.cuteId, 750 / 2, 300);
      ctx.fillText(this.cuteId, 750 / 2, 300);
      
      ctx.setFontSize(28);
      ctx.setFillStyle('#999999');
      ctx.fillText('快来测测我们的匹配度', 750 / 2, 380);
      
      ctx.draw(true, () => {
        uni.canvasToTempFilePath({
          canvasId: 'shareCanvas',
          success: (res) => {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.showToast({
                  title: '保存成功',
                  icon: 'success',
                  duration: 2000
                });
              },
              fail: () => {
                uni.showToast({
                  title: '保存失败',
                  icon: 'none',
                  duration: 2000
                });
              }
            });
          },
          fail: () => {
            uni.showToast({
              title: '生成图片失败',
              icon: 'none',
              duration: 2000
            });
          }
        });
      });
    },
    generateShareImage(callback) {
      let timeoutId = setTimeout(() => {
        callback(new Error('生成图片超时'), null);
      }, 10000);
      
      const ctx = uni.createCanvasContext('shareCanvas');
      const width = 750;
      const height = 1200;
      
      ctx.drawImage('/static/images/poster.png', 0, 0, width, height);

      ctx.setFillStyle('#999999');
      ctx.setFontSize(28);
      ctx.setTextAlign('center');
      ctx.fillText('这是我的人格密语', width / 2, 300);

      ctx.setFillStyle('#FA325A');
      ctx.setFontSize(72);
      ctx.setTextAlign('center');
      ctx.setLineWidth(4);
      ctx.setStrokeStyle('#FA325A');
      ctx.strokeText(this.cuteId, width / 2, 420);
      ctx.fillText(this.cuteId, width / 2, 420);

      ctx.setFillStyle('#666666');
      ctx.setFontSize(28);
      ctx.setTextAlign('center');
      ctx.fillText('扫码测试我们的匹配度', width / 2, 520);
      ctx.fillText('看看我们搭不搭', width / 2, 565);
      
      ctx.draw(false, () => {
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvasId: 'shareCanvas',
            width: width,
            height: height,
            destWidth: width * 2,
            destHeight: height * 2,
            success: (res) => {
              clearTimeout(timeoutId);
              callback(null, res.tempFilePath);
            },
            fail: (err) => {
              clearTimeout(timeoutId);
              callback(err, null);
            }
          });
        }, 500);
      });
    },
    shareCuteId() {
      uni.showLoading({ title: '生成图片中...' });
      
      this.generateShareImage((err, tempFilePath) => {
        uni.hideLoading();
        
        if (err) {
          uni.showToast({
            title: '生成图片失败',
            icon: 'none'
          });
          return;
        }
        
        const isWeixin = typeof wx !== 'undefined';
        
        if (isWeixin) {
          uni.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
          });
          
          uni.showActionSheet({
            itemList: ['发送给朋友', '分享到朋友圈', '保存图片'],
            success: (res) => {
              if (res.tapIndex === 0) {
                uni.shareAppMessage({
                  imageUrl: tempFilePath,
                  success: () => {
                    uni.showToast({
                      title: '分享成功',
                      icon: 'success'
                    });
                  },
                  fail: () => {
                    uni.showToast({
                      title: '分享失败',
                      icon: 'none'
                    });
                  }
                });
              } else if (res.tapIndex === 1) {
                uni.shareTimeline({
                  imageUrl: tempFilePath,
                  success: () => {
                    uni.showToast({
                      title: '分享成功',
                      icon: 'success'
                    });
                  },
                  fail: () => {
                    uni.showToast({
                      title: '分享失败',
                      icon: 'none'
                    });
                  }
                });
              } else if (res.tapIndex === 2) {
                this.saveImageToAlbum(tempFilePath);
              }
            }
          });
        } else {
          uni.showActionSheet({
            itemList: ['保存图片'],
            success: (res) => {
              if (res.tapIndex === 0) {
                this.saveImageToAlbum(tempFilePath);
              }
            }
          });
        }
      });
    },
    saveImageToAlbum(tempFilePath) {
      uni.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          uni.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          });
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes('auth')) {
            uni.showModal({
              title: '提示',
              content: '请开启相册权限',
              showCancel: false
            });
          } else {
            uni.showToast({
              title: '保存失败',
              icon: 'none',
              duration: 1500
            });
          }
        }
      });
    },
    saveCuteIdImage() {
      uni.showLoading({ title: '生成图片中...' });
      
      this.generateShareImage((err, tempFilePath) => {
        uni.hideLoading();
        
        if (err) {
          uni.showToast({
            title: '生成图片失败',
            icon: 'none'
          });
          return;
        }
        
        this.saveImageToAlbum(tempFilePath);
      });
    },
    formatDateTime(timestamp) {
      let ts = timestamp;
      if (ts && ts.toString().length === 10) {
        ts = ts * 1000;
      }
      const date = new Date(ts);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    },
    formatDate(timestamp) {
      let ts = timestamp;
      if (ts && ts.toString().length === 10) {
        ts = ts * 1000;
      }
      const date = new Date(ts);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    formatTime(timestamp) {
      let ts = timestamp;
      if (ts && ts.toString().length === 10) {
        ts = ts * 1000;
      }
      const date = new Date(ts);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    },
    startAnalysis() {
      this.showModeModal = true;
    },
    closeModeModal() {
      this.showModeModal = false;
    },
    goToSimpleMode() {
      this.showModeModal = false;
      uni.navigateTo({
        url: '/pages/analysis-simple/analysis-simple'
      });
    },
    goToHellMode() {
      this.showModeModal = false;
      uni.navigateTo({
        url: '/pages/analysis/analysis'
      });
    },
    loadUserProfile() {
      try {
        const saved = uni.getStorageSync('userProfile');
        if (saved && typeof saved === 'object') {
          this.userProfile.userId = (typeof saved.userId === 'string' && saved.userId.trim()) ? saved.userId : 'cuteid';
          this.userProfile.nickname = (typeof saved.nickname === 'string' && saved.nickname.trim()) ? saved.nickname : '小可爱';
          this.userProfile.avatar = (typeof saved.avatar === 'string') ? saved.avatar : '';
        }
      } catch (e) {
        console.log('加载用户信息失败:', e);
        uni.showToast({
          title: '加载用户信息失败',
          icon: 'none',
          duration: 1500
        });
      }
    },
    goToPersonalityDetail() {
      if (this.comprehensivePersonality) {
        uni.navigateTo({
          url: `/pages/archive/archive?code=${this.comprehensivePersonality.personalityCode}`
        });
      }
    },
    goToPersonalityTest() {
      // 检查是否需要设置性别
      const hasGender = this.userStore.userData.gender;
      if (!hasGender) {
        this.pendingAction = 'goToPersonalityTest';
        this.openGenderModal();
        return;
      }
      this.showModeModal = true;
    },
    saveUserProfile() {
      try {
        uni.setStorageSync('userProfile', this.userProfile);
      } catch (e) {
        console.log('保存用户信息失败:', e);
        uni.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 1500
        });
      }
    },
    showAvatarActions() {
      uni.showActionSheet({
        itemList: ['从相册选择', '拍照'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.chooseImage('album');
          } else if (res.tapIndex === 1) {
            this.chooseImage('camera');
          }
        },
        fail: (err) => {
          console.log('用户取消选择:', err);
        }
      });
    },
    onChooseAvatar(e) {
      try {
        console.log('选择头像结果:', e);
        if (e.detail && e.detail.avatarUrl) {
          this.userProfile.avatar = e.detail.avatarUrl;
          this.saveUserProfile();
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
    },
    chooseImage(sourceType) {
      uni.chooseImage({
        count: 1,
        sourceType: [sourceType],
        success: (res) => {
          try {
            if (res.tempFilePaths && res.tempFilePaths.length > 0) {
              this.userProfile.avatar = res.tempFilePaths[0];
              this.saveUserProfile();
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
    },
    editNickname() {
      uni.showModal({
        title: '修改昵称',
        editable: true,
        placeholderText: '请输入新昵称',
        content: this.userProfile.nickname,
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
                this.userProfile.nickname = newNickname;
                this.saveUserProfile();
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
    },
    calculateComprehensivePersonality(records) {
      if (!records || !Array.isArray(records) || records.length === 0) {
        const personalityInfo = this.personalities['unknown'];
        return {
          personalityAvatar: getPersonalityAvatar('unknown'),
          personalityName: personalityInfo.name || '未知',
          campName: personalityInfo.camp || '',
          description: personalityInfo.description || '',
          dimensions: personalityInfo.dimensionTags || [],
          personalityCode: 'unknown',
          campBadgeIcon: getCampIconUrl('unknown'),
          dateTime: this.formatDateTime(Date.now())
        };
      }
      
      const latestRecord = records.length > 0 ? records[records.length - 1] : null;
      
      if (!latestRecord) {
        const personalityInfo = this.personalities['unknown'];
        return {
          personalityAvatar: getPersonalityAvatar('unknown'),
          personalityName: personalityInfo.name || '未知',
          campName: personalityInfo.camp || '',
          description: personalityInfo.description || '',
          dimensions: personalityInfo.dimensionTags || [],
          personalityCode: 'unknown',
          campBadgeIcon: getCampIconUrl('unknown'),
          dateTime: this.formatDateTime(Date.now())
        };
      }
      
      const personalityCode = latestRecord.personality || 'unknown';
      const personalityInfo = this.personalities[personalityCode] || this.personalities['unknown'];
      
      return {
        personalityAvatar: getPersonalityAvatar(personalityCode),
        personalityName: personalityInfo.name || '未知',
        campName: personalityInfo.camp || '',
        description: personalityInfo.description || '',
        dimensions: personalityInfo.dimensionTags || [],
        personalityCode,
        campBadgeIcon: getCampIconUrl(personalityCode),
        dateTime: this.formatDateTime(latestRecord.timestamp)
      };
    },
    getReminderMessage(records) {
      if (!records || !Array.isArray(records) || records.length === 0) {
        return '首次测试后，即可更新自己的阵营';
      }
      
      const count = records.length;
      if (count === 1) {
        return `已进行 ${count} 次人格解析`;
      } else if (count < 5) {
        return `已进行 ${count} 次人格解析，继续探索吧`;
      } else {
        return `资深分析师，已解析 ${count} 次`;
      }
    },
    refreshTrendData() {
      const records = this.userStore.userData.analysis_records || [];
      
      this._comprehensivePersonality = this.calculateComprehensivePersonality(records);
      this._reminderMessage = this.getReminderMessage(records);
    },
    processMatch(friendCuteId, isPrivate) {
      console.log(`[index processMatch] 开始, friendCuteId: ${friendCuteId}, isPrivate: ${isPrivate}`);
      uni.showLoading({ title: '计算匹配度...' });
      
      const timeoutId = setTimeout(() => {
        console.log('云函数调用超时');
        uni.hideLoading();
        uni.showModal({
          title: '无法获取好友数据',
          content: `好友(${friendCuteId})还没有完成人格测试，无法计算匹配度。请让好友先完成测试后再试。`,
          showCancel: false,
          confirmText: '我知道了'
        });
      }, 8000);
      
      if (uni.cloud) {
        uni.cloud.callFunction({
          name: 'getPersonality',
          data: { cuteId: friendCuteId },
          success: (res) => {
            clearTimeout(timeoutId);
            console.log(`[index processMatch] getPersonality 返回:`, res);
            console.log(`[index processMatch] res.result:`, res.result);
            if (res.result && res.result.success && res.result.data) {
              this.processMatchResult(res.result.data, friendCuteId, isPrivate);
            } else {
              uni.hideLoading();
              const failReason = res.result?.message || '云函数未返回原因';
              console.log(`[index processMatch] ❌ getPersonality 失败: ${failReason}`);
              const totalUsers = res.result?.totalUsers ?? '?';
              const totalRecords = res.result?.totalRecords ?? '?';
              uni.showModal({
                title: '无法获取好友数据',
                content: `好友(${friendCuteId})还没有完成人格测试。\n\n调试信息：users表${totalUsers}条，records表${totalRecords}条`,
                showCancel: false,
                confirmText: '我知道了'
              });
            }
          },
          fail: (err) => {
            clearTimeout(timeoutId);
            console.log('[index processMatch] ❌ 云函数调用失败:', err);
            uni.hideLoading();
            uni.showModal({
              title: '获取好友数据失败',
              content: `无法获取好友的人格数据，请检查网络后重试。\n\n调试：${err.errMsg || err.message || '未知错误'}`,
              showCancel: false,
              confirmText: '我知道了'
            });
          }
        });
      } else {
        clearTimeout(timeoutId);
        uni.hideLoading();
        uni.showModal({
          title: '无法获取好友数据',
          content: `当前环境不支持云函数调用，请配置云开发后重试。`,
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    },
    processMatchResult(friendPersonalityData, friendCuteId, isPrivate) {
      const myCuteId = this.userStore.userData.cuteId || '';
      
      const latestRecord = this.userStore.userData.analysis_records && this.userStore.userData.analysis_records.length > 0 
        ? this.userStore.userData.analysis_records[this.userStore.userData.analysis_records.length - 1]
        : null;
        
      if (!latestRecord) {
        uni.hideLoading();
        uni.showModal({
          title: '匹配失败',
          content: '你还没有完成人格测试，无法进行匹配。',
          showCancel: false,
          confirmText: '我知道了'
        });
        return;
      }
      
      const myPersonality = latestRecord.personality || '';
      const myGender = latestRecord.gender || this.userStore.userData.gender;
      
      const myData = {
        percentages: latestRecord.percentages || { E: 50, I: 50, S: 50, N: 50, T: 50, F: 50, J: 50, P: 50 },
        gender: myGender
      };
      
      let friendData = null;
      let friendPersonality = '';
      
      if (friendPersonalityData && friendPersonalityData.percentages && Object.keys(friendPersonalityData.percentages).length > 0) {
        friendData = {
          percentages: friendPersonalityData.percentages,
          gender: friendPersonalityData.gender || (myGender === 'male' ? 'female' : 'male')
        };
        friendPersonality = friendPersonalityData.personality || friendPersonalityData.personalityCode || '';
      } else {
        uni.hideLoading();
        uni.showModal({
          title: '匹配失败',
          content: '好友还没有完成人格测试，无法计算匹配度。',
          showCancel: false,
          confirmText: '我知道了'
        });
        return;
      }
      
      const matchResult = scoring.calculateRelationshipMatch(myData, friendData);
      
      console.log('匹配结果:', matchResult);
      
      const savedMatchResult = {
        userA: { 
          cuteId: friendCuteId, 
          personalityCode: friendPersonality, 
          personality: friendPersonality, 
          percentages: friendData.percentages 
        },
        userB: { 
          cuteId: myCuteId, 
          personalityCode: myPersonality, 
          personality: myPersonality, 
          percentages: myData.percentages 
        },
        matchScore: matchResult.matchScore, 
        matchData: matchResult,
        isPrivate
      };
      
      uni.setStorageSync('matchResult', savedMatchResult);
      uni.setStorageSync('matchTarget', '');
      
      setTimeout(() => {
        uni.hideLoading();
        uni.navigateTo({ 
          url: `/pages/crush-result/crush-result?myID=${encodeURIComponent(myCuteId)}&friendID=${encodeURIComponent(friendCuteId)}&matchResult=${encodeURIComponent(JSON.stringify(matchResult))}`
        });
      }, 100);
    },
    // 性别设置相关方法
    openGenderModal(isFirstTime = false) {
      // 如果是新用户第一次设置，不预设；如果是修改，显示当前选择
      this.selectedGender = isFirstTime ? '' : (this.userStore.userData.gender || '');
      this.showGenderModal = true;
    },
    closeGenderModal() {
      this.showGenderModal = false;
    },
    selectGender(gender) {
      this.selectedGender = gender;
    },
    saveGender() {
      if (!this.selectedGender) {
        uni.showToast({
          title: '请选择性别',
          icon: 'none'
        });
        return;
      }
      
      if (this.selectedGender === 'x') {
        this.showGenderModal = false;
        this.showPrivacyConfirmModal = true;
        return;
      }
      
      this.userStore.updateProfile({
        gender: this.selectedGender
      });
      uni.showToast({
        title: '性别设置成功',
        icon: 'success'
      });
      this.closeGenderModal();
      
      // 执行之前暂存的操作
      this.executePendingAction();
    },
    confirmPrivacy() {
      this.userStore.updateProfile({
        gender: 'x'
      });
      uni.showToast({
        title: '性别已保密',
        icon: 'success'
      });
      this.showPrivacyConfirmModal = false;
      
      // 执行之前暂存的操作
      this.executePendingAction();
    },
    executePendingAction() {
      if (this.pendingAction) {
        const action = this.pendingAction;
        this.pendingAction = null;
        
        if (action === 'goToPersonalityTest') {
          this.showModeModal = true;
        } else if (action === 'showTestModeModal') {
          // 重新检查是否有人格测试记录
          if (this.userStore.userData.analysis_records.length === 0) {
            uni.showModal({
              title: '需要先完成人格测试',
              content: '进行关系测试需要先完成人格测试，获取你的人格数据',
              confirmText: '去测试',
              cancelText: '回到首页',
              success: (res) => {
                if (res.confirm) {
                  this.pendingAction = 'goToPersonalityTest';
                  this.goToPersonalityTest();
                }
              }
            });
            return;
          }
          this.showTestModeModal = true;
        } else if (action === 'processFromLink') {
          // 从链接进入的处理逻辑
          const matchTarget = uni.getStorageSync('matchTarget');
          if (matchTarget) {
            if (!this.userStore.userData.analysis_records || this.userStore.userData.analysis_records.length === 0) {
              uni.showModal({
                title: '匹配邀请',
                content: `收到好友的人格密语邀请！但你需要先完成人格测试才能查看匹配结果。`,
                showCancel: false,
                confirmText: '开始测试',
                success: () => {
                  this.showModeModal = true;
                }
              });
              return;
            }
            
            uni.showModal({
              title: '匹配邀请',
              content: `收到好友的人格密语邀请！是否查看你们的匹配度？`,
              confirmText: '立即查看',
              cancelText: '偷偷测试',
              success: (res) => {
                if (res.confirm) {
                  this.processMatch(matchTarget, false);
                } else {
                  this.processMatch(matchTarget, true);
                }
              }
            });
          }
        }
      }
    },
    closePrivacyConfirmModal() {
      this.showPrivacyConfirmModal = false;
      setTimeout(() => {
        this.showGenderModal = true;
      }, 100);
    }
  },
  onShow() {
    // 从测试页返回时，检查是否有待处理的匹配邀请
    const matchTarget = uni.getStorageSync('matchTarget');
    if (matchTarget && this.userStore?.userData?.analysis_records?.length > 0) {
      uni.showModal({
        title: '匹配邀请',
        content: '你已完成人格测试，是否查看与好友的匹配度？',
        confirmText: '立即查看',
        cancelText: '偷偷测试',
        success: (res) => {
          if (res.confirm) {
            this.processMatch(matchTarget, false);
          } else {
            this.processMatch(matchTarget, true);
          }
        }
      });
    }
  },
  onLoad(options) {
    this.loadUserProfile();
    this.userStore.loadUserData();
    this.refreshTrendData();
    
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const opts = currentPage.options || options || {};
    
    if (opts && opts.from) {
      const matchTarget = opts.from;
      uni.setStorageSync('matchTarget', matchTarget);
      
      // 检查是否需要设置性别
      const hasGender = this.userStore.userData.gender;
      if (!hasGender) {
        setTimeout(() => {
          this.pendingAction = 'processFromLink';
          this.openGenderModal();
        }, 500);
        return;
      }
      
      if (!this.userStore.userData.analysis_records || this.userStore.userData.analysis_records.length === 0) {
        setTimeout(() => {
          uni.showModal({
            title: '匹配邀请',
            content: `收到好友的人格密语邀请！但你需要先完成人格测试才能查看匹配结果。`,
            showCancel: false,
            confirmText: '开始测试',
            success: () => {
              uni.navigateTo({
                url: '/pages/analysis-simple/analysis-simple'
              });
            }
          });
        }, 500);
        return;
      }
      
      setTimeout(() => {
        uni.showModal({
          title: '匹配邀请',
          content: `收到好友的人格密语邀请！是否查看你们的匹配度？`,
          confirmText: '立即查看',
          cancelText: '偷偷测试',
          success: (res) => {
            if (res.confirm) {
              this.processMatch(matchTarget, false);
            } else {
              this.processMatch(matchTarget, true);
            }
          }
        });
      }, 500);
    }
  },
  onShareAppMessage() {
    const cuteId = this.userStore.userData.cuteId || '';
    // 仅当来自"关系测试"流程才带 from 参数触发匹配
    if (this.isMatchShare) {
      this.isMatchShare = false;
      return {
        title: `我的人格密语是 ${cuteId}，快来测测我们的匹配度！`,
        path: `/pages/index/index?from=${cuteId}`,
        imageUrl: ''
      };
    }
    return {
      title: '来测测你的81型融合人格吧！',
      path: '/pages/index/index',
      imageUrl: ''
    };
  },
  onShareTimeline() {
    const cuteId = this.userStore.userData.cuteId || '';
    const hasRecords = this.userStore.userData.analysis_records && this.userStore.userData.analysis_records.length > 0;
    
    if (!hasRecords) {
      return {
        title: '81型融合人格测试',
        query: '',
        imageUrl: ''
      };
    }
    
    return {
      title: `81型融合人格测试 - 我的密语：${cuteId}`,
      query: `from=${cuteId}`,
      imageUrl: ''
    };
  },
  created() {
    this.userStore = useUserStore();
  }
};
</script>

<style lang="scss">
page {
  font-family: -apple-system, BlMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  width: 100%;
  background-color: transparent;
}

.nav-bar {
  width: 100%;
  height: var(--status-bar-height);
  background-color: #f4f4f4;
}

.page-container {
  min-height: 100vh;
  padding: 0;
  padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow-x: hidden;
  background-color: #f4f4f4;
}

.brand-area {
  width: 100%;
  height: 750rpx;
  background-color: #f4f4f4;
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 200rpx;
  box-sizing: border-box;
}

.brand-logo {
  width: 240rpx;
  height: 240rpx;
  margin-top: 0;
  display: block;
}

.brand-slogan {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.slogan-line {
  font-size: 28rpx;
  color: #000000;
  line-height: 1.8;
  text-align: center;
}

.content-area {
  padding: 30rpx;
  padding-top: 20rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  position: relative;
}

.tip-text {
  font-size: 24rpx;
  color: #646464;
  line-height: 1.6;
  text-align: center;
  padding: 20rpx 0 10rpx;
  margin-top: 20rpx;
  margin-bottom: 10rpx;
  display: block;
}

button::after {
  border: none;
}

.trend-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
  display: block;
  margin-bottom: 20rpx;
}

.personality-card {
  position: relative;
  padding: 0 28rpx 28rpx;
}

.more-link {
  position: absolute;
  right: 24rpx;
  font-size: 24rpx;
  color: #ffffff;
}

.trend-personality-main {
  display: flex;
  justify-content: center;
}

.trend-personality-content {
  display: flex;
  align-items: center;
}

.trend-personality-avatar {
  width: 160rpx;
  height: 160rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.trend-personality-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.trend-personality-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.trend-personality-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
}

.trend-camp-name {
  font-size: 26rpx;
  color: #646464;
  margin-bottom: 16rpx;
}

.trend-dimensions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.trend-dimension-tag {
  background-color: #000000;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
  padding: 6rpx 16rpx;
  border-radius: 60rpx;
  white-space: nowrap;
}

.trend-description {
  font-size: 26rpx;
  color: #000000;
  line-height: 1.6;
  margin-top: 20rpx;
  display: block;
  text-align: center;
}

.trend-camp-badge {
  position: absolute;
  top: 50rpx;
  right: 14rpx;
  width: 200rpx;
  height: 200rpx;
  opacity: 0.1;
  z-index: 1;
}

.entry-card {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  margin-top: -90rpx;
  margin-bottom: 50rpx;
  position: relative;
  z-index: 1;
}

.test-entry-left,
.test-entry-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.test-entry-left {
  background-color: transparent;
  border: none;
  padding: 0;
  margin: 0;
  line-height: inherit;
}

.test-entry-subtitle {
  font-size: 22rpx;
  color: #000000;
  margin-bottom: 10rpx;
  display: block;
}

.test-entry-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 10rpx;
  display: block;
}

.test-entry-desc {
  font-size: 22rpx;
  color: #666666;
  display: block;
}

.test-entry-divider {
  width: 2rpx;
  background-color: #cccccc;
  margin: 0 20rpx;
  height: 80rpx;
  flex-shrink: 0;
}

.personality-header-bar {
  background-color: #000000;
  color: #ffffff;
  padding: 16rpx 28rpx;
  border-radius: 16rpx 16rpx 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -28rpx -28rpx 20rpx -28rpx;
}

.header-bar-text {
  font-size: 24rpx;
  color: #ffffff;
}

.update-date {
  font-size: 24rpx;
  color: #646464;
  margin-bottom: 20rpx;
  display: block;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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

.modal-desc {
  font-size: 28rpx;
  color: #666666;
  text-align: center;
  display: block;
  margin-bottom: 40rpx;
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.share-card {
  background-color: #f5f5f5;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  border: 2px solid #e0e0e0;
}

button.share-card {
  border: 2px solid #e0e0e0;
  line-height: normal;
  font-size: 24rpx;
  padding: 32rpx;
  margin: 0;
  background-color: #f5f5f5;
}

button.share-card::after {
  border: none;
}

.share-card:active,
button.share-card:active {
  background-color: #FA325A;
  border-color: #FA325A;
}

.share-card:active .share-name,
.share-card:active .share-desc,
button.share-card:active .share-name,
button.share-card:active .share-desc {
  color: #ffffff;
}

.share-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
  display: block;
  margin-bottom: 12rpx;
}

.share-desc {
  font-size: 24rpx;
  color: #666666;
  display: block;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.mode-card {
  background-color: #f5f5f5;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  border: 2px solid #e0e0e0;
}

.mode-card:active {
  background-color: #FA325A;
  border-color: #FA325A;
}

.mode-card:active .mode-name,
.mode-card:active .mode-desc {
  color: #ffffff;
}

.mode-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
  display: block;
  margin-bottom: 12rpx;
}

.mode-desc {
  font-size: 24rpx;
  color: #666666;
  display: block;
  line-height: 1.5;
}

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

.privacy-buttons {
  display: flex;
  gap: 20rpx;
}

.privacy-btn {
  flex: 1;
  font-size: 26rpx;
  padding: 20rpx;
  border-radius: 14rpx;
  text-align: center;
  border: none;
}

.privacy-btn::after {
  border: none;
}

.privacy-btn-cancel {
  background-color: #f5f5f5;
  color: #333333;
}

.privacy-btn-confirm {
  background-color: #FA325A;
  color: #ffffff;
}

.cuteId-input {
  width: 100%;
  height: 88rpx;
  background-color: #f5f5f5;
  border-radius: 14rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #000000;
  margin-bottom: 32rpx;
  box-sizing: border-box;
}

.input-cuteId-buttons {
  display: flex;
  gap: 16rpx;
}

.input-cuteId-btn {
  flex: 1;
  font-size: 26rpx;
  padding: 20rpx;
  border-radius: 14rpx;
  text-align: center;
  border: none;
  font-weight: 600;
}

.input-cuteId-btn::after {
  border: none;
}

.input-cuteId-btn-cancel {
  background-color: #f5f5f5;
  color: #333333;
}

.input-cuteId-btn-direct {
  background-color: #000000;
  color: #ffffff;
}

.input-cuteId-btn-private {
  background-color: #FA325A;
  color: #ffffff;
}
</style>
