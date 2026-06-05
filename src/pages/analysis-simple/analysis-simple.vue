<template>
  <view class="container">
    <view class="progress-section">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
      </view>
      <text class="progress-text">{{ currentIndex + 1 }} / {{ totalScenarios }}</text>
    </view>
    
    <view class="privacy-modal" v-if="showPrivacyModal">
      <view class="privacy-modal-content" @tap.stop>
        <text class="privacy-title">测试方式</text>
        <text class="privacy-desc">让 {{ inviterCuteid }} 知道你测了，还是悄悄看看结果？</text>
        <view class="privacy-options">
          <view class="privacy-option primary" @tap.stop="choosePrivacy(true)">
            <text class="privacy-option-icon">🔒</text>
            <text class="privacy-option-text">偷偷测试</text>
          </view>
          <view class="privacy-option" @tap.stop="choosePrivacy(false)">
            <text class="privacy-option-icon">💌</text>
            <text class="privacy-option-text">让TA知道</text>
          </view>
        </view>
      </view>
    </view>

    <view class="confirm-modal" v-if="showConfirmModal" @tap="closeConfirmModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">确认交卷</text>
        <text class="modal-desc">你已完成所有题目，确定要提交答案吗？</text>
        <view class="modal-buttons">
          <view class="modal-btn cancel-btn" @tap="closeConfirmModal">我再想想</view>
          <view class="modal-btn submit-btn" @tap="openGenderModal">现在交卷</view>
        </view>
      </view>
    </view>

    <view class="confirm-modal" v-if="showGenderModal" @tap="closeGenderModal">
      <view class="modal-container" @tap.stop>
        <view class="modal-close" @tap="closeGenderModal">×</view>
        <text class="modal-title">你的性别是？</text>
        <view class="gender-options">
          <view 
            :class="['gender-option', selectedGender === 'male' ? 'selected' : '']"
            @tap.stop="selectGender('male')">
            <text class="gender-emoji">♂️</text>
            <text class="gender-text">男生</text>
          </view>
          <view 
            :class="['gender-option', selectedGender === 'female' ? 'selected' : '']"
            @tap.stop="selectGender('female')">
            <text class="gender-emoji">♀️</text>
            <text class="gender-text">女生</text>
          </view>
          <view 
            :class="['gender-option', selectedGender === 'x' ? 'selected' : '']"
            @tap.stop="selectGender('x')">
            <text class="gender-emoji">🤫</text>
            <text class="gender-text">不告诉你</text>
          </view>
        </view>
        <button class="save-gender-btn" @tap.stop="handleGenderSubmit">确定</button>
      </view>
    </view>

    <!-- 性别保密确认弹窗 -->
    <view class="confirm-modal" v-if="showPrivacyConfirmModal" @tap="closePrivacyConfirmModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-close" @tap="closePrivacyConfirmModal">×</view>
        <text class="modal-title">确定保密？</text>
        <text class="modal-desc">选择保密后，仍可在"我的"中随时修改</text>
        <view class="privacy-buttons">
          <view class="privacy-btn privacy-btn-cancel" @tap="closePrivacyConfirmModal">重新选择</view>
          <view class="privacy-btn privacy-btn-confirm" @tap="confirmPrivacy">确定保密</view>
        </view>
      </view>
    </view>

    <view class="scenario-card">
      <view class="scenario-number">第 {{ currentIndex + 1 }} 题</view>
      <text class="scenario-text">{{ currentScenario?.text }}</text>
    </view>

    <view class="options-area">
        <view
          v-for="(item, index) in options"
          :key="index"
          class="option-card"
          :class="{ selected: selectedOptionIndex === index }"
          @tap="selectOption(index)"
          @click="selectOption(index)"
        >
          <view class="option-indicator">{{ item.value }}</view>
          <text class="option-text">{{ item.text }}</text>
        </view>
      </view>

    <view class="qrcode-section">
      <text class="qrcode-text">请依靠本能做出选择</text>
      <text class="qrcode-text">胡乱作答会影响趋势</text>
      <text class="qrcode-text">如果对上文内容有疑义</text>
      <text class="qrcode-text">微信联系 HGH_SHE</text>
    </view>

    <view class="button-section">
      <view class="prev-btn" v-if="currentIndex > 0" @tap="prevQuestion" @click="prevQuestion">
        上一题
      </view>
    </view>

    <text class="tip-text" v-if="currentIndex === totalScenarios - 1 && selectedOptionIndex !== null">本分析仅供娱乐参考，不能代替专业心理评估</text>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import scoring from '@/utils/scoring';
