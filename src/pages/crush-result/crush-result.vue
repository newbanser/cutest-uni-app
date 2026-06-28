<template>
  <view class="page-container">
    <view class="brand-area">
      <image v-if="cardImage" class="hero-bg" :src="cardImage" mode="widthFix"></image>
      <view v-else class="hero-placeholder"></view>
    </view>
    <view class="nav-bar"></view>
    <view class="content-area">
      <view class="card text-card">
        <!-- 你们的关系是 -->
        <text class="card-heading">你们的关系是</text>
        <!-- 关系名称（64rpx 800字重） -->
        <text class="card-title">{{ matchData.levelName || matchData.relationName || '' }}</text>
        <!-- 英文名 -->
        <text class="card-title-en" v-if="matchData.levelNameEn">{{ matchData.levelNameEn }}</text>
        <!-- 金句 -->
        <text class="line-quote" v-if="matchData.soulQuote">{{ cleanPunct(matchData.soulQuote) }}</text>
        <!-- 合成一段: 你们属于X型关系+速写+投入度 -->
        <text class="line-summary" v-if="matchData.snapshot || matchData.investmentSentence">{{ summaryText }}</text>
        <!-- 编号+等级 -->
        <text class="line-idrank" v-if="relationId">编号：{{ relationId }}    等级：{{ relationLevel }}</text>
        <!-- 稀有度单独一行 -->
        <text class="line-rarity" v-if="matchData.rarity">你们的关系仅占全球测试的 {{ rarityPct }}</text>
        <text class="secret-tag" v-if="isPrivate">偷偷测试</text>
      </view>

      <view class="card evaluation-card" v-if="matchData.rcet">
        <view class="dimension-list">
          <view class="dimension-item" v-for="item in rcetItems" :key="item.key">
            <view class="dimension-top">
              <view class="dimension-name">{{ item.label }}</view>
              <view class="dimension-label">{{ item.hint }}</view>
            </view>
            <view class="mini-bar">
              <view class="mini-fill" :style="{ width: item.value + '%', backgroundColor: item.color }">
                <text class="mini-text">{{ item.value }}%</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="card match-card">
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
            <text class="match-vs">VS</text>
          </view>
          <view class="person-block" @tap="goToPersonalityDetail(friendType)">
            <image class="person-avatar" :src="friendAvatar" mode="aspectFill"></image>
            <view class="person-label-tag">
              <text class="person-label-text">ta的人格</text>
            </view>
          </view>
        </view>
      </view>
      <view class="card" v-if="matchData.officialPair">
        <view class="official-pair-section">
          <text class="official-pair-name">{{ matchData.officialPair.name }}</text>
          <text class="line-summary">{{ matchData.officialPair.intro }}</text>
        </view>
      </view>
      <text class="tip-text">本分析仅供娱乐参考，不能代替专业心理评估。</text>
      <view class="view-trend-section">
        <view class="delete-btn" @tap="confirmDelete">
          <image class="delete-icon" src="/static/images/delete.png" mode="aspectFit"></image>
        </view>
        <view class="home-btn" @tap="goBack">返回首页</view>
        <view class="share-result-btn" @tap="continueTesting">继续测试</view>
      </view>
    </view>

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
    <view class="modal-overlay" v-if="showTestModeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-close" @tap="closeTestModeModal">x</view>
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
    <view class="modal-overlay" v-if="showShareModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-close" @tap="closeShareModal">x</view>
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
    <view class="modal-overlay" v-if="showInputCuteidModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-close" @tap="closeInputCuteidModal">x</view>
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
import { ref, computed, watch, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getPersonalityAvatar, getCampGroup } from '@/utils/imageHelper';
import { getCrushImageUrl } from '@/utils/cloudImages';
import scoring from '@/utils/scoring';

const userStore = useUserStore();

const myID = ref('');
const friendID = ref('');
const matchScore = ref(50);
const matchData = ref({});

const saveToRelationCollection = (spec) => {
  if (!spec) return;
  try {
    const collected = uni.getStorageSync('matchedRelations') || {};
    if (!collected[spec]) {
      collected[spec] = 1;
      uni.setStorageSync('matchedRelations', collected);
    }
  } catch (e) {}
};
watch(() => matchData.value?.spec || matchData.value?._dbKey, (spec) => {
  if (spec) saveToRelationCollection(spec);
}, { immediate: true });
const myType = ref('');
const friendType = ref('');
const isPrivate = ref(false);
const recordId = ref('');
const showDeleteModal = ref(false);
const remainingDeletes = ref(1);

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
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
};

