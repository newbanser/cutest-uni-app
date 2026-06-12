<template>
  <view class="page-container">
    <view class="fullscreen-bg"></view>

    <!-- ===== 第一屏：截屏即传播 ===== -->
    <view class="first-screen">

      <!-- 关系名称 + 稀有度 -->
      <view class="relation-header">
        <view class="rarity-badge" :style="{ backgroundColor: rarityColor }">
          <text class="rarity-text">{{ rarity }}</text>
        </view>
        <text class="relation-name">{{ matchData.levelName || matchData.relationName || '未知关系' }}</text>
      </view>

      <!-- 灵魂金句 -->
      <text class="soul-quote">{{ matchData.soulQuote || '' }}</text>

      <!-- 关系速写（SBTI风格） -->
      <view class="snapshot-section" v-if="snapshotLines.length > 0">
        <text class="snapshot-line" v-for="(line, idx) in snapshotLines" :key="idx">{{ line }}</text>
      </view>

      <!-- 隐藏彩蛋标记 -->
      <view class="easter-egg-tag" v-if="matchData.easterEgg">
        <text class="easter-egg-text">🎁 {{ matchData.easterEgg.name }}</text>
      </view>

      <!-- 偷偷测试标记 -->
      <view class="secret-test-badge" v-if="isPrivate">
        <text class="secret-test-text">🔍 偷偷测试</text>
      </view>

    </view>

    <!-- ===== 第二屏：内容区（下滑可见） ===== -->
    <view class="second-screen">

      <!-- 卡片2：匹配度 + 双方头像 -->
      <view class="card match-card">
        <!-- 彩蛋提醒黑条（卡片内顶部） -->
        <view class="easter-bar-header">
          <text class="easter-bar-text" v-if="matchData.officialPair">恭喜你！本次测试触发官配彩蛋，上滑查看更多</text>
          <text class="easter-bar-text" v-else>本次测试并没有触发隐藏彩蛋，继续测试会有惊喜哦</text>
        </view>
        <view class="match-area">
          <view class="person-block" @tap="goToPersonalityDetail(myType)">
            <image class="person-avatar" :src="myAvatar" mode="aspectFill"></image>
            <view class="person-label-tag">
              <text class="person-label-text">我的人格</text>
            </view>
          </view>

          <view class="match-center">
            <text class="match-score">{{ matchData.matchScore != null ? matchData.matchScore : matchScore }}</text>
            <text class="match-percent-sign">%</text>
            <text class="match-label">匹配度</text>
          </view>

          <view class="person-block" @tap="goToPersonalityDetail(friendType)">
            <image class="person-avatar" :src="friendAvatar" mode="aspectFill"></image>
            <view class="person-label-tag">
              <text class="person-label-text">ta的人格</text>
            </view>
          </view>
        </view>

        <!-- 官配标签 -->
        <view class="official-tag" v-if="matchData.officialPair">
          <text class="official-tag-text">官配 · {{ matchData.officialPair.name }}</text>
        </view>
      </view>

      <!-- 卡片3：官配彩蛋（仅命中时展示） -->
      <view class="card second-card" v-if="matchData.officialPair">
        <view class="official-pair-section">
          <text class="official-congrats">恭喜你，解锁81型融合人格的官配cp</text>
          <text class="official-pair-name">{{ matchData.officialPair.name }}</text>
          <text class="official-pair-intro">{{ matchData.officialPair.intro }}</text>
        </view>
      </view>

      <!-- 操作按钮区（参照xbti-result设计） -->
      <view class="view-trend-section">
        <view class="delete-btn" @tap="confirmDelete">
          <image class="delete-icon" src="/static/images/delete.png" mode="aspectFit"></image>
        </view>
        <view class="home-btn" @tap="goBack">
          返回首页
        </view>
        <view class="share-result-btn" @tap="continueTesting">
          继续测试
        </view>
      </view>

    </view>

    <!-- 确认删除弹窗 -->
    <view v-if="showDeleteModal" class="modal-overlay" @tap="closeDeleteModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">确认删除</text>
        <text class="modal-text">你今天还有{{ remainingDeletes }}次删除机会，确认要删除么？</text>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="closeDeleteModal">取消</view>
          <view class="modal-btn confirm-btn" @tap="deleteRecord">删除</view>
        </view>
      </view>
    </view>

    <!-- 测试模式选择弹窗 -->
    <view class="modal-overlay" v-if="showTestModeModal" @tap="closeTestModeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-close" @tap="closeTestModeModal">×</view>
        <text class="modal-title">选择测试模式</text>
        <view class="share-options">
          <view class="share-card" @tap="goDirectTest">
            <text class="share-name">直接测试</text>
            <text class="share-desc">分享你的人格密语</text>
          </view>
          <view class="share-card" @tap="goInputCuteid">
            <text class="share-name">输入密语</text>
            <text class="share-desc">输入对方的人格密语</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 分享模式选择弹窗 -->
    <view class="modal-overlay" v-if="showShareModal" @tap="closeShareModal">
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
          <view class="share-card" @tap="generateCuteidImage">
            <text class="share-name">生成密语海报</text>
            <text class="share-desc">生成朋友圈海报</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 输入密语弹窗 -->
    <view class="modal-overlay" v-if="showInputCuteidModal" @tap="closeInputCuteidModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-close" @tap="closeInputCuteidModal">×</view>
        <text class="modal-title">请输入对方的密语</text>
        <input
          class="cuteid-input"
          v-model="inputCuteId"
          placeholder="人格密语是一串7位的字母数字组合"
          maxlength="7"
        />
        <view class="input-cuteid-buttons">
          <button class="input-cuteid-btn input-cuteid-btn-cancel" @tap="closeInputCuteidModal">取消</button>
          <button class="input-cuteid-btn input-cuteid-btn-direct" @tap="doMatch">开始匹配</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getPersonalityAvatar, getCampGroup } from '@/utils/imageHelper';
