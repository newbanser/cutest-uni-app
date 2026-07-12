<template>
  <view class="container">
    <view class="fullscreen-bg"></view>
    <view class="card personality-card" v-if="displayView" @tap="goToDetail">
      <text class="personality-title">我的人格测试</text>
      <text class="more-link" @tap.stop="goToDetail">查看更多></text>
      <text class="update-date">测试日期 {{ displayView.dateTime }}</text>
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

    <view class="card evaluation-card" v-if="displayView">
      <view class="dimension-list">
        <view class="dimension-item" v-for="dim in trendDimensionData" :key="dim.key">
          <view class="dimension-top">
            <view class="dimension-name">{{ dim.name }}</view>
            <view class="dimension-label">{{ dim.label }}</view>
          </view>
          <view class="mini-bar">
            <view class="mini-fill" :style="{ width: dim.score + '%' }">
              <text class="mini-text">{{ dim.score }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="card last-card" v-if="displayView && displayView.hasPrevious">
      <text class="history-title">上次分析</text>
      <view class="history-content">
        <view class="history-left">
          <image class="history-camp-icon" :src="displayView.previousCampIcon" mode="aspectFit"></image>
          <text class="history-label">上次所处阵营</text>
        </view>
        <view class="history-divider"></view>
        <view class="history-right">
          <image class="history-avatar" :src="displayView.previousPersonalityAvatar" mode="aspectFill"></image>
          <text class="history-label">上次分析人格</text>
        </view>
      </view>
    </view>

    <view v-if="changeSuggestion" class="suggestion-card" :class="suggestionStyle">
      <text class="suggestion-title">环比变化</text>
      <text class="suggestion-text">{{ changeSuggestion }}</text>
    </view>


    <view class="view-trend-section">
      <view class="delete-btn" @tap="confirmDelete">
        <image class="delete-icon" src="/static/images/delete.png" mode="aspectFit"></image>
      </view>
      <view class="home-btn" @tap="goToHome">
        返回首页
      </view>
      <view class="relation-test-btn" @tap="handleRelationTest">
        关系测试
      </view>
    </view>

    <text class="tip-text">本分析仅供娱乐参考，不能代替专业心理评估</text>

    <canvas canvas-id="shareCanvas" id="shareCanvas" class="hidden-canvas" style="width: 750px; height: 1200px; visibility: hidden; position: fixed; left: -9999px; top: -9999px;"></canvas>

    <view v-if="showDeleteModal" class="modal-overlay">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">确认删除</text>
        <text class="modal-text">你今天还有{{ remainingDeletes }}次删除机会，确认要删除么？</text>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="closeDeleteModal">取消</view>
          <view class="modal-btn confirm-btn" @tap="deleteRecord">删除</view>
        </view>
      </view>
    </view>

    <!-- 分享密语弹窗 -->
    <view class="modal-overlay" v-if="showShareModalFlag">
      <view class="modal-content" @tap.stop>
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
          <view class="share-card" @tap="generateCuteIdImage">
            <text class="share-name">生成密语海报</text>
            <text class="share-desc">生成朋友圈海报</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 测试模式选择弹窗（含输入密语内嵌切换） -->
    <view class="modal-overlay" v-if="showTestModeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-close">×</view>

        <!-- 主界面：选择模式 -->
        <template v-if="!showCuteidInput">
          <text class="modal-title">选择测试模式</text>
          <view class="share-options">
            <button class="share-card" @tap="goDirectTest">
              <text class="share-name">直接测试</text>
              <text class="share-desc">分享你的人格密语</text>
            </button>
            <button class="share-card" @tap="openCuteidInput">
              <text class="share-name">输入密语</text>
              <text class="share-desc">输入对方的人格密语</text>
            </button>
          </view>
        </template>

        <!-- 内嵌界面：输入密语 -->
        <template v-else>
          <text class="modal-title">请输入对方的密语</text>
          <input
            class="cuteid-input"
            v-model="inputCuteId"
            placeholder="人格密语是一串7位的字母数字组合"
            maxlength="7"
          />
          <view class="input-cuteid-buttons">
            <button class="input-cuteid-btn input-cuteid-btn-cancel" @tap="closeCuteidInput">返回</button>
            <button class="input-cuteid-btn input-cuteid-btn-direct" @tap="doMatch">开始匹配</button>
          </view>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import personalitiesData from '@/data/personalities';
import { getPersonalityAvatar, getCampIconUrl } from '@/utils/imageHelper';
import scoring from '@/utils/scoring';

const { personalities } = personalitiesData.personalitiesData;
const userStore = useUserStore();

const view = ref(null);
const personality = ref('');
const displayView = ref(null);
const changeSuggestion = ref('');
const suggestionStyle = ref('');
const showDeleteModal = ref(false);
const showShareModalFlag = ref(false);
const showTestModeModal = ref(false);
const showCuteidInput = ref(false); // 测试模式弹窗内切换到输入密语界面
const openCuteidInput = () => { showCuteidInput.value = true; };
const closeCuteidInput = () => { showCuteidInput.value = false; };
const isMatchShare = ref(false); // 标记是否来自"关系测试"流程
const currentViewId = ref(null);
const isCurrentLatestRecord = ref(false);
const remainingDeletes = ref(1);
const trendDimensionData = ref([]);
const cuteId = ref('');
const inputCuteId = ref('');

const DELETE_KEY = 'delete_count';
const DATE_KEY = 'delete_date';
const SIMPLE_MODE_THRESHOLD_LOW = 45;
const SIMPLE_MODE_THRESHOLD_HIGH = 55;

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getImageInfoPromise = (src) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('图片加载超时'));
    }, 10000);
    
    uni.getImageInfo({
      src: src.startsWith('/') ? src : '/' + src,
      success: (res) => {
        clearTimeout(timeout);
        resolve(res);
      },
      fail: (err) => {
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
};

const loadDeleteCount = () => {
  try {
    const storedDate = uni.getStorageSync(DATE_KEY);
    const today = getTodayDateStr();
    
    if (storedDate === today) {
      const storedCount = uni.getStorageSync(DELETE_KEY);
      remainingDeletes.value = storedCount !== undefined && storedCount !== null ? Number(storedCount) : 1;
    } else {
      remainingDeletes.value = 1;
    }
  } catch (e) {
    remainingDeletes.value = 1;
  }
};

const getPreviousView = (records, currentId) => {
  if (!records || records.length < 2) return null;
  const index = records.findIndex(r => r.id === currentId);
  if (index > 0) return records[index - 1];
  return null;
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};

const calculateDimensionDataForRecord = (record) => {
  if (!record) return [];

  const percentages = record.percentages || {};
  const isSimpleV2 = record.test_mode === 'simple_v2';

  const dimensions = [
    { key: 'EI', name: '能量来源', left: 'E', right: 'I', leftName: '外倾', rightName: '内倾' },
    { key: 'SN', name: '认知方式', left: 'S', right: 'N', leftName: '实感', rightName: '直觉' },
    { key: 'TF', name: '决策依据', left: 'T', right: 'F', leftName: '思考', rightName: '情感' },
    { key: 'JP', name: '行为偏好', left: 'J', right: 'P', leftName: '判断', rightName: '感知' }
  ];

  return dimensions.map(dim => {
    const leftPercent = percentages[dim.left] || 50;
    const rightPercent = percentages[dim.right] || 50;
    const mainPercent = Math.max(leftPercent, rightPercent);
    let label = '';
    let score = leftPercent;

    // simple_v2 是纯二分判型；荣格/地狱模式保留 45~55%→X
    if (!isSimpleV2 && mainPercent >= SIMPLE_MODE_THRESHOLD_LOW && mainPercent <= SIMPLE_MODE_THRESHOLD_HIGH) {
      label = '融合-X';
    } else {
      if (leftPercent >= rightPercent) {
        label = `${dim.leftName}-${dim.left}`;
        score = leftPercent;
      } else {
        label = `${dim.rightName}-${dim.right}`;
        score = rightPercent;
      }
    }

    return { key: dim.key, name: dim.name, label, score };
  });
};

const loadView = () => {
  try {
    userStore.loadUserData();
    const userData = userStore.userData;
    const storedViewId = uni.getStorageSync('currentViewId');
    console.log('[xbti-result loadView] analysis_records 长度:', userData?.analysis_records?.length, 'storedViewId:', storedViewId);

    if (!userData || !userData.analysis_records) {
      console.log('[xbti-result loadView] 数据加载失败：无 analysis_records');
      uni.showToast({ title: '数据加载失败', icon: 'none' });
      return;
    }

    let targetViewId = storedViewId;
    if (!targetViewId) {
      const records = userData.analysis_records;
      if (records && records.length > 0) {
        // 按 timestamp 取最新记录
        const latest = records.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
        targetViewId = latest.id;
      } else {
        uni.showToast({ title: '暂无解析记录', icon: 'none' });
        return;
      }
    }

    currentViewId.value = targetViewId;

    const records = userData.analysis_records;
    if (records && records.length > 0) {
      const latest = records.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
      const latestRecordId = latest.id;
      isCurrentLatestRecord.value = (targetViewId === latestRecordId);
    } else {
      isCurrentLatestRecord.value = false;
    }

    const targetView = userData.analysis_records.find(r => r.id === targetViewId);
    if (!targetView) {
      uni.showToast({ title: '解析数据不存在', icon: 'none' });
      return;
    }

    const personalityCode = targetView.personality || 'unknown';
    const personalityInfo = personalities[personalityCode] || personalities['unknown'];
    const dimensionData = calculateDimensionDataForRecord(targetView);
    
    const previousView = getPreviousView(userData.analysis_records, targetViewId);
    const analyzedChanges = scoring.analyzeChanges(targetView, previousView);
    const changeSuggestionText = analyzedChanges.message || '';
    const suggestionStyleValue = analyzedChanges.level || 'default';

    const dateTime = formatDateTime(targetView.timestamp);

    const displayData = {
      personalityAvatar: getPersonalityAvatar(personalityCode),
      personalityName: personalityInfo.name || '未知',
      campName: personalityInfo.camp || '',
      description: personalityInfo.description || '',
      campBadgeIcon: getCampIconUrl(personalityCode),
      dateTime,
      dimensions: personalityInfo.dimensionTags || [],
      previousCampIcon: previousView ? getCampIconUrl(previousView.personality) : '',
      previousPersonalityAvatar: previousView ? getPersonalityAvatar(previousView.personality) : '',
      hasPrevious: !!previousView
    };

    view.value = targetView;
    personality.value = personalityCode;
    displayView.value = displayData;
    changeSuggestion.value = changeSuggestionText;
    suggestionStyle.value = suggestionStyleValue;
    trendDimensionData.value = dimensionData;
  } catch (error) {
    console.error('loadView error:', error);
    uni.showToast({ title: '加载失败: ' + error.message, icon: 'none' });
  }
};

const goToHome = () => {
  uni.switchTab({
    url: '/pages/index/index',
    success: () => {},
    fail: (err) => {
      console.error('跳转失败', err);
      uni.reLaunch({ url: '/pages/index/index' });
    }
  });
};

const generateCuteId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const loadCuteId = () => {
  try {
    let saved = userStore.userData.cuteId;
    if (!saved || saved.length !== 7) {
      saved = generateCuteId();
      userStore.userData.cuteId = saved;
      userStore.saveUserData();
    }
    cuteId.value = saved;
  } catch (e) {
    cuteId.value = generateCuteId();
  }
};

const drawRoundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const saveReport = () => {
  loadCuteId();
  if (!displayView.value) {
    uni.showToast({ title: '数据加载中，请稍后', icon: 'none' });
    return;
  }

  uni.showLoading({ title: '生成图片中...' });

  const posterPath = '/static/images/poster.png';
  const avatarPath = displayView.value.personalityAvatar;
  
  const ctx = uni.createCanvasContext('shareCanvas');
  const canvasWidth = 750;
  const canvasHeight = 1200;

  const loadImage = (src) => {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('wxfile://')) {
        resolve(src);
        return;
      }
      
      if (src.startsWith('/static/')) {
        resolve(src);
        return;
      }
      
      uni.getImageInfo({
        src: src,
        success: (res) => resolve(res.path),
        fail: () => resolve(src)
      });
    });
  };

  Promise.all([
    loadImage(posterPath),
    loadImage(avatarPath)
  ]).then(([loadedPoster, loadedAvatar]) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    if (loadedPoster) {
      ctx.drawImage(loadedPoster, 0, 0, canvasWidth, canvasHeight);
    }
    
    ctx.setFillStyle('#000000');
    ctx.setFontSize(26);
    ctx.setTextAlign('center');
    ctx.fillText('我的XBTI融合人格是', canvasWidth / 2, 250);

    if (loadedAvatar) {
      ctx.drawImage(loadedAvatar, (canvasWidth - 160) / 2, 280, 160, 160);
    }

    ctx.setFillStyle('#000000');
    ctx.font = '500 36px sans-serif';
    ctx.setTextAlign('center');
    ctx.fillText(displayView.value.personalityName, canvasWidth / 2, 500);

    if (displayView.value.campName) {
      ctx.setFillStyle('#000000');
      ctx.setFontSize(24);
      ctx.fillText(displayView.value.campName, canvasWidth / 2, 550);
    }

    if (displayView.value.dimensions && displayView.value.dimensions.length > 0) {
      const tagWidth = 120;
      const tagHeight = 44;
      const tagGap = 16;
      const totalTagWidth = displayView.value.dimensions.length * tagWidth + (displayView.value.dimensions.length - 1) * tagGap;
      const startX = (canvasWidth - totalTagWidth) / 2;
      const tagY = 570;

      for (let i = 0; i < displayView.value.dimensions.length; i++) {
        const tag = displayView.value.dimensions[i];
        ctx.setFillStyle('#000000');
        drawRoundRect(ctx, startX + i * (tagWidth + tagGap), tagY, tagWidth, tagHeight, 22);
        ctx.fill();
        ctx.setFillStyle('#FFFFFF');
        ctx.setFontSize(20);
        ctx.setTextAlign('center');
        ctx.fillText(tag, startX + i * (tagWidth + tagGap) + tagWidth / 2, tagY + 28);
      }
    }

    if (displayView.value.description) {
      ctx.setFillStyle('#000000');
      ctx.setFontSize(24);
      ctx.setTextAlign('center');
      
      const lineHeight = 36;
      let yPos = 650;
      let currentLine = '';
      const chars = displayView.value.description.split('');
      
      for (let i = 0; i < chars.length; i++) {
        const testLine = currentLine + chars[i];
        if (testLine.length > 22) {
          ctx.fillText(currentLine, canvasWidth / 2, yPos);
          currentLine = chars[i];
          yPos += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        ctx.fillText(currentLine, canvasWidth / 2, yPos);
      }
    }

    ctx.setFillStyle('#000000');
    ctx.setFontSize(26);
    ctx.setTextAlign('center');
    ctx.fillText('我的人格密语：' + cuteId.value, canvasWidth / 2, 740);

    ctx.draw(false, () => {
      setTimeout(() => {
        uni.canvasToTempFilePath({
          canvasId: 'shareCanvas',
          width: canvasWidth,
          height: canvasHeight,
          destWidth: canvasWidth * 2,
          destHeight: canvasHeight * 2,
          success: (res) => {
            const tempFilePath = res.tempFilePath;
            
            uni.saveImageToPhotosAlbum({
              filePath: tempFilePath,
              success: () => {
                uni.hideLoading();
                uni.showToast({ title: '保存成功', icon: 'success' });
                setTimeout(() => {
                  uni.switchTab({
                    url: '/pages/index/index',
                    fail: () => {
                      uni.navigateTo({ url: '/pages/index/index' });
                    }
                  });
                }, 1500);
              },
              fail: (err) => {
                uni.hideLoading();
                console.error('saveImageToPhotosAlbum fail:', err);
                if (err.errMsg && err.errMsg.includes('auth')) {
                  uni.showModal({
                    title: '提示',
                    content: '需要您授权保存图片到相册',
                    success: (modalRes) => {
                      if (modalRes.confirm) uni.openSetting();
                    }
                  });
                } else {
                  uni.showToast({ title: '保存失败: ' + (err.errMsg || '未知错误'), icon: 'none' });
                }
              }
            });
          },
          fail: (err) => {
            uni.hideLoading();
            console.error('canvasToTempFilePath fail:', err);
            uni.showToast({ title: '生成分享图失败', icon: 'none' });
          }
        });
      }, 200);
    });
  }).catch((err) => {
    uni.hideLoading();
    console.error('load images fail:', err);
    uni.showToast({ title: '图片加载失败', icon: 'none' });
  });
};