import personalitiesData from '@/data/personalities';

const userStore = useUserStore();
const { personalities } = personalitiesData.personalitiesData;

const scenarios = ref([]);
const scenarioIds = ref([]);
const currentIndex = ref(0);
const currentScenario = ref(null);
const selectedOptionIndex = ref(null);
const answers = ref([]);
const totalScenarios = ref(24);
const progress = ref(0);
const options = ref([]);
const showPrivacyModal = ref(false);
const inviterCuteid = ref('');
const selectedPrivacyMode = ref(false);

const showConfirmModal = ref(false);
const showGenderModal = ref(false);
const showPrivacyConfirmModal = ref(false);
const selectedGender = ref('');

const formatOptions = (scenarioOptions) => {
  const indexedOptions = scenarioOptions.map((text, index) => ({
    originalIndex: index,
    text: text
  }));
  for (let i = indexedOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
  }
  return indexedOptions.map((option, index) => ({
    ...option,
    value: index + 1,
    label: String(index + 1)
  }));
};

const selectOption = (index) => {
  selectedOptionIndex.value = index;
  answers.value[currentIndex.value] = {
    scenarioId: currentScenario.value.id,
    optionIndex: options.value[index].originalIndex,
    timestamp: Date.now()
  };

  const isLastScenario = currentIndex.value === totalScenarios.value - 1;
  if (!isLastScenario) {
    setTimeout(() => {
      nextScenario();
    }, 200);
  } else {
    setTimeout(() => {
      showConfirmModal.value = true;
    }, 300);
  }
};

const closeConfirmModal = () => {
  showConfirmModal.value = false;
};

const openGenderModal = () => {
  showConfirmModal.value = false;
  // 检查用户是否已经有性别信息
  userStore.loadUserData();
  console.log('openGenderModal - userData.gender:', userStore.userData.gender);
  console.log('openGenderModal - userData:', userStore.userData);
  const storedUserData = uni.getStorageSync('userData');
  console.log('openGenderModal - storedUserData:', storedUserData);
  
  if (userStore.userData.gender) {
    // 已有性别，直接完成分析
    console.log('Has gender, skipping selection');
    selectedGender.value = userStore.userData.gender;
    // 延迟执行，确保弹窗完全关闭
    setTimeout(() => {
      const inviter = uni.getStorageSync('inviterCuteid');
      if (inviter) {
        inviterCuteid.value = inviter;
        showPrivacyModal.value = true;
      } else {
        doFinishAnalysis(false);
      }
    }, 150);
  } else {
    // 没有性别，弹出选择对话框
    console.log('No gender, showing selection modal');
    selectedGender.value = ''; // 确保没有默认选中项
    showGenderModal.value = true;
  }
};

const closeGenderModal = () => {
  showGenderModal.value = false;
};

const selectGender = (gender) => {
  selectedGender.value = gender;
};

const handleGenderSubmit = () => {
  if (!selectedGender.value) {
    uni.showToast({ title: '请先选择性别', icon: 'none' });
    return;
  }
  
  if (selectedGender.value === 'x') {
    showGenderModal.value = false;
    showPrivacyConfirmModal.value = true;
    return;
  }
  
  showGenderModal.value = false;
  userStore.updateProfile({
    gender: selectedGender.value
  });
  // 延迟执行，确保弹窗完全关闭
  setTimeout(() => {
    const inviter = uni.getStorageSync('inviterCuteid');
    if (inviter) {
      inviterCuteid.value = inviter;
      showPrivacyModal.value = true;
    } else {
      doFinishAnalysis(false);
    }
  }, 150);
};

const confirmPrivacy = () => {
  userStore.updateProfile({
    gender: 'x'
  });
  showPrivacyConfirmModal.value = false;
  // 延迟执行，确保弹窗完全关闭
  setTimeout(() => {
    const inviter = uni.getStorageSync('inviterCuteid');
    if (inviter) {
      inviterCuteid.value = inviter;
      showPrivacyModal.value = true;
    } else {
      doFinishAnalysis(false);
    }
  }, 150);
};

const closePrivacyConfirmModal = () => {
  showPrivacyConfirmModal.value = false;
  setTimeout(() => {
    showGenderModal.value = true;
  }, 100);
};

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    const prevRecord = answers.value[currentIndex.value];
    const prevScenarioData = scenarios.value[currentIndex.value];
    const prevScenarioOptions = prevScenarioData?.options || [];
    options.value = formatOptions(prevScenarioOptions);
    currentScenario.value = prevScenarioData;
    progress.value = Math.round(((currentIndex.value + 1) / totalScenarios.value) * 100);
    
    if (prevRecord) {
      const foundIndex = options.value.findIndex(opt => opt.originalIndex === prevRecord.optionIndex);
      selectedOptionIndex.value = foundIndex !== -1 ? foundIndex : null;
    } else {
      selectedOptionIndex.value = null;
    }
  }
};