import scoring from '@/utils/scoring';

const userStore = useUserStore();

const myID = ref('');
const friendID = ref('');
const matchScore = ref(50);
const matchData = ref({});
const myType = ref('');
const friendType = ref('');
const isPrivate = ref(false);
const recordId = ref('');
const showDeleteModal = ref(false);
const remainingDeletes = ref(1);

// 继续测试相关弹窗
const showTestModeModal = ref(false);
const showShareModal = ref(false);
const showInputCuteidModal = ref(false);
const inputCuteId = ref('');
const isMatchShare = ref(false);


const DELETE_KEY = 'match_delete_count';
const DATE_KEY = 'match_delete_date';

const CAMP_NAMES = {
  'SP': '黄人组', 'NF': '绿人组', 'SJ': '蓝人组', 'NT': '紫人组',
  '1X': '异象组', '2X': '双面组', '3X': '原型组', '4X': '混沌组'
};


const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const getReadableCamp = (code) => {
  const group = getCampGroup(code);
  return CAMP_NAMES[group] || group;
};

// 新计算属性：从 matchData 直接读取稀有度和颜色
const rarity = computed(() => matchData.value.rarity || 'N');
const rarityColor = computed(() => matchData.value.rarityColor || '#95A5A6');

// 将 snapshot 按换行分割成行
const snapshotLines = computed(() => {
  const snap = matchData.value.snapshot || '';
  return snap.split('\n').filter(Boolean);
});


const myAvatar = computed(() => getPersonalityAvatar(myType.value));
const friendAvatar = computed(() => getPersonalityAvatar(friendType.value));

const myCamp = computed(() => getReadableCamp(myType.value));

