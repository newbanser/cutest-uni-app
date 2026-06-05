<template>
  <view class="container">
    <view class="progress-section">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
      </view>
      <text class="progress-text">{{ currentIndex + 1 }} / {{ totalScenarios }}</text>
    </view>

    <view class="scenario-card">
      <view class="scenario-number">第 {{ currentIndex + 1 }} 描述</view>
      <text class="scenario-text">{{ currentScenario?.scenario }}</text>
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

    <view class="confirm-modal" v-if="showConfirmModal" @tap="closeConfirmModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">确认提交？</text>
        <text class="modal-desc">提交后将无法修改答案</text>
        <view class="modal-buttons">
          <view class="modal-btn cancel-btn" @tap="closeConfirmModal">我再想想</view>
          <view class="modal-btn submit-btn" @tap="openGenderModal">现在交卷</view>
        </view>
      </view>
    </view>

    <view class="confirm-modal" v-if="showPrivacyModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">测试方式</text>
        <text class="modal-desc">让 {{ inviterCuteid }} 知道你测了，还是悄悄看看结果？</text>
        <view class="gender-options">
          <view class="gender-option" :class="{ active: true }" @tap.stop="choosePrivacy(true)">
            <text class="gender-text">🔒 偷偷测试</text>
          </view>
          <view class="gender-option" :class="{ active: false }" @tap.stop="choosePrivacy(false)">
            <text class="gender-text">💌 让TA知道</text>
          </view>
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

    <text class="tip-text" v-if="currentIndex === totalScenarios - 1 &amp;&amp; selectedOptionIndex !== null">本分析仅供娱乐参考，不能代替专业心理评估</text>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import scoring from '@/utils/scoring';
import personalitiesData from '@/data/personalities';

const { personalities } = personalitiesData.personalitiesData;
const userStore = useUserStore();

const scenarios = ref([]);
const scenarioIds = ref([]);
const currentIndex = ref(0);
const currentScenario = ref(null);
const selectedOptionIndex = ref(null);
const answers = ref([]);
const totalScenarios = ref(24);
const progress = ref(0);
const options = ref([]);

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

const showConfirmModal = ref(false);
const showGenderModal = ref(false);
const showPrivacyConfirmModal = ref(false);
const selectedGender = ref('');
const inviterCuteid = ref('');
const showPrivacyModal = ref(false);

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
  console.log('analysis openGenderModal - userData.gender:', userStore.userData.gender);
  console.log('analysis openGenderModal - userData:', userStore.userData);
  const storedUserData = uni.getStorageSync('userData');
  console.log('analysis openGenderModal - storedUserData:', storedUserData);
  
  if (userStore.userData.gender) {
    // 已有性别，直接完成分析
    console.log('analysis Has gender, skipping selection');
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
    console.log('analysis No gender, showing selection modal');
    selectedGender.value = '';
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

const closePrivacyModal = () => {
  showPrivacyModal.value = false;
};

const choosePrivacy = (isPrivate) => {
  console.log('analysis choosePrivacy called, isPrivate:', isPrivate);
  try {
    showPrivacyModal.value = false;
    console.log('analysis Modal closed, calling doFinishAnalysis...');
    // 延迟执行，确保弹窗完全关闭
    setTimeout(() => {
      doFinishAnalysis(isPrivate);
    }, 150);
  } catch (error) {
    console.error('analysis choosePrivacy error:', error);
    uni.showToast({ title: '操作失败: ' + error.message, icon: 'none', duration: 3000 });
  }
};

const doFinishAnalysis = async (isPrivate) => {
  try {
    console.log('[DEBUG] analysis doFinishAnalysis start');
    
    const answerIndices = answers.value.map(a => a.optionIndex);
    userStore.loadUserData();

    const isFirstAnalysis = userStore.userData.total_analysis_count === 0;
    const oldScores = { ...userStore.userData.current_rolling_scores };

    const rawScores = scoring.getDimensionScores(scenarios.value, answerIndices);
    const newRollingScores = scoring.calculateRollingScores(oldScores, rawScores, isFirstAnalysis);
    const newPercentages = scoring.getPercentages(rawScores);
    const newPersonality = scoring.determinePersonality(rawScores);

    const gender = userStore.userData.gender || 'male';
    const view = {
      id: 'view_' + Date.now(),
      timestamp: Date.now(),
      answers: answerIndices,
      raw_scores: rawScores,
      rolling_scores: newRollingScores,
      personality: newPersonality,
      percentages: newPercentages,
      interpretations: [],
      isPrivate: isPrivate,
      inviterCuteid: inviterCuteid.value,
      gender: gender,
      test_mode: 'hell'
    };

    console.log('[DEBUG] analysis preparing to save data...');
    userStore.addAnalysisRecord(view);

    uni.setStorageSync('currentViewId', view.id);
    uni.setStorageSync('currentView', view);
    console.log('[DEBUG] analysis data saved to local storage');
    
    const matchTarget = uni.getStorageSync('matchTarget');
    console.log('[DEBUG] analysis matchTarget:', matchTarget);
    
    const isTabBarPage = !!matchTarget;
    const redirectUrl = matchTarget ? '/pages/index/index' : '/pages/xbti-result/xbti-result';
    console.log('[DEBUG] analysis preparing to redirect to:', redirectUrl, 'isTabBar:', isTabBarPage);
    
    // 先调用云函数保存到数据库
    const saveCloudData = async () => {
      try {
        console.log('[DEBUG] analysis executing cloud function...');
        const personalityInfo = personalities[newPersonality] || personalities['unknown'];
        if (uni.cloud) {
          await new Promise((resolve, reject) => {
            uni.cloud.callFunction({
              name: 'savePersonality',
              data: {
                cuteId: userStore.userData.cuteId,
                personalityCode: newPersonality,
                personalityName: personalityInfo.name || '',
                campName: personalityInfo.camp || '',
                dimensions: personalityInfo.dimensionTags || [],
                percentages: newPercentages,
                gender: gender
              },
              success: (res) => {
                console.log('[DEBUG] analysis 云函数成功:', res);
                resolve();
              },
              fail: (err) => {
                console.error('[DEBUG] analysis 云函数失败:', err);
                resolve(); // 即使失败也继续，不要阻塞流程
              }
            });
          });
        }
      } catch (e) {
        console.error('[DEBUG] analysis cloud function error:', e);
      }
    };
    
    // 先保存到云端
    await saveCloudData();
    
    // 再跳转页面
    setTimeout(() => {
      console.log('[DEBUG] analysis executing redirect...');
      try {
        if (isTabBarPage) {
          // 跳转到 tabBar 页面必须用 switchTab
          uni.switchTab({
            url: redirectUrl,
            success: () => {
              console.log('[DEBUG] analysis switchTab success');
            },
            fail: (err) => {
              console.error('[DEBUG] analysis switchTab fail:', err);
              uni.showToast({ 
                title: '跳转失败，请重试', 
                icon: 'none',
                duration: 2000
              });
            }
          });
        } else {
          // 跳转到非 tabBar 页面用 redirectTo
          uni.redirectTo({
            url: redirectUrl,
            success: () => {
              console.log('[DEBUG] analysis redirectTo success');
            },
            fail: (err) => {
              console.error('[DEBUG] analysis redirectTo fail:', err);
              uni.showToast({ 
                title: '跳转失败，请重试', 
                icon: 'none',
                duration: 2000
              });
            }
          });
        }
      } catch (jumpErr) {
        console.error('[DEBUG] analysis redirect error:', jumpErr);
      }
    }, 100);
  } catch (error) {
    console.error('[DEBUG] analysis doFinishAnalysis error:', error);
    uni.showToast({ 
      title: '测试失败，请重试', 
      icon: 'none',
      duration: 3000 
    });
  }
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

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    const prevRecord = answers.value[currentIndex.value];
    if (prevRecord) {
      selectedOptionIndex.value = prevRecord.optionIndex;
    } else {
      selectedOptionIndex.value = null;
    }
    const prevScenarioData = scenarios.value[currentIndex.value];
    const prevScenarioOptions = prevScenarioData?.options || [];
    options.value = formatOptions(prevScenarioOptions);
    currentScenario.value = prevScenarioData;
    progress.value = Math.round(((currentIndex.value + 1) / totalScenarios.value) * 100);
  }
};