const goToDetail = () => {
  if (personality.value) {
    uni.navigateTo({ url: `/pages/archive/archive?code=${personality.value}` });
  }
};

const confirmDelete = () => {
  loadDeleteCount();
  if (remainingDeletes.value <= 0) {
    uni.showToast({ title: '今天的删除机会已用完', icon: 'none' });
    return;
  }
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
};

const deleteRecord = async () => {
  try {
    if (remainingDeletes.value <= 0) {
      uni.showToast({ title: '今天的删除机会已用完', icon: 'none' });
      showDeleteModal.value = false;
      return;
    }

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

    // 调用云函数软删除
    try {
      await uni.cloud.callFunction({
        name: 'deletePersonalityRecord',
        data: { recordId: currentViewId.value }
      });
    } catch (e) {
      console.error('[xbti-result] 云端删除失败:', e);
    }

    const originalCount = userData.analysis_records.length;
    userData.analysis_records = userData.analysis_records.filter(r => r.id !== currentViewId.value);

    if (userData.analysis_records.length === originalCount) {
      uni.showToast({ title: '删除失败', icon: 'none' });
      return;
    }

    userStore.saveUserData();

    remainingDeletes.value -= 1;
    const today = getTodayDateStr();
    uni.setStorageSync(DATE_KEY, today);
    uni.setStorageSync(DELETE_KEY, remainingDeletes.value);

    uni.showToast({ title: '删除成功', icon: 'success', duration: 1500 });

    setTimeout(() => {
      uni.navigateBack({
        fail: () => {
          uni.switchTab({ url: '/pages/index/index' });
        }
      });
    }, 1500);
  } catch (error) {
    console.error('deleteRecord error:', error);
    uni.showToast({ title: '删除失败: ' + error.message, icon: 'none' });
  }
  showDeleteModal.value = false;
};