const friendCamp = computed(() => getReadableCamp(friendType.value));

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || currentPage.options || {};

  myID.value = decodeURIComponent(options.myID || '');
  friendID.value = decodeURIComponent(options.friendID || '');
  recordId.value = decodeURIComponent(options.recordId || '');

  console.log('[crush-result] === 开始加载 ===');
  console.log('[crush-result] has matchResult:', !!options.matchResult);
  console.log('[crush-result] has myID:', !!options.myID);
  console.log('[crush-result] myID:', myID.value, 'friendID:', friendID.value, 'recordId:', recordId.value);

  let hasGotMatchData = false;

  // 1. 优先从 matchResultCache 读取（history 页面跳转时写入，最可靠）
  const cacheKey = myID.value + '_' + friendID.value;
  const revCacheKey = friendID.value + '_' + myID.value;
  const matchResultCache = uni.getStorageSync('matchResultCache') || {};
  const cached = matchResultCache[cacheKey] || matchResultCache[revCacheKey];
  if (cached && cached.matchData && cached.matchData.relationName) {
    console.log('[crush-result] 步骤1: matchResultCache 命中');
    matchData.value = cached.matchData;
    isPrivate.value = cached.isPrivate || false;
    hasGotMatchData = true;
    if (cached.myPersonality || cached.friendPersonality) {
      myType.value = cached.myPersonality || '';
      friendType.value = cached.friendPersonality || '';
  console.log('[crush-result] 步骤1: 缓存设置人格, myType:', myType.value, 'friendType:', friendType.value);
    } else {
  console.log('[crush-result] 步骤1: 缓存无人格数据');
    }
  } else {
    console.log('[crush-result] 步骤1: 未命中');
  }

  // 2. 回退：从 URL 参数读取
  if (!hasGotMatchData && options.matchResult) {
    try {
      const parsed = JSON.parse(decodeURIComponent(options.matchResult));
      if (parsed && parsed.relationName) {
    console.log('[crush-result] 步骤2: URL matchResult 命中, relationName:', parsed.relationName);
        matchData.value = parsed;
        hasGotMatchData = true;
      }
    } catch (e) {
      console.error('[crush-result] 步骤2: 解析失败:', e);
    }
  } else {
    console.log('[crush-result] 步骤2:', hasGotMatchData ? '已跳过' : '无URL参数');
  }

  // 3. 回退：从 matchResult 缓存读取
  if (!hasGotMatchData) {
    const savedMatchResult = uni.getStorageSync('matchResult');
    console.log('[crush-result] 步骤3: matchResult存储', savedMatchResult ? '存在' : '不存在');
    if (savedMatchResult && savedMatchResult.matchData) {
  console.log('[crush-result] 步骤3: userA:', JSON.stringify(savedMatchResult.userA), 'userB:', JSON.stringify(savedMatchResult.userB));
      matchData.value = savedMatchResult.matchData;
      isPrivate.value = savedMatchResult.isPrivate || false;
      hasGotMatchData = true;
      if (savedMatchResult.userA && savedMatchResult.userB) {
        if (savedMatchResult.userA.cuteId === myID.value) {
          myType.value = savedMatchResult.userA.personalityCode || '';
          friendType.value = savedMatchResult.userB.personalityCode || '';
  console.log('[crush-result] 步骤3: userA=我, myType=', myType.value, 'friendType=', friendType.value);
        } else {
          myType.value = savedMatchResult.userB.personalityCode || '';
          friendType.value = savedMatchResult.userA.personalityCode || '';
  console.log('[crush-result] 步骤3: userB=我, myType=', myType.value, 'friendType=', friendType.value);
        }
      }
    }
  }

  // 4. 回退：从 matchRecords 匹配记录列表查找
  if (!hasGotMatchData) {
    const matchRecords = uni.getStorageSync('matchRecords') || [];
    console.log('[crush-result] 步骤4: matchRecords共', matchRecords.length, '条');
    const found = matchRecords.find(r => {
      const aId = r.userA?.cuteId;
      const bId = r.userB?.cuteId;
      return (aId === myID.value && bId === friendID.value) ||
             (aId === friendID.value && bId === myID.value);
    });
    if (found) {
  console.log('[crush-result] 步骤4: 找到, userA:', JSON.stringify(found.userA), 'userB:', JSON.stringify(found.userB));
    } else {
  console.log('[crush-result] 步骤4: 未找到');
    }
    if (found && found.matchData && found.matchData.relationName) {
      matchData.value = found.matchData;
      isPrivate.value = found.isPrivate || false;
      hasGotMatchData = true;
      if (found.userA?.personalityCode && found.userB?.personalityCode) {
        if (found.userA.cuteId === myID.value) {
          myType.value = found.userA.personalityCode;
          friendType.value = found.userB.personalityCode;
  console.log('[crush-result] 步骤4: userA=我, myType=', myType.value, 'friendType=', friendType.value);
        } else {
          myType.value = found.userB.personalityCode;
          friendType.value = found.userA.personalityCode;
  console.log('[crush-result] 步骤4: userB=我, myType=', myType.value, 'friendType=', friendType.value);
        }
      }
    }
  }

  if (!hasGotMatchData) {
    console.log('[crush-result] ❌ 无匹配数据, 返回');
    uni.showToast({ title: '匹配数据丢失', icon: 'none' });
    setTimeout(() => { uni.navigateBack(); }, 1500);
    return;
  }

  console.log('[crush-result] 当前myType:', myType.value, 'friendType:', friendType.value);

  // 降级
  if (!myType.value || !friendType.value) {
    const fallback = uni.getStorageSync('matchResult');
    console.log('[crush-result] 降级: matchResult存储', fallback ? '(有)' : '(无)');
    if (fallback) {
  console.log('[crush-result] 降级: userA:', JSON.stringify(fallback.userA), 'userB:', JSON.stringify(fallback.userB));
      const myCuteId = myID.value;
      if (fallback.userA?.cuteId === myCuteId) {
        if (!myType.value) myType.value = fallback.userA.personalityCode || fallback.userA.personality || '';
        if (!friendType.value) friendType.value = fallback.userB?.personalityCode || fallback.userB?.personality || '';
    console.log('[crush-result] 降级: userA=我, myType=', myType.value, 'friendType=', friendType.value);
      } else {
        if (!myType.value) myType.value = fallback.userB?.personalityCode || fallback.userB?.personality || '';
        if (!friendType.value) friendType.value = fallback.userA?.personalityCode || fallback.userA?.personality || '';
    console.log('[crush-result] 降级: userB=我, myType=', myType.value, 'friendType=', friendType.value);
      }
      isPrivate.value = fallback.isPrivate || false;
    }
  }

  console.log('[crush-result] 最终myType:', myType.value, 'friendType:', friendType.value);

  // 兼容旧记录：如果没有新字段，走迁移逻辑
  if (matchData.value && !matchData.value.levelName && matchData.value.level) {
    const genderCol = scoring._getGenderColumn(
      userStore.userData.gender,
      matchData.value.isCoupleContext ? (userStore.userData.gender === 'male' ? 'female' : 'male') : ''
    );
    const migrated = scoring.migrateLegacyMatchData(matchData.value, genderCol);
    if (migrated) {
      Object.assign(matchData.value, migrated);
    }
  }

  matchScore.value = matchData.value.matchScore != null ? matchData.value.matchScore : 50;

});