const nextScenario = () => {
  if (selectedOptionIndex.value === null) {
    uni.showToast({ title: '请选择一个描述', icon: 'none' });
    return;
  }

  const nextIndex = currentIndex.value + 1;

  if (nextIndex >= totalScenarios.value) {
    return;
  }

  const nextScenarioData = scenarios.value[nextIndex];
  const nextScenarioOptions = nextScenarioData?.options || [];
  const formattedNextOptions = formatOptions(nextScenarioOptions);

  currentIndex.value = nextIndex;
  currentScenario.value = nextScenarioData;
  selectedOptionIndex.value = null;
  progress.value = Math.round(((nextIndex + 1) / totalScenarios.value) * 100);
  options.value = formattedNextOptions;
};

const finishAnalysis = () => {
  if (!selectedGender.value) {
    uni.showToast({ title: '请先选择性别', icon: 'none' });
    return;
  }
  showGenderModal.value = false;
  userStore.updateProfile({
    gender: selectedGender.value
  });
  const inviter = uni.getStorageSync('inviterCuteid');
  if (inviter) {
    inviterCuteid.value = inviter;
    showPrivacyModal.value = true;
  } else {
    doFinishAnalysis(false);
  }
};

const choosePrivacy = (isPrivate) => {
  console.log('choosePrivacy called, isPrivate:', isPrivate);
  try {
    selectedPrivacyMode.value = isPrivate;
    showPrivacyModal.value = false;
    console.log('Modal closed, waiting to call doFinishAnalysis...');
    // 延迟执行，确保弹窗完全关闭
    setTimeout(() => {
      doFinishAnalysis(isPrivate);
    }, 150);
  } catch (error) {
    console.error('choosePrivacy error:', error);
    uni.showToast({ title: '操作失败: ' + error.message, icon: 'none', duration: 3000 });
  }
};

const closePrivacyModal = () => {
  showPrivacyModal.value = false;
};

const doFinishAnalysis = async (isPrivate) => {
  try {
    console.log('[DEBUG] doFinishAnalysis 开始执行');
    
    const answerIndices = answers.value.map(a => a.optionIndex);
    
    const rawScores = scoring.getSimpleDimensionScores(scenarios.value, answerIndices);
    const newPersonality = scoring.determineSimplePersonality(rawScores);
    
    const introvertDims = ['Ni', 'Si', 'Ti', 'Fi'];
    const extrovertDims = ['Ne', 'Se', 'Te', 'Fe'];
    const intuitionDims = ['Ni', 'Ne'];
    const sensingDims = ['Si', 'Se'];
    const thinkingDims = ['Ti', 'Te'];
    const feelingDims = ['Fi', 'Fe'];
    const judgingDims = ['Ni', 'Te', 'Fe', 'Si'];
    const perceivingDims = ['Ti', 'Ne', 'Fi', 'Se'];
    
    const iPercent = scoring.getGroupPercentage(rawScores, introvertDims);
    const ePercent = scoring.getGroupPercentage(rawScores, extrovertDims);
    const nPercent = scoring.getGroupPercentage(rawScores, intuitionDims);
    const sPercent = scoring.getGroupPercentage(rawScores, sensingDims);
    const tPercent = scoring.getGroupPercentage(rawScores, thinkingDims);
    const fPercent = scoring.getGroupPercentage(rawScores, feelingDims);
    const jPercent = scoring.getGroupPercentage(rawScores, judgingDims);
    const pPercent = scoring.getGroupPercentage(rawScores, perceivingDims);
    
    const newPercentages = {
      E: ePercent,
      I: iPercent,
      N: nPercent,
      S: sPercent,
      T: tPercent,
      F: fPercent,
      J: jPercent,
      P: pPercent
    };

    const gender = userStore.userData.gender;
    
    const latestRecord = {
      id: 'view_' + Date.now(),
      timestamp: Date.now(),
      answers: answerIndices,
      raw_scores: rawScores,
      personality: newPersonality,
      percentages: newPercentages,
      interpretations: [],
      isPrivate: isPrivate,
      inviterCuteid: inviterCuteid.value,
      gender: gender,
      test_mode: 'simple'
    };

    console.log('[DEBUG] 准备保存数据...');
    userStore.addAnalysisRecord(latestRecord);

    uni.setStorageSync('currentViewId', latestRecord.id);
    uni.setStorageSync('currentView', latestRecord);
    console.log('[DEBUG] 数据已保存到本地存储');
    
    const matchTarget = uni.getStorageSync('matchTarget');
    console.log('[DEBUG] matchTarget:', JSON.stringify(matchTarget), 'type:', typeof matchTarget, 'length:', matchTarget?.length);
    console.log('[DEBUG] matchTarget value:', matchTarget, 'truthy:', !!matchTarget);
    
    if (matchTarget) {
      // 如果有匹配目标，直接进行匹配流程
      console.log('[DEBUG] 检测到有匹配目标，直接处理匹配...');
      
      // 先确认是否要查看匹配度
      uni.showModal({
        title: '匹配邀请',
        content: `收到好友的人格密语邀请！是否查看你们的匹配度？`,
        confirmText: '立即查看',
        cancelText: '偷偷测试',
        success: (res) => {
          if (res.confirm) {
            processMatch(matchTarget, false, gender, latestRecord);
          } else {
            processMatch(matchTarget, true, gender, latestRecord);
          }
        }
      });
    } else {
      // 没有匹配目标，跳转到结果页
      uni.redirectTo({
        url: '/pages/xbti-result/xbti-result',
        success: () => {
          console.log('[DEBUG] redirectTo 跳转成功');
        },
        fail: (err) => {
          console.error('[DEBUG] redirectTo 跳转失败:', err);
          uni.showToast({ 
            title: '跳转失败，请重试', 
            icon: 'none',
            duration: 2000
          });
        }
      });
    }
    
  } catch (error) {
    console.error('[DEBUG] doFinishAnalysis 异常:', error);
    uni.showToast({ 
      title: '测试失败，请重试', 
      icon: 'none',
      duration: 3000 
    });
  }
};