const handleRelationTest = () => {
  if (!isCurrentLatestRecord.value) {
    uni.showModal({
      title: '提示',
      content: '请用最新的人格测试结果进行关系测试',
      showCancel: false,
      confirmText: '知道了'
    });
    return;
  }
  // 检查是否需要设置性别
  if (!userStore.userData.gender) {
    uni.showModal({
      title: '提示',
      content: '请先在首页选择您的性别后再进行关系测试',
      showCancel: false,
      confirmText: '知道了'
    });
    return;
  }
  // 检查是否有人格测试记录
  if (!userStore.userData.analysis_records || userStore.userData.analysis_records.length === 0) {
    uni.showModal({
      title: '需要先完成人格测试',
      content: '进行关系测试需要先完成人格测试，获取你的人格数据',
      confirmText: '去测试',
      cancelText: '回到首页',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/analysis-jung/analysis-jung'
          });
        }
      }
    });
    return;
  }
  uni.showToast({ title: 'handleRelationTest 被调用', icon: 'none', duration: 2000 });
  // 用微信原生弹窗，绕过模板渲染问题
  uni.showActionSheet({
    itemList: ['输入密语匹配', '分享我的密语'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 输入密语 → 原生输入框
        showTestModeModal.value = true;
        openCuteidInput();
      } else if (res.tapIndex === 1) {
        // 分享密语
        goDirectTest();
      }
    }
  });
};