const goBack = () => {
  uni.switchTab({ url: '/pages/index/index' });
};

// 点击头像跳转人格详情页，同时将对方人格加入发现列表以解锁图鉴
const goToPersonalityDetail = (code) => {
  if (!code) return;
  // 将对方人格加入发现列表，点亮图鉴库
  try {
    const discovered = uni.getStorageSync('discoveredPersonalities') || {};
    const key = code.toLowerCase();
    discovered[key] = (discovered[key] || 0) + 1;
    uni.setStorageSync('discoveredPersonalities', discovered);
  } catch (e) {
    // 静默失败
  }
  uni.navigateTo({
    url: `/pages/archive/archive?code=${code}`
  });
};

// ===== 继续测试流程 =====
const continueTesting = () => {
  showTestModeModal.value = true;
};

const closeTestModeModal = () => {
  showTestModeModal.value = false;
};

const goDirectTest = () => {
  showTestModeModal.value = false;
  isMatchShare.value = true;
  showShareModal.value = true;
};

const goInputCuteid = () => {
  showTestModeModal.value = false;
  inputCuteId.value = '';
  showInputCuteidModal.value = true;
};

const closeInputCuteidModal = () => {
  showInputCuteidModal.value = false;
};

const closeShareModal = () => {
  showShareModal.value = false;
  isMatchShare.value = false;
};

const copyCuteId = () => {
  const cuteId = userStore.userData.cuteId || '';
  uni.setClipboardData({
    data: cuteId,
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'none' });
    }
  });
};

const generateCuteidImage = () => {
  closeShareModal();
  // 简版生成海报，复用首页的逻辑
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
  const cuteId = userStore.userData.cuteId || '';
  ctx.strokeText(cuteId, 750 / 2, 300);
  ctx.fillText(cuteId, 750 / 2, 300);
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
            uni.showToast({ title: '保存成功', icon: 'success' });
          },
          fail: () => {
            uni.showToast({ title: '保存失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        uni.showToast({ title: '生成图片失败', icon: 'none' });
      }
    });
  });
};

const doMatch = () => {
  if (!inputCuteId.value || inputCuteId.value.length !== 7) {
    uni.showToast({ title: '请输入完整的7位密语', icon: 'none' });
    return;
  }
  closeInputCuteidModal();
  // 调用首页跳转到关系测试流程
  uni.setStorageSync('matchTarget', inputCuteId.value.toUpperCase());
  uni.switchTab({ url: '/pages/index/index' });
};