// 处理匹配的函数
const processMatch = (friendCuteId, isPrivate, myGender, latestRecord) => {
  console.log(`[processMatch] 开始执行, friendCuteId: ${friendCuteId}, isPrivate: ${isPrivate}`);
  console.log(`[processMatch] myGender: ${myGender}, latestRecord:`, latestRecord);
  uni.showLoading({ title: '计算匹配度...' });
  
  // 设置超时，防止一直加载
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
  
  // 调用云函数获取好友的真实人格数据
  if (uni.cloud) {
    uni.cloud.callFunction({
      name: 'getPersonality',
      data: { cuteId: friendCuteId },
      success: (res) => {
        clearTimeout(timeoutId);
        console.log(`[processMatch] getPersonality 成功, res:`, res);
        console.log(`[processMatch] res.result:`, res.result);
        if (res.result && res.result.success && res.result.data) {
          // 好友有测试数据，计算匹配度
          processMatchResult(res.result.data, friendCuteId, isPrivate, myGender, latestRecord);
        } else {
          // 好友没有测试数据
          uni.hideLoading();
          const failReason = res.result?.message || '云函数未返回原因';
          console.log(`[processMatch] ❌ getPersonality 失败: ${failReason}, queryCuteid: ${res.result?.queryCuteid}, totalRecords: ${res.result?.totalRecords}`);
          uni.showModal({
            title: '无法获取好友数据',
            content: `好友(${friendCuteId})还没有完成人格测试。\n\n[调试] ${failReason}\n云端共 ${res.result?.totalRecords ?? '?'} 条记录`,
            showCancel: false,
            confirmText: '我知道了'
          });
        }
      },
      fail: (err) => {
        clearTimeout(timeoutId);
        console.log('[processMatch] ❌ 云函数调用失败:', err);
        uni.hideLoading();
        uni.showModal({
          title: '获取好友数据失败',
          content: `无法获取好友的人格数据，请检查网络后重试。\n\n[调试] ${err.errMsg || err.message || '未知错误'}`,
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
};

// 处理匹配结果
const processMatchResult = (friendPersonalityData, friendCuteId, isPrivate, myGender, latestRecord) => {
  const myCuteId = userStore.userData.cuteId || '';
  const myPersonality = latestRecord.personality || '';
  
  const myData = {
    percentages: latestRecord.percentages || { E: 50, I: 50, S: 50, N: 50, T: 50, F: 50, J: 50, P: 50 },
    gender: myGender
  };
  
  let friendData = null;
  let friendPersonality = '';
  
  // 好友必须有真实的人格测试数据
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
  
  // 使用关系匹配算法
  const matchResult = scoring.calculateRelationshipMatch(myData, friendData);
  
  console.log('匹配结果:', matchResult);
  
  // 保存完整的匹配结果
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
};

onMounted(() => {
  const { scenarios: generatedScenarios, scenarioIds: generatedScenarioIds } = scoring.generateSimpleScenarios();
  const firstScenarioOptions = generatedScenarios[0]?.options || [];
  const formattedOptions = formatOptions(firstScenarioOptions);

  scenarios.value = generatedScenarios;
  scenarioIds.value = generatedScenarioIds;
  currentScenario.value = generatedScenarios[0];
  progress.value = Math.round((1 / generatedScenarios.length) * 100);
  options.value = formattedOptions;
  totalScenarios.value = generatedScenarios.length;
});
</script>

<style lang="scss">
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  width: 100%;
  background-color: #f5f5f5;
}

.container {
  padding: 30rpx;
  padding-bottom: 20rpx;
  max-width: 480px;
  margin: 0 auto;
}

.progress-section {
  margin-bottom: 32rpx;
}

.progress-bar {
  height: 4rpx;
  background: #e8ecf0;
  border-radius: 2rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.progress-fill {
  height: 100%;
  background: #000000;
  border-radius: 2rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 24rpx;
  color: #999999;
  text-align: left;
}

.scenario-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.scenario-number {
  font-size: 24rpx;
  color: #999999;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.scenario-text {
  font-size: 32rpx;
  color: #000000;
  line-height: 1.6;
  font-weight: 500;
}

.options-area {
  margin-bottom: 32rpx;
}

.option-card {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  transition: all 0.2s ease;
  background: #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.option-card:last-child {
  margin-bottom: 0;
}

.option-card.selected {
  background: #000000;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
}

.option-indicator {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
  color: #000000;
  margin-right: 20rpx;
  flex-shrink: 0;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.08);
}

.option-item.selected .option-indicator {
  background: #fff;
  border: 2px solid #fff;
  color: #000000;
}

.option-text {
  font-size: 28rpx;
  color: #000000;
}

.option-card.selected .option-text {
  color: #fff;
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

.button-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24rpx;
  margin-top: 32rpx;
  margin-bottom: 24rpx;
}

.prev-btn {
  width: 400rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #fff;
  color: #000000;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  padding: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  text-align: center;
}

.submit-btn {
  width: 400rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #fff;
  color: #000000;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  padding: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  text-align: center;
}

.confirm-modal {
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
  border-radius: 16rpx;
  padding: 48rpx 40rpx;
  text-align: center;
}

.modal-container {
  width: 500rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 28rpx;
  text-align: center;
  position: relative;
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
  color: #000;
  display: block;
  margin-bottom: 32rpx;
}

.modal-desc {
  font-size: 28rpx;
  color: #999;
  display: block;
  margin-bottom: 40rpx;
}

.modal-buttons {
  display: flex;
  gap: 24rpx;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
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
  color: #fff;
}

.gender-emoji {
  font-size: 40rpx;
  display: block;
}

.gender-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #000;
  display: block;
}

.save-gender-btn {
  width: 100%;
  background-color: #000;
  color: #fff;
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
  color: #333;
}

.privacy-btn-confirm {
  background-color: #FA325A;
  color: #fff;
}

.modal-btn.cancel-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

.modal-btn.submit-btn {
  background: #000;
  color: #fff;
  box-shadow: none;
}

.submit-btn[disabled] {
  background: #f5f5f5;
  color: #999999 !important;
  border-color: #999999 !important;
  box-shadow: none;
}

.qrcode-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
  background: #fff;
  border-radius: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 32rpx;
}

.qrcode-text {
  font-size: 28rpx;
  color: #000000;
  text-align: center;
  margin-bottom: 8rpx;
}

.qrcode-text:last-child {
  margin-bottom: 0;
}

button::after {
  border: none;
}

.privacy-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.privacy-modal-content {
  width: 80%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx 32rpx;
  text-align: center;
}

.privacy-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.privacy-desc {
  font-size: 28rpx;
  color: #999;
  display: block;
  margin-bottom: 40rpx;
}

.privacy-options {
  display: flex;
  gap: 24rpx;
}

.privacy-option {
  flex: 1;
  padding: 32rpx 20rpx;
  background: #f8f8f8;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    .privacy-option-text {
      color: #fff;
    }
  }
}

.privacy-option-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.privacy-option-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #666;
}
</style>