const loadDeleteCount = () => {
  try {
    const d = uni.getStorageSync(DATE_KEY);
    const today = getTodayDateStr();
    if (d === today) {
      remainingDeletes.value = Number(uni.getStorageSync(DELETE_KEY)) || 1;
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

const cleanPunct = (s) => { return (s || '').replace(/[。！]+$/, ''); };

const summaryText = computed(() => {
  const parts = [];
  var propLabel = matchData.value.propertyName || '';
  if (propLabel) {
    parts.push('你们属于' + propLabel + '型关系');
  }
  if (matchData.value.snapshot) parts.push(cleanPunct(matchData.value.snapshot));
  if (matchData.value.investmentSentence) parts.push(cleanPunct(matchData.value.investmentSentence));
  return parts.join('。');
});

const rarityPct = computed(() => {
  const pct = matchData.value.rarityPct;
  if (pct != null) return pct + '%';
  const m = (matchData.value.rarity || '').match(/[\d.]+/);
  return m ? m[0] + '%' : '?%';
});

// 编号映射：spec 到云存储三位编号
const specIdMap = {
  drain_relation:'001', last_card:'005', power_clash:'008', greatest_love:'011',
  soul_accomplice:'014', money_partners:'017', better_with_time:'020',
  another_me:'023', destined_partner:'026', right_beside_you:'029',
  certified_fool:'032', former_path:'035',
};

// 稀有度等级映射
const rankMap = {
  drain_relation:'EXR', last_card:'SSR', power_clash:'SSR', greatest_love:'SSR',
  soul_accomplice:'SSR', money_partners:'SSR', better_with_time:'SR',
  another_me:'R', destined_partner:'R', right_beside_you:'R',
  certified_fool:'R', former_path:'N',
};

const relationId = computed(() => {
  var spec = matchData.value.spec || matchData.value._dbKey;
  return specIdMap[spec] || '';
});

const relationLevel = computed(() => {
  var spec = matchData.value.spec || matchData.value._dbKey;
  var r = rankMap[spec] || '';
  var stars = '';
  if (r === 'EXR') stars = '★★★★★';
  else if (r === 'SSR') stars = '★★★★';
  else if (r === 'SR') stars = '★★★';
  else if (r === 'R') stars = '★★';
  else stars = '★';
  return r + ' ' + stars;
});

const cardImage = computed(() => {
  const imageKey = matchData.value.imageKey;
  const spec = matchData.value.spec || matchData.value._dbKey;
  const typeId = matchData.value.typeId;
  const cloudUrl = getCrushImageUrl(imageKey, spec, typeId);
  if (cloudUrl) return cloudUrl;
  let num = '';
  if (imageKey) num = imageKey.replace('crush_', '').padStart(3, '0');
  if (!num) {
    const map = {
      drain_relation:'001', last_card:'005', power_clash:'008', greatest_love:'011',
      soul_accomplice:'014', money_partners:'017', better_with_time:'020',
      another_me:'023', destined_partner:'026', right_beside_you:'029',
      certified_fool:'032', former_path:'035',
    };
    num = map[spec];
    if (!num && typeId) num = String(typeId).padStart(3, '0');
  }
  return num ? '/static/images/crush-' + num + '.png' : '';
});

const rcetItems = computed(() => {
  const rc = matchData.value.rcet;
  if (!rc) return [];
  const R = rc.R || 50, C = rc.C || 50, E = rc.E || 50, T = rc.T || 50;
  const defs = {
    R: { label:'共振频率', hi:'高度同步', lo:'差异较大', cHi:'#E6A800', cLo:'#95A5A6' },
    C: { label:'冲突抗性', hi:'容易摩擦', lo:'相处和谐', cHi:'#D93838', cLo:'#4CAF50' },
    E: { label:'情绪浓度', hi:'情绪浓烈', lo:'冷静理性', cHi:'#E8406A', cLo:'#6B8EC4' },
    T: { label:'行动节奏', hi:'步调一致', lo:'节奏不同', cHi:'#2EA89E', cLo:'#95A5A6' },
  };
  return ['R','C','E','T'].map(k => {
    const v = [R,C,E,T][['R','C','E','T'].indexOf(k)];
    const hi = v >= 50;
    const d = defs[k];
    return { key: k, label: d.label, value: v, color: hi ? d.cHi : d.cLo, hint: hi ? d.hi : d.lo };
  });
});

const myAvatar = computed(() => getPersonalityAvatar(myType.value));
const friendAvatar = computed(() => getPersonalityAvatar(friendType.value));

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || currentPage.options || {};

  myID.value = decodeURIComponent(options.myID || '');
  friendID.value = decodeURIComponent(options.friendID || '');
  recordId.value = decodeURIComponent(options.recordId || '');

  let has = false;

  const cacheKey = myID.value + '_' + friendID.value;
  const revCacheKey = friendID.value + '_' + myID.value;
  const matchResultCache = uni.getStorageSync('matchResultCache') || {};
  const cached = matchResultCache[cacheKey] || matchResultCache[revCacheKey];
  if (cached && cached.matchData && cached.matchData.relationName) {
    matchData.value = cached.matchData;
    isPrivate.value = cached.isPrivate || false;
    has = true;
    if (cached.myPersonality || cached.friendPersonality) {
      myType.value = cached.myPersonality || '';
      friendType.value = cached.friendPersonality || '';
    }
  }

  if (!has && options.matchResult) {
    try {
      const parsed = JSON.parse(decodeURIComponent(options.matchResult));
      if (parsed && parsed.relationName) {
        matchData.value = parsed;
        has = true;
      }
    } catch (e) {}
  }

  if (!has) {
    const matchResultByFriend = uni.getStorageSync('matchResultByFriend') || {};
    const saved = matchResultByFriend[friendID.value];
    if (saved && saved.matchData) {
      matchData.value = saved.matchData;
      isPrivate.value = saved.isPrivate || false;
      has = true;
      if (saved.userA && saved.userB) {
        if (saved.userA.cuteId === myID.value) {
          myType.value = saved.userA.personalityCode || '';
          friendType.value = saved.userB.personalityCode || '';
        } else {
          myType.value = saved.userB.personalityCode || '';
          friendType.value = saved.userA.personalityCode || '';
        }
      }
    }
  }

  if (!has) {
    const matchRecords = uni.getStorageSync('matchRecords') || [];
    const found = matchRecords.find(r => {
      const aId = r.userA?.cuteId;
      const bId = r.userB?.cuteId;
      return (aId === myID.value && bId === friendID.value) || (aId === friendID.value && bId === myID.value);
    });
    if (found && found.matchData && found.matchData.relationName) {
      matchData.value = found.matchData;
      isPrivate.value = found.isPrivate || false;
      has = true;
      if (found.userA?.personalityCode && found.userB?.personalityCode) {
        if (found.userA.cuteId === myID.value) {
          myType.value = found.userA.personalityCode;
          friendType.value = found.userB.personalityCode;
        } else {
          myType.value = found.userB.personalityCode;
          friendType.value = found.userA.personalityCode;
        }
      }
    }
  }

  if (!has) {
    uni.showToast({ title: '匹配数据丢失', icon: 'none' });
    setTimeout(() => { uni.navigateBack(); }, 1500);
    return;
  }

  if (!myType.value || !friendType.value) {
    const matchResultByFriend = uni.getStorageSync('matchResultByFriend') || {};
    const fallback = matchResultByFriend[friendID.value];
    if (fallback) {
      const myCuteId = myID.value;
      if (fallback.userA?.cuteId === myCuteId) {
        if (!myType.value) myType.value = fallback.userA.personalityCode || fallback.userA.personality || '';
        if (!friendType.value) friendType.value = fallback.userB?.personalityCode || fallback.userB?.personality || '';
      } else {
        if (!myType.value) myType.value = fallback.userB?.personalityCode || fallback.userB?.personality || '';
        if (!friendType.value) friendType.value = fallback.userA?.personalityCode || fallback.userA?.personality || '';
      }
      isPrivate.value = fallback.isPrivate || false;
    }
  }

  if (matchData.value && !matchData.value.levelName && matchData.value.relationName) {
    matchData.value.levelName = matchData.value.relationName;
  }
  matchScore.value = matchData.value.matchScore != null ? matchData.value.matchScore : 50;

  // 异步刷新：拉取双方最新人格数据，缓存过时则自动重算
  refreshWithLatestData();
});

const refreshWithLatestData = async () => {
  if (!myID.value || !friendID.value) return;
  try {
    userStore.loadUserData();
    const records = userStore.userData.analysis_records;
    const storedMyData = records && records.length > 0
      ? records.reduce((a, b) => (a.timestamp > b.timestamp ? a : b))
      : null;
    if (storedMyData) {
      myType.value = storedMyData.personality || myType.value;
    }

    // 从云端拉取好友最新人格
    let friendCloudData = null;
    try {
      const res = await uni.cloud.callFunction({
        name: 'getPersonality',
        data: { cuteid: friendID.value }
      });
      if (res.result?.success && res.result.data) {
        friendCloudData = res.result.data;
        friendType.value = friendCloudData.personality || friendCloudData.personalityCode || friendType.value;
      }
    } catch (e) {
      console.log('[crush-result] 获取好友最新数据失败:', e);
    }

    // 获取本人最新数据（可能刚更新过）
    const myLatest = storedMyData;
    const myPersonality = myLatest ? (myLatest.personality || '') : myType.value;
    const myPercentages = myLatest ? (myLatest.percentages || {}) : {};
    const friendPersonality = friendCloudData ? (friendCloudData.personality || friendCloudData.personalityCode || '') : friendType.value;
    const friendPercentages = friendCloudData ? (friendCloudData.percentages || {}) : {};

    // 对比缓存中的数据和最新数据是否一致
    const myGender = storedMyData?.gender || userStore.userData.gender || '';
    const friendGender = friendCloudData?.gender || (myGender === 'male' ? 'female' : 'male');

    // 只要有最新数据就重算
    if ((myPersonality || Object.keys(myPercentages).length > 0) && (friendPersonality || Object.keys(friendPercentages).length > 0)) {
      const myData = {
        percentages: myPercentages,
        gender: myGender,
        personality: myPersonality
      };
      const friendData = {
        percentages: friendPercentages,
        gender: friendGender,
        personality: friendPersonality
      };
      const newResult = scoring.calculateRelationshipMatch(myData, friendData);
      if (newResult && newResult.relationName) {
        matchData.value = newResult;
        matchScore.value = newResult.matchScore != null ? newResult.matchScore : 50;
        myType.value = myPersonality;
        friendType.value = friendPersonality;

        // 更新缓存
        const cacheKey = myID.value + '_' + friendID.value;
        const matchResultCache = uni.getStorageSync('matchResultCache') || {};
        matchResultCache[cacheKey] = {
          matchData: newResult,
          isPrivate: isPrivate.value || false,
          myPersonality,
          friendPersonality
        };
        uni.setStorageSync('matchResultCache', matchResultCache);
      }
    }
  } catch (e) {
    console.error('[crush-result] refreshWithLatestData 异常:', e);
  }
};

const goBack = () => uni.switchTab({ url: '/pages/index/index' });

const goToPersonalityDetail = (code) => {
  if (!code) return;
  try {
    const discovered = uni.getStorageSync('discoveredPersonalities') || {};
    const key = code.toLowerCase();
    discovered[key] = (discovered[key] || 0) + 1;
    uni.setStorageSync('discoveredPersonalities', discovered);
  } catch (e) {}
  uni.navigateTo({ url: `/pages/archive/archive?code=${code}` });
};

const continueTesting = () => { showTestModeModal.value = true; };
const closeTestModeModal = () => { showTestModeModal.value = false; };
const goDirectTest = () => { showTestModeModal.value = false; isMatchShare.value = true; showShareModal.value = true; };
const goInputCuteid = () => { showTestModeModal.value = false; inputCuteId.value = ''; showInputCuteidModal.value = true; };
const closeInputCuteidModal = () => { showInputCuteidModal.value = false; };
const closeShareModal = () => { showShareModal.value = false; isMatchShare.value = false; };

const copyCuteId = () => {
  const cuteId = userStore.userData.cuteId || '';
  uni.setClipboardData({
    data: cuteId,
    success: () => uni.showToast({ title: '复制成功', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'none' })
  });
};

const generateCuteidImage = () => {
  closeShareModal();
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
          success: () => uni.showToast({ title: '保存成功', icon: 'success' }),
          fail: () => uni.showToast({ title: '保存失败', icon: 'none' })
        });
      },
      fail: () => uni.showToast({ title: '生成图片失败', icon: 'none' })
    });
  });
};