onShareAppMessage(() => {
  const cuteId = userStore.userData.cuteId || '';
  if (isMatchShare.value) {
    isMatchShare.value = false;
    showShareModal.value = false;
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

    // 调用云函数软删除
    if (recordId.value) {
      try {
        await uni.cloud.callFunction({
          name: 'deleteMatchRecord',
          data: { recordId: recordId.value }
        });
      } catch (e) {
        console.error('[crush-result] 云端删除失败:', e);
      }
    }

    // 从本地 matchRecords 移除
    try {
      const records = uni.getStorageSync('matchRecords') || [];
      const updated = records.filter(r => {
        const aId = r.userA?.cuteId;
        const bId = r.userB?.cuteId;
        return !((aId === myID.value && bId === friendID.value) ||
                 (aId === friendID.value && bId === myID.value));
      });
      uni.setStorageSync('matchRecords', updated);
    } catch (e) {
      console.error('[crush-result] 本地记录删除失败:', e);
    }

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
    console.error('[crush-result] deleteRecord error:', error);
    uni.showToast({ title: '删除失败: ' + error.message, icon: 'none' });
  }
  showDeleteModal.value = false;
};
</script>

<style lang="scss">
button::after {
  border: none;
}

.page-container {
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 20rpx;
  background-color: #f4f4f4;
}

.fullscreen-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f4f4f4;
  z-index: -1;
}

/* ===== 第一屏 ===== */
.first-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 20rpx 30rpx;
  background: #ffffff;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.relation-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16rpx;
}

.rarity-badge {
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
  margin-bottom: 12rpx;
}

.rarity-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
}

.relation-name {
  font-size: 48rpx;
  font-weight: 700;
  color: #000000;
  text-align: center;
}

.soul-quote {
  font-size: 26rpx;
  color: #FA325A;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24rpx;
  line-height: 1.5;
}

.snapshot-section {
  width: 100%;
  padding: 20rpx 24rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 28rpx;
}

.snapshot-line {
  display: block;
  font-size: 24rpx;
  color: #333333;
  line-height: 1.8;
  text-align: center;
}

/* 匹配区域 */
.match-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 40rpx 28rpx;
  box-sizing: border-box;
}

.person-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.person-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-bottom: 8rpx;
}

.person-label-tag {
  background-color: #000000;
  padding: 6rpx 18rpx;
  border-radius: 24rpx;
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.person-label-text {
  font-size: 20rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

.match-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24rpx;
}

.match-score {
  font-size: 52rpx;
  font-weight: 700;
  color: #FA325A;
  line-height: 1;
}

.match-percent-sign {
  font-size: 24rpx;
  font-weight: 700;
  color: #FA325A;
  margin-top: -4rpx;
}

.match-label {
  font-size: 20rpx;
  color: #646464;
  margin-top: 4rpx;
}

/* 官配标签 */
.official-tag {
  background: #000000;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  margin-bottom: 12rpx;
}

.official-tag-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

/* 隐藏彩蛋标记 */
.easter-egg-tag {
  background: #FA325A;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  margin-bottom: 12rpx;
}

.easter-egg-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

/* 偷偷测试标记 */
.secret-test-badge {
  padding: 8rpx 24rpx;
  background-color: #FA325A;
  border-radius: 24rpx;
}

.secret-test-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

/* ===== 第二屏 ===== */
.second-screen {
  margin-top: 0;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

/* 官配介绍区域 */
.official-pair-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.official-congrats {
  font-size: 22rpx;
  color: #FA325A;
  font-weight: 600;
  margin-bottom: 12rpx;
  text-align: center;
}

.official-pair-name {
  font-size: 44rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 20rpx;
  text-align: center;
}

.official-pair-intro {
  font-size: 24rpx;
  color: #333333;
  line-height: 1.8;
  text-align: center;
}

/* 匹配度卡片 — 无内边距，黑条撑满 */
.match-card {
  padding: 0;
  overflow: hidden;
}

/* 彩蛋提醒黑条（卡片内顶部，撑满宽度） */
.easter-bar-header {
  width: 100%;
  box-sizing: border-box;
  background-color: #000000;
  padding: 12rpx 28rpx;
  text-align: center;
}

.easter-bar-text {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 600;
  line-height: 1.4;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 20rpx;
  display: block;
}

/* 操作按钮区（参照xbti-result设计） */
.view-trend-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 32rpx;
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

.share-result-btn {
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

/* 模态弹窗 */
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
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  position: relative;
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

.modal-close {
  position: absolute;
  top: 16rpx;
  right: 20rpx;
  font-size: 40rpx;
  color: #999999;
  line-height: 1;
  padding: 8rpx;
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
</style>