const closeTestModeModal = () => {
  showTestModeModal.value = false;
};

const goDirectTest = () => {
  closeTestModeModal();
  isMatchShare.value = true;
  openShareModal();
};

const doMatch = () => {
  if (!inputCuteId.value || inputCuteId.value.length !== 7) {
    uni.showToast({
      title: '请输入完整的7位密语',
      icon: 'none'
    });
    return;
  }
  showTestModeModal.value = false;
  closeCuteidInput();
  performMatch(inputCuteId.value.toUpperCase(), false);
};

const openShareModal = () => {
  showShareModalFlag.value = true;
};

const closeShareModal = () => {
  showShareModalFlag.value = false;
  isMatchShare.value = false;
};

const copyCuteId = () => {
  uni.setClipboardData({
    data: cuteId.value,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1600);
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none',
        duration: 1500
      });
    }
  });
};

const handleShare = () => {
  closeShareModal();
  setTimeout(() => {
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }, 300);
};

const generateCuteIdImage = () => {
  closeShareModal();
  uni.showLoading({ title: '生成图片中...' });
  
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
  ctx.strokeText(cuteId.value, 750 / 2, 300);
  ctx.fillText(cuteId.value, 750 / 2, 300);
  
  ctx.setFontSize(28);
  ctx.setFillStyle('#999999');
  ctx.fillText('快来测测我们的匹配度', 750 / 2, 380);
  
  ctx.draw(true, () => {
    setTimeout(() => {
      uni.canvasToTempFilePath({
        canvasId: 'shareCanvas',
        success: (res) => {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.hideLoading();
              uni.showToast({
                title: '保存成功',
                icon: 'success',
                duration: 2000
              });
              setTimeout(() => {
                uni.navigateBack();
              }, 2100);
            },
            fail: (err) => {
              uni.hideLoading();
              uni.showToast({
                title: '保存失败: ' + (err.errMsg || ''),
                icon: 'none',
                duration: 2000
              });
            }
          });
        },
        fail: (err) => {
          uni.hideLoading();
          uni.showToast({
            title: '生成图片失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }, 200);
  });
};

const performMatch = async (matchTarget, isPrivate) => {
  const myCuteId = userStore.userData.cuteId || '';
  
  // 必须要有自己的测试数据
  if (userStore.userData.analysis_records.length === 0) {
    uni.showModal({
      title: '需要先完成人格测试',
      content: '匹配功能需要您先完成人格测试，获取您的人格数据后才能进行匹配。',
      showCancel: false,
      confirmText: '我知道了'
    });
    return;
  }
  
  uni.showLoading({ title: '计算匹配度...' });
  
  try {
    const latestRecord = userStore.userData.analysis_records[userStore.userData.analysis_records.length - 1];
    const myGender = latestRecord.gender || userStore.userData.gender || '';
    const myPersonality = latestRecord.personality || '';
    
    console.log(`[xbti performMatch] 开始, matchTarget: ${matchTarget}, myGender: ${myGender}`);
    console.log(`[xbti performMatch] latestRecord:`, latestRecord);
    
    const myData = {
      percentages: latestRecord.percentages || { E: 50, I: 50, S: 50, N: 50, T: 50, F: 50, J: 50, P: 50 },
      gender: myGender
    };
    
    let friendData = null;
    let friendPersonality = '';
    
    // 调用云函数获取好友的真实人格数据
    if (typeof uni !== 'undefined' && uni.cloud) {
      try {
        const res = await uni.cloud.callFunction({
          name: 'getPersonality',
          data: { cuteid: matchTarget }
        });
        
        console.log(`[xbti performMatch] getPersonality 返回:`, res);
        console.log(`[xbti performMatch] res.result:`, res.result);
        
        if (res.result && res.result.success && res.result.data) {
          const friendPersonalityData = res.result.data;
          if (friendPersonalityData.percentages && Object.keys(friendPersonalityData.percentages).length > 0) {
            friendData = {
              percentages: friendPersonalityData.percentages,
              gender: friendPersonalityData.gender || ''
            };
            friendPersonality = friendPersonalityData.personality || friendPersonalityData.personalityCode || '';
            console.log('✅ 获取到好友真实数据:', friendData, '人格类型:', friendPersonality);
          } else {
            console.log(`[xbti performMatch] ⚠️ 云函数返回的 data.percentages 为空`);
          }
        } else {
          console.log(`[xbti performMatch] ❌ getPersonality 失败:`, res.result);
        }
      } catch (e) {
        console.error('❌ 获取好友数据失败:', e);
      }
    }
    
    // 好友必须有真实的人格测试数据才能计算匹配度
    if (!friendData || !friendData.percentages) {
      uni.hideLoading();
      uni.showModal({
        title: '无法计算匹配度',
        content: `好友(${matchTarget})还没有完成人格测试，无法计算匹配度。请让好友先完成测试后再试。`,
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }
    
    // 使用关系匹配算法计算真实匹配度
    const matchResult = scoring.calculateRelationshipMatch(myData, friendData);
    console.log('匹配结果:', matchResult);
    
    // 保存完整的匹配结果
    const savedMatchResult = {
      userA: { 
        cuteId: matchTarget, 
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
    
    // matchResult 全局单键已废弃（不再写 uni.setStorageSync('matchResult', ...)），避免跨好友串数据
    // 按好友 cuteId 键值存储，crush-result 可精确读取
    const matchResultsMap = uni.getStorageSync('matchResultsMap') || {};
    matchResultsMap[matchTarget] = savedMatchResult;
    uni.setStorageSync('matchResultsMap', matchResultsMap);
    const matchResultByFriend = uni.getStorageSync('matchResultByFriend') || {};
    matchResultByFriend[matchTarget] = savedMatchResult;
    uni.setStorageSync('matchResultByFriend', matchResultByFriend);
    // 保存到匹配记录列表（每次匹配都记录，用于计数）
    const matchRecords = uni.getStorageSync('matchRecords') || [];
    const exists = matchRecords.some(r =>
      (r.userA?.cuteId === matchTarget && r.userB?.cuteId === myCuteId) ||
      (r.userA?.cuteId === myCuteId && r.userB?.cuteId === matchTarget)
    );
    if (!exists) {
      matchRecords.push({
        userA: { cuteId: matchTarget, personalityCode: friendPersonality },
        userB: { cuteId: myCuteId, personalityCode: myPersonality },
        matchData: matchResult,
        timestamp: Date.now()
      });
      uni.setStorageSync('matchRecords', matchRecords);
    }
    uni.setStorageSync('matchTarget', '');
    
    // 保存到云端 match_records 集合
    try {
      uni.cloud.callFunction({
        name: 'createMatch',
        data: {
          friendCuteId: matchTarget,
          myCuteId: myCuteId,
          matchResult: savedMatchResult.matchData,
          isPrivate,
          timestamp: Date.now(),
          initiatorPersonality: myPersonality,
          targetPersonality: friendPersonality
        }
      });
    } catch (e) {
      console.error('[xbti-result] 云端保存匹配记录失败:', e);
    }
    
    uni.hideLoading();
    uni.navigateTo({ 
      url: `/pages/crush-result/crush-result?myID=${encodeURIComponent(myCuteId)}&friendID=${encodeURIComponent(matchTarget)}` 
    });
  } catch (error) {
    uni.hideLoading();
    console.error('匹配失败:', error);
    uni.showToast({
      title: '匹配失败，请重试',
      icon: 'none'
    });
  }
};

// 从关系测试流程过来（A 无记录 → 做题 → 回到此结果页），自动弹出分享弹窗
// 放在 onShow 而非 onMounted 中，确保页面完全就绪
onShow(() => {
  const fromRelationTest = uni.getStorageSync('fromRelationTest');
  console.log('[xbti-result onShow] fromRelationTest:', fromRelationTest, 'truthy:', !!fromRelationTest);
  if (fromRelationTest) {
    uni.removeStorageSync('fromRelationTest');
    console.log('[xbti-result onShow] 准备弹出分享弹窗');
    isMatchShare.value = true;
    showShareModalFlag.value = true;
  } else {
    console.log('[xbti-result onShow] fromRelationTest 为空，不弹分享');
    // 分享完成后返回，关闭弹窗
    showShareModalFlag.value = false;
  }
});

onMounted(() => {
  loadCuteId();
  loadView();

  const matchTarget = uni.getStorageSync('matchTarget');
  if (matchTarget) {
    console.log('[xbti-result] 检测到 matchTarget，跳过匹配弹窗（由首页处理）');
  }
});

// 分享回调 — 使用 uni-app 生命周期钩子而非 defineExpose
// "..." 菜单分享: 仅转发小程序，不带 from 参数
// 关系测试按钮 → 直接测试 → 分享按钮: 携带 from 参数触发匹配
onShareAppMessage(() => {
  const cuteId = userStore.userData.cuteId || '';
  if (isMatchShare.value) {
    isMatchShare.value = false;
    showShareModalFlag.value = false;
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
});

onShareTimeline(() => {
  const cuteId = userStore.userData.cuteId || '';
  return {
    title: `81型融合人格测试 - 我的密语：${cuteId}`,
    query: `from=${cuteId}`,
    imageUrl: ''
  };
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

.personality-card {
  position: relative;
  padding: 28rpx;
}

.personality-title {
  display: none;
}

.more-link {
  position: absolute;
  top: 28rpx;
  right: 28rpx;
  font-size: 24rpx;
  color: #000000;
}

.update-date {
  font-size: 22rpx;
  color: #646464;
  margin-bottom: 20rpx;
  display: block;
  white-space: nowrap;
  overflow: visible;
  line-height: 1.5;
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
  width: 180rpx;
  height: 180rpx;
  width: 180rpx;
  height: 180rpx;
  opacity: 0.1;
  z-index: 1;
}

.evaluation-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.evaluation-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 16rpx;
}

.evaluation-intro {
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 24rpx;
  line-height: 1.5;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.dimension-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dimension-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #333333;
}

.dimension-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #333333;
}

.mini-bar {
  width: 100%;
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
  border-radius: 10rpx 0 0 10rpx;
}

.mini-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.suggestion-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.suggestion-card.default { background-color: #ffffff; }
.suggestion-card.low { background-color: #FFF100; }
.suggestion-card.medium { background-color: #FA325A; }
.suggestion-card.high { background-color: #000000; }

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

.tip-text {
  font-size: 24rpx;
  color: #646464;
  line-height: 1.6;
  text-align: center;
  padding: 10rpx 0;
  margin: 10rpx 0;
  display: block;
}

.view-trend-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 48rpx;
  margin-bottom: 24rpx;
}

.delete-btn {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.delete-icon {
  width: 52rpx;
  height: 52rpx;
}

.home-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  background: #ffffff;
  color: #000000;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  padding: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  text-align: center;
  margin: 0 12rpx;
}

.relation-test-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  background: #FA325A;
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  padding: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  text-align: center;
  margin-left: 12rpx;
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
  width: 560rpx;
  max-height: 80vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
  padding: 8rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.cuteid-code {
  background: linear-gradient(135deg, #FA325A, #FF6B8A);
  border-radius: 16rpx;
  padding: 24rpx 48rpx;
  text-align: center;
  margin-bottom: 24rpx;
}

.cuteid-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 8rpx;
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
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
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

.hidden-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 750px;
  height: 1400px;
  opacity: 0;
}

.share-modal-content {
  width: 560rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 48rpx 32rpx;
  position: relative;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  text-align: center;
}

.share-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 32rpx;
}

.cuteid-display {
  background: linear-gradient(135deg, #FA325A 0%, #FF6B6B 100%);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.cuteid-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 8rpx;
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.share-card {
  background-color: #f5f5f5;
  border-radius: 24rpx;
  padding: 24rpx;
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

.cuteid-input {
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

.input-cuteid-buttons {
  display: flex;
  gap: 16rpx;
}

.input-cuteid-btn {
  flex: 1;
  font-size: 26rpx;
  padding: 20rpx;
  border-radius: 14rpx;
  text-align: center;
  border: none;
  font-weight: 600;
}

.input-cuteid-btn::after {
  border: none;
}

.input-cuteid-btn-cancel {
  background-color: #f5f5f5;
  color: #333333;
}

.input-cuteid-btn-direct {
  background-color: #000000;
  color: #ffffff;
}

.input-cuteid-btn-private {
  background-color: #FA325A;
  color: #ffffff;
}

</style>

