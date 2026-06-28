<template>
  <view class="page-container">
    <!-- 顶部Tab切换 -->
    <view class="tabs-container">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'personality' }"
        @tap="switchTab('personality')"
      >
        <text class="tab-text">人格图鉴库</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'match' }"
        @tap="switchTab('match')"
      >
        <text class="tab-text">关系图鉴库</text>
      </view>
    </view>

    <!-- 人格图鉴库内容 -->
    <view v-if="activeTab === 'personality'">
      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">基本人格</text>
            <text class="category-count">{{ categoryStats.basic.unlocked }} / {{ categoryStats.basic.total }}</text>
          </view>
          <view class="personality-grid">
            <view
              v-for="code in basicPersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="handleTap(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="getDiscoveredCount(code) > 0" class="personality-badge-discovered">{{ getDiscoveredCount(code) }}</text>
                <text v-if="getCount(code) > 0" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">特别隐藏</text>
            <text class="category-count">{{ categoryStats.special.unlocked }} / {{ categoryStats.special.total }}</text>
          </view>
          <view class="personality-grid">
            <view
              v-for="code in specialPersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="handleTap(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="getDiscoveredCount(code) > 0" class="personality-badge-discovered">{{ getDiscoveredCount(code) }}</text>
                <text v-if="getCount(code) > 0" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">稀世隐藏</text>
            <text class="category-count">{{ categoryStats.rare.unlocked }} / {{ categoryStats.rare.total }}</text>
          </view>
          <view class="personality-grid">
            <view
              v-for="code in rarePersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="handleTap(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="getDiscoveredCount(code) > 0" class="personality-badge-discovered">{{ getDiscoveredCount(code) }}</text>
                <text v-if="getCount(code) > 0" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">至臻隐藏</text>
            <text class="category-count">{{ categoryStats.epic.unlocked }} / {{ categoryStats.epic.total }}</text>
          </view>
          <view class="personality-grid">
            <view
              v-for="code in epicPersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="handleTap(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="getDiscoveredCount(code) > 0" class="personality-badge-discovered">{{ getDiscoveredCount(code) }}</text>
                <text v-if="getCount(code) > 0" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">限定隐藏</text>
            <text class="category-count">{{ categoryStats.legendary.unlocked }} / {{ categoryStats.legendary.total }}</text>
          </view>
          <view class="personality-grid limited-grid">
            <view
              v-for="code in legendaryPersonalities"
              :key="code"
              class="personality-item"
              :class="{ unlocked: hasRecord(code), locked: !hasRecord(code) }"
              @tap="handleTap(code)"
            >
              <view class="avatar-wrapper">
                <image class="personality-avatar" :src="getPersonalityAvatar(code)" mode="aspectFill"></image>
                <text v-if="getDiscoveredCount(code) > 0" class="personality-badge-discovered">{{ getDiscoveredCount(code) }}</text>
                <text v-if="getCount(code) > 0" class="personality-badge">{{ getCount(code) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="tip-text">
        已解锁 {{ unlockedCount }} 种人格，继续测试解锁更多
      </view>
    </view>

    <!-- 关系图鉴库内容 — 按属性分组 -->
    <view v-else>
      <view class="category-section" v-for="group in PROPERTY_GROUPS" :key="group.property">
        <view class="card category-card">
          <view class="category-header">
            <text class="category-title">{{ group.label }}</text>
            <text class="category-count">{{ getGroupUnlocked(group) }} / {{ getGroupTotal(group) }}</text>
          </view>
          <view class="relation-atlas">
            <view
              v-for="specKey in group.specs"
              :key="specKey"
              class="relation-atlas-card"
              :class="{ unlocked: collectedRelations[specKey], locked: !collectedRelations[specKey] }"
              @tap="handleRelationTap(specKey)"
            >
              <view class="relation-atlas-thumbs">
                <view
                  v-for="thumb in getThumbItems(specKey)"
                  :key="thumb.id"
                  class="thumb-item"
                >
                  <image class="thumb-img" :src="getGenderThumb(specKey, thumb.imageNum)" mode="aspectFill"></image>
                  <text class="thumb-name">{{ getGenderName(specKey, thumb.nameKey) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="tip-text" style="margin-bottom: 60rpx;">
        完成关系测试可解锁对应关系图鉴
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getPersonalityAvatar } from '@/utils/imageHelper';
import { getCrushImageUrl } from '@/utils/cloudImages';

const userStore = useUserStore();

const activeTab = ref('personality');

const analysisRecords = ref([]);
const totalAnalysis = ref(0);
const recordCounts = ref({});
const discoveredCounts = ref({});

// 收集的关系图鉴（存入 matchedRelations storage）
const collectedRelations = ref({});
const relationUnlocked = computed(() => Object.keys(collectedRelations.value).length);

// ===== v3.1: 关系图鉴库 — 按属性分组 =====
const PROPERTY_GROUPS = [
  { property: 'growth',     label: '成长型关系', specs: ['another_me', 'destined_partner'] },
  { property: 'resonator',  label: '共鸣型关系', specs: ['soul_accomplice', 'last_card'] },
  { property: 'passion',    label: '热爱型关系', specs: ['greatest_love', 'certified_fool'] },
  { property: 'companion',  label: '伙伴型关系', specs: ['money_partners', 'better_with_time', 'right_beside_you'] },
  { property: 'rivalry',    label: '竞争型关系', specs: ['power_clash', 'former_path'] },
  { property: 'drain',      label: '遗憾型关系', specs: ['drain_relation'] },
];

// spec + gender 对应的图片编号
const GENDER_IMAGE_MAP = {
  drain_relation: { 男女: '001', 男男: '003', 女女: '004' },
  last_card:      { 男女: '005', 男男: '006', 女女: '007' },
  power_clash:    { 男女: '008', 男男: '009', 女女: '010' },
  greatest_love:  { 男女: '011', 男男: '012', 女女: '013' },
  soul_accomplice:{ 男女: '014', 男男: '015', 女女: '016' },
  money_partners: { 男女: '017', 男男: '018', 女女: '019' },
  better_with_time:{男女: '020', 男男: '021', 女女: '022' },
  another_me:     { 男女: '023', 男男: '024', 女女: '025' },
  destined_partner:{男女: '026', 男男: '027', 女女: '028' },
  right_beside_you:{男女: '029', 男男: '030', 女女: '031' },
  certified_fool: { 男女: '032', 男男: '033', 女女: '034' },
  former_path:    { 男女: '035', 男男: '036', 女女: '037' },
};

// spec → 男女/男男/女女 → 显示名称（与 scoring.js GENDER_VARIANTS 一致）
const GENDER_DISPLAY_NAMES = {
  drain_relation: {     '男女': '求而不得',     '男男': '镜花水月',     '女女': '雾里看花' },
  last_card: {     '男女': '最后相守',     '男男': '最后底牌',     '女女': '最后联盟' },
  power_clash: {     '男女': '国王皇后',     '男男': '双王组合',     '女女': '双后组合' },
  greatest_love: {     '男女': '人间挚爱',     '男男': '最强死党',     '女女': '最强闺蜜' },
  soul_accomplice: {     '男女': '灵魂共犯',     '男男': '灵魂兄弟',     '女女': '灵魂姐妹' },
  money_partners: {     '男女': '搞钱拍档',     '男男': '搞钱兄弟',     '女女': '搞钱姐妹' },
  better_with_time: {     '男女': '陈年老友',     '男男': '陈年兄弟',     '女女': '陈年姐妹' },
  another_me: {     '男女': '镜像性转',     '男男': '镜像兄弟',     '女女': '镜像姐妹' },
  destined_partner: {     '男女': '天作之合',     '男男': '搭子兄弟',     '女女': '搭子姐妹' },
  right_beside_you: {     '男女': '老夫老妻',     '男男': '至亲兄弟',     '女女': '至亲姐妹' },
  certified_fool: {     '男女': '欢喜冤家',     '男男': '损友兄弟',     '女女': '损友姐妹' },
  former_path: {     '男女': '昨日同路',     '男男': '渐行渐远',     '女女': '曾经同行' },
};

const getSpecLabel = (specKey) => {
  var names = GENDER_DISPLAY_NAMES[specKey];
  return names ? names['男女'] : specKey;
};

function getThumbItems(specKey) {
  if (specKey === 'drain_relation') {
    return [
      { id: specKey + '-男多', imageNum: '001', nameKey: '男女' },
      { id: specKey + '-女多', imageNum: '002', nameKey: '男女' },
      { id: specKey + '-男男', imageNum: '003', nameKey: '男男' },
      { id: specKey + '-女女', imageNum: '004', nameKey: '女女' },
    ];
  }
  const map = GENDER_IMAGE_MAP[specKey] || {};
  return [
    { id: specKey + '-男女', imageNum: map['男女'] || '', nameKey: '男女' },
    { id: specKey + '-男男', imageNum: map['男男'] || '', nameKey: '男男' },
    { id: specKey + '-女女', imageNum: map['女女'] || '', nameKey: '女女' },
  ];
}

const getGenderThumb = (specKey, imageNum) => {
  if (!imageNum) return '';
  var cloudUrl = getCrushImageUrl(null, specKey, parseInt(imageNum));
  if (cloudUrl) return cloudUrl;
  return '';
};

const getGenderName = (specKey, nameKey) => {
  var names = GENDER_DISPLAY_NAMES[specKey];
  return names ? (names[nameKey] || '') : '';
};

// v3.1: 每个关系类型的卡片数（性别变体数）
// drain_relation 的"男女"有男多/女多两张，共4张；其余类型各3张
const SPEC_CARD_COUNT = {
  drain_relation: 4,
  last_card: 3,
  power_clash: 3,
  greatest_love: 3,
  soul_accomplice: 3,
  money_partners: 3,
  better_with_time: 3,
  another_me: 3,
  destined_partner: 3,
  right_beside_you: 3,
  certified_fool: 3,
  former_path: 3,
};

const getGroupTotal = (group) => {
  return group.specs.reduce((sum, s) => sum + (SPEC_CARD_COUNT[s] || 3), 0);
};

const getGroupUnlocked = (group) => {
  return group.specs.reduce((sum, s) => {
    if (collectedRelations.value[s]) {
      return sum + (SPEC_CARD_COUNT[s] || 3);
    }
    return sum;
  }, 0);
};

const handleRelationTap = (specKey) => {
  if (collectedRelations.value[specKey]) {
    uni.showToast({ title: '关系图鉴详情开发中', icon: 'none' });
  } else {
    uni.showToast({ title: '该关系未解锁', icon: 'none' });
  }
};

const loadUserData = () => {
  userStore.loadUserData();
  const records = userStore.userData.analysis_records || [];
  analysisRecords.value = records;
  totalAnalysis.value = records.length;

  const counts = {};
  records.forEach(record => {
    const personality = (record.personality || 'unknown').toLowerCase();
    counts[personality] = (counts[personality] || 0) + 1;
  });
  recordCounts.value = counts;
  // 加载关系测试中发现的人格（与自测分开统计）
  try {
    discoveredCounts.value = uni.getStorageSync('discoveredPersonalities') || {};
  } catch (e) {
    discoveredCounts.value = {};
  }
  // v3.1: 加载已收集的关系图鉴
  try {
    const relations = uni.getStorageSync('matchedRelations') || {};
    collectedRelations.value = relations;
  } catch (e) {
    collectedRelations.value = {};
  }
};

const hasRecord = (code) => {
  const lowerCode = code.toLowerCase();
  return recordCounts.value[lowerCode] > 0 || (discoveredCounts.value[lowerCode] || 0) > 0;
};

const getCount = (code) => {
  const lowerCode = code.toLowerCase();
  return recordCounts.value[lowerCode] || 0;
};

const getDiscoveredCount = (code) => {
  const lowerCode = code.toLowerCase();
  return discoveredCounts.value[lowerCode] || 0;
};

const basicPersonalities = ['istp', 'isfp', 'estp', 'esfp', 'infj', 'infp', 'enfj', 'enfp', 'istj', 'isfj', 'estj', 'esfj', 'intj', 'intp', 'entj', 'entp'];
const specialPersonalities = ['xstj', 'xstp', 'xsfj', 'xsfp', 'xntj', 'xntp', 'xnfj', 'xnfp', 'ixtj', 'ixtp', 'ixfj', 'ixfp', 'extj', 'extp', 'exfj', 'exfp', 'isxj', 'isxp', 'inxj', 'inxp', 'esxj', 'esxp', 'enxj', 'enxp', 'istx', 'isfx', 'intx', 'infx', 'estx', 'esfx', 'entx', 'enfx'];
const rarePersonalities = ['xxtj', 'xxtp', 'xxfj', 'xxfp', 'xsxj', 'xsxp', 'xnxj', 'xnxp', 'xstx', 'xsfx', 'xntx', 'xnfx', 'ixxj', 'ixxp', 'exxj', 'exxp', 'ixtx', 'ixfx', 'extx', 'exfx', 'isxx', 'inxx', 'esxx', 'enxx'];
const epicPersonalities = ['ixxx', 'exxx', 'xsxx', 'xnxx', 'xxtx', 'xxfx', 'xxxj', 'xxxp'];
const legendaryPersonalities = ['xxxx'];

const totalPersonalities = 81;

const categoryStats = computed(() => ({
  basic: {
    unlocked: basicPersonalities.filter(code => hasRecord(code)).length,
    total: basicPersonalities.length
  },
  special: {
    unlocked: specialPersonalities.filter(code => hasRecord(code)).length,
    total: specialPersonalities.length
  },
  rare: {
    unlocked: rarePersonalities.filter(code => hasRecord(code)).length,
    total: rarePersonalities.length
  },
  epic: {
    unlocked: epicPersonalities.filter(code => hasRecord(code)).length,
    total: epicPersonalities.length
  },
  legendary: {
    unlocked: legendaryPersonalities.filter(code => hasRecord(code)).length,
    total: legendaryPersonalities.length
  }
}));

const unlockedCount = computed(() => {
  return Object.keys(recordCounts.value).filter(code => code !== 'unknown' && recordCounts.value[code] > 0).length;
});

const switchTab = (tab) => {
  activeTab.value = tab;
};

const handleTap = (code) => {
  if (hasRecord(code)) {
    goToDetail(code);
  } else {
    uni.showToast({ title: '人格未解锁，暂无法查看详情', icon: 'none', duration: 1500 });
  }
};

const goToDetail = (code) => {
  console.log('goToDetail called with code:', code);
  uni.navigateTo({
    url: `/pages/archive/archive?code=${code}`
  });
};

onMounted(() => {
  loadUserData();
});

onShow(() => {
  loadUserData();
});
</script>

<style lang="scss">
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  background-color: #f4f4f4;
}

.page-container {
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 20rpx;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Tab切换样式 */
.tabs-container {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.tab-item {
  flex: 1;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #000000;
  transition: all 0.3s ease;
  border: 2px solid #000000;
  text-align: center;
}

.tab-item.active {
  background: #000000;
  color: #ffffff;
}

.tab-text {
  font-size: 24rpx;
  font-weight: 700;
  color: inherit;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.category-section {
  margin-bottom: 24rpx;
}

.category-card {
  padding: 32rpx;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid #e0e0e0;
}

.category-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
}

.category-count {
  font-size: 24rpx;
  font-weight: 500;
  color: #666666;
}

.personality-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28rpx;
  row-gap: 36rpx;
  padding: 16rpx;
}

.limited-grid {
  display: flex;
  justify-content: center;
}

.personality-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  width: 110rpx;
  height: 110rpx;
}

.personality-item.locked {
  opacity: 0.35;
}

.personality-item.unlocked {
  opacity: 1;
}

.personality-badge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  background-color: #ff3b30;
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 700;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}

.personality-badge-discovered {
  position: absolute;
  top: -4rpx;
  left: -4rpx;
  background-color: #000000;
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 700;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
  z-index: 10;
  border: 1px solid #e0e0e0;
}

.personality-avatar {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
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

/* 关系图鉴库 — 每个关系卡片，一行3张性别小图 */
.relation-atlas {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.relation-atlas-card {
  background: transparent;
  border-radius: 0;
  padding: 0;
}

.relation-atlas-card.locked {
  opacity: 0.4;
}

.relation-atlas-header {
  font-size: 28rpx;
  font-weight: 700;
  color: #000;
  margin-bottom: 16rpx;
  text-align: center;
}

.relation-atlas-thumbs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.thumb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thumb-img {
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 4;
  border-radius: 12rpx;
  background: #eee;
  display: block;
}

.thumb-name {
  font-size: 26rpx;
  font-weight: 700;
  color: #000;
  text-align: center;
  margin-top: 8rpx;
}

/* 关系图鉴空白卡片 */
.empty-match-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-match-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-match-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12rpx;
}

.empty-match-tip {
  font-size: 24rpx;
  color: #646464;
}

/* 关系图鉴项样式 */
.relation-item-name {
  font-size: 22rpx;
  color: #333333;
  text-align: center;
  margin-top: 8rpx;
  line-height: 1.3;
}
</style>