const nextScenario = () => {
  if (selectedOptionIndex.value === null) {
    uni.showToast({ title: '请选择一个描述', icon: 'none' });
    return;
  }

  const selectedOption = options.value[selectedOptionIndex.value];
  const originalAnswerIndex = selectedOption.originalIndex;
  const newAnswers = [...answers.value, originalAnswerIndex];
  const nextIndex = currentIndex.value + 1;

  if (nextIndex >= totalScenarios.value) {
    return;
  }

  const nextScenarioData = scenarios.value[nextIndex];
  const nextScenarioOptions = nextScenarioData?.options || [];
  const formattedNextOptions = formatOptions(nextScenarioOptions);

  answers.value = newAnswers;
  currentIndex.value = nextIndex;
  currentScenario.value = nextScenarioData;
  selectedOptionIndex.value = null;
  progress.value = Math.round(((nextIndex + 1) / totalScenarios.value) * 100);
  options.value = formattedNextOptions;
};

onMounted(() => {
  const { scenarios: generatedScenarios, scenarioIds: generatedScenarioIds } = scoring.generateScenarios();
  const firstScenarioOptions = generatedScenarios[0]?.options || [];
  const formattedOptions = formatOptions(firstScenarioOptions);

  scenarios.value = generatedScenarios;
  scenarioIds.value = generatedScenarioIds;
  currentScenario.value = generatedScenarios[0];
  progress.value = 0;
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
  margin-top: 32rpx;
  margin-bottom: 24rpx;
}

.prev-btn {
  width: 160rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: rgba(0, 0, 0, 0.05);
  color: #666666;
  border-radius: 36rpx;
  font-size: 28rpx;
  font-weight: 500;
  padding: 0;
  text-align: center;
  margin-right: 24rpx;
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

.next-btn {
  width: 160rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: rgba(0, 0, 0, 0.05);
  color: #666666;
  border-radius: 36rpx;
  font-size: 28rpx;
  font-weight: 500;
  padding: 0;
  text-align: center;
  margin-left: 24rpx;
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

.confirm-modal {
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

.modal-content {
  width: 600rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  position: relative;
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

.modal-desc {
  font-size: 28rpx;
  color: #666666;
  text-align: center;
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
  font-size: 30rpx;
  font-weight: 500;
  text-align: center;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666666;
}

.submit-btn {
  background-color: #000000;
  color: #ffffff;
}
</style>