const doMatch = () => {
  if (!inputCuteId.value || inputCuteId.value.length !== 7) {
    uni.showToast({ title: '请输入完整的7位密语', icon: 'none' });
    return;
  }
  closeInputCuteidModal();
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

const closeDeleteModal = () => { showDeleteModal.value = false; };

const deleteRecord = async () => {
  try {
    if (remainingDeletes.value <= 0) {
      uni.showToast({ title: '今天的删除机会已用完', icon: 'none' });
      showDeleteModal.value = false;
      return;
    }
    if (recordId.value) {
      try {
        await uni.cloud.callFunction({ name: 'deleteMatchRecord', data: { recordId: recordId.value } });
      } catch (e) {}
    }
    try {
      const records = uni.getStorageSync('matchRecords') || [];
      const updated = records.filter(r => {
        const aId = r.userA?.cuteId;
        const bId = r.userB?.cuteId;
        return !((aId === myID.value && bId === friendID.value) || (aId === friendID.value && bId === myID.value));
      });
      uni.setStorageSync('matchRecords', updated);
    } catch (e) {}
    remainingDeletes.value -= 1;
    uni.setStorageSync(DATE_KEY, getTodayDateStr());
    uni.setStorageSync(DELETE_KEY, remainingDeletes.value);
    uni.showToast({ title: '删除成功', icon: 'success', duration: 1500 });
    setTimeout(() => {
      uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) });
    }, 1500);
  } catch (error) {
    uni.showToast({ title: '删除失败: ' + error.message, icon: 'none' });
  }
  showDeleteModal.value = false;
};
</script>

<style lang="scss">
button::after { border: none; }

.page-container {
  min-height: 100vh;
  padding: 0;
  padding-bottom: 20rpx;
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow-x: hidden;
  background-color: #f4f4f4;
}

.nav-bar {
  width: 100%;
  height: var(--status-bar-height);
  position: relative;
  z-index: 2;
}

.brand-area {
  width: 100%;
  position: relative;
  z-index: 0;
}

.hero-bg {
  width: 100%;
  height: auto;
  display: block;
}

.hero-placeholder {
  width: 100%;
  height: 750rpx;
  background: linear-gradient(180deg, #f4f4f4 0%, #e8e8e8 100%);
}

.content-area {
  position: relative;
  z-index: 1;
  padding: 0 30rpx;
  margin-top: -220rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
  word-break: break-word;
}

.text-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 40rpx;
}

.card-heading {
  font-size: 28rpx;
  color: #000;
  text-align: center;
  margin-bottom: 28rpx;
}

.card-title {
  font-size: 64rpx;
  font-weight: 800;
  color: #000;
  text-align: center;
  margin-bottom: 28rpx;
  line-height: 1.2;
  word-break: break-word;
}

.card-title-en {
  font-size: 32rpx;
  font-weight: 600;
  color: #000;
  text-align: center;
  margin-bottom: 24rpx;
}

.card-title + .card-title-en {
  margin-top: -12rpx;
}

.line-quote {
  font-size: 32rpx;
  color: #000000;
  font-weight: 600;
  text-align: center;
  margin-bottom: 28rpx;
  line-height: 1.6;
}

.line-summary {
  font-size: 28rpx;
  color: #000;
  text-align: center;
  line-height: 1.8;
  padding: 0 48rpx;
  word-break: break-word;
}

.line-idrank {
  font-size: 32rpx;
  color: #000;
  text-align: center;
  margin-top: 28rpx;
}

.line-rarity {
  font-size: 28rpx;
  color: #000;
  text-align: center;
  margin-top: 28rpx;
}

.secret-tag {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #999;
  text-align: center;
}

.evaluation-card { margin-bottom: 24rpx; }
.dimension-item { margin-bottom: 20rpx; }
.dimension-item:last-child { margin-bottom: 0; }
.dimension-top { display: flex; justify-content: space-between; align-items: center; }
.dimension-name, .dimension-label { font-size: 26rpx; font-weight: 600; color: #333; }
.mini-bar {
  width: 100%; height: 40rpx; background: #000;
  border: 4rpx solid #000; border-radius: 16rpx; overflow: hidden;
  box-sizing: border-box; margin-top: 8rpx;
}
.mini-fill {
  height: 100%; border-radius: 12rpx; display: flex;
  align-items: center; justify-content: center; transition: width .6s ease;
}
.mini-text { font-size: 26rpx; color: #fff; font-weight: 700; text-shadow: 0 1rpx 2rpx rgba(0,0,0,.3); }
.tip-text {
  font-size: 26rpx;
  color: #646464;
  line-height: 1.6;
  text-align: center;
  padding: 10rpx 0;
  margin: 10rpx 0 24rpx;
  display: block;
}
.match-card { padding: 0; overflow: hidden; }
.match-card .match-area { padding: 40rpx 28rpx 48rpx; }
.match-area {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 40rpx 28rpx; box-sizing: border-box;
}
.person-block { display: flex; flex-direction: column; align-items: center; flex: 1; }
.person-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; margin-bottom: 8rpx; }
.person-label-tag {
  background-color: #000; padding: 6rpx 18rpx; border-radius: 24rpx;
  margin-top: 12rpx; display: flex; align-items: center; justify-content: center;
}
.person-label-text { font-size: 26rpx; font-weight: 600; color: #fff; line-height: 1; }
.match-center { display: flex; flex-direction: column; align-items: center; padding: 0 24rpx; }
.match-vs { font-size: 36rpx; font-weight: 700; color: #ccc; }
.easter-bar-header {
  width: 100%; box-sizing: border-box; background-color: #000;
  padding: 12rpx 28rpx; text-align: center;
}
.easter-bar-text { font-size: 26rpx; color: #fff; font-weight: 600; line-height: 1.4; word-break: break-all; }
.view-trend-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 32rpx;
  margin-bottom: 24rpx;
}
.delete-btn {
  width: 88rpx; height: 88rpx; border-radius: 50%; background: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,.08); flex-shrink: 0;
}
.delete-icon { width: 52rpx; height: 52rpx; }
.home-btn {
  flex: 1; height: 88rpx; line-height: 88rpx; background: #fff; color: #000;
  border-radius: 44rpx; font-size: 32rpx; font-weight: 700; padding: 0;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,.08); text-align: center; margin: 0 12rpx;
}
.share-result-btn {
  flex: 1; height: 88rpx; line-height: 88rpx; background: #fa325a; color: #fff;
  border-radius: 44rpx; font-size: 32rpx; font-weight: 700; padding: 0;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,.08); text-align: center;
}
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,.5); display: flex; align-items: center;
  justify-content: center; z-index: 1000;
}
.modal-content { width: 560rpx; background: #fff; border-radius: 16rpx; padding: 48rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,.08); position: relative; }
.modal-title { font-size: 36rpx; font-weight: 700; color: #000; display: block; text-align: center; margin-bottom: 24rpx; }
.modal-text { font-size: 28rpx; color: #333; display: block; text-align: center; margin-bottom: 32rpx; }
.modal-actions { display: flex; gap: 24rpx; }
.modal-btn { flex: 1; height: 88rpx; line-height: 88rpx; border-radius: 44rpx; font-size: 32rpx; font-weight: 700; text-align: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,.08); }
.cancel-btn { background: #f5f5f5; color: #000; }
.confirm-btn { background: #fa325a; color: #fff; }
.modal-close { position: absolute; top: 16rpx; right: 20rpx; font-size: 40rpx; color: #999; line-height: 1; padding: 16rpx; z-index: 10; }
.official-pair-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 40rpx;
}
.official-pair-name {
  font-size: 64rpx;
  font-weight: 800;
  color: #000;
  text-align: center;
  margin-bottom: 28rpx;
  line-height: 1.2;
  word-break: break-word;
}
.share-options { display: flex; flex-direction: column; gap: 24rpx; }
.share-card { background-color: #f5f5f5; border-radius: 24rpx; padding: 32rpx; text-align: center; border: 2px solid #e0e0e0; }
button.share-card { border: 2px solid #e0e0e0; line-height: normal; font-size: 26rpx; padding: 32rpx; margin: 0; background-color: #f5f5f5; }
button.share-card:after { border: none; }
.share-card:active, button.share-card:active { background-color: #fa325a; border-color: #fa325a; }
.share-card:active .share-name, .share-card:active .share-desc, button.share-card:active .share-name, button.share-card:active .share-desc { color: #fff; }
.share-name { font-size: 32rpx; font-weight: 700; color: #000; display: block; margin-bottom: 12rpx; }
.share-desc { font-size: 26rpx; color: #666; display: block; }
.cuteid-input { width: 100%; height: 88rpx; background-color: #f5f5f5; border-radius: 14rpx; padding: 0 24rpx; font-size: 28rpx; color: #000; margin-bottom: 32rpx; box-sizing: border-box; }
.input-cuteid-buttons { display: flex; gap: 16rpx; }
.input-cuteid-btn { flex: 1; font-size: 26rpx; padding: 20rpx; border-radius: 14rpx; text-align: center; border: none; font-weight: 600; }
.input-cuteid-btn:after { border: none; }
.input-cuteid-btn-cancel { background-color: #f5f5f5; color: #333; }
.input-cuteid-btn-direct { background-color: #000; color: #fff; }
</style>
