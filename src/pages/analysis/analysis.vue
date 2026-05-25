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

    <view class="options-card">
      <view class="options">
        <view
          v-for="(item, index) in options"
          :key="index"
          class="option-item"
          :class="{ selected: selectedOptionIndex === index }"
          @tap="selectOption(index)"
          @click="selectOption(index)"
        >
          <view class="option-indicator">{{ item.value }}</view>
          <text class="option-text">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <view class="qrcode-section">
      <text class="qrcode-text">请依靠本能做出选择</text>
      <text class="qrcode-text">胡乱作答会影响趋势</text>
      <text class="qrcode-text">如果对上文内容有疑义</text>
      <text class="qrcode-text">微信联系 HGH_SHE</text>
    </view>

    <text class="tip-text" v-if="currentIndex === totalScenarios - 1 &amp;&amp; selectedOptionIndex !== null">本分析仅供娱乐参考，不能代替专业心理评估</text>

    <view class="button-section" v-if="currentIndex === totalScenarios - 1 &amp;&amp; selectedOptionIndex !== null">
      <view class="submit-btn" @tap="finishAnalysis" @click="finishAnalysis">
        点我查看
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import scoring from '@/utils/scoring';

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

const selectOption = (index) => {
  selectedOptionIndex.value = index;

  const isLastScenario = currentIndex.value === totalScenarios.value - 1;
  if (!isLastScenario) {
    setTimeout(() => {
      nextScenario();
    }, 200);
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

const finishAnalysis = () => {
  try {
    const lastSelectedOption = options.value[selectedOptionIndex.value];
    const lastOriginalIndex = lastSelectedOption.originalIndex;
    const answerIndices = [...answers.value, lastOriginalIndex];
    userStore.loadUserData();

    const isFirstAnalysis = userStore.userData.total_analysis_count === 0;
    const oldScores = { ...userStore.userData.current_rolling_scores };

    const rawScores = scoring.getDimensionScores(scenarios.value, answerIndices);
    const newRollingScores = scoring.calculateRollingScores(oldScores, rawScores, isFirstAnalysis);
    const newPercentages = scoring.getPercentages(rawScores);
    const newPersonality = scoring.determinePersonality(rawScores);

    const view = {
      id: 'view_' + Date.now(),
      timestamp: Date.now(),
      answers: answerIndices,
      raw_scores: rawScores,
      rolling_scores: newRollingScores,
      personality: newPersonality,
      percentages: newPercentages,
      interpretations: []
    };

    userStore.addAnalysisRecord(view);

    uni.setStorageSync('currentViewId', view.id);
    uni.redirectTo({ url: '/pages/view/view' });
  } catch (error) {
    console.error('finishAnalysis error:', error);
    uni.showToast({ title: '保存失败: ' + error.message, icon: 'none', duration: 3000 });
  }
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
  padding-bottom: 180rpx;
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
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
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

.options-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 8rpx;
  margin-bottom: 32rpx;
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
}

.options {
  display: flex;
  flex-direction: column;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-radius: 24rpx;
  margin-bottom: 8rpx;
  transition: all 0.2s ease;
  background: #f5f5f5;
  border: 2px solid #000000;
}

.option-item:last-child {
  margin-bottom: 0;
}

.option-item.selected {
  background: #000000;
}

.option-indicator {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
  color: #000000;
  margin-right: 20rpx;
  flex-shrink: 0;
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

.option-item.selected .option-text {
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

.submit-btn {
  width: 400rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #fff;
  color: #000000;
  border: 2px solid #000000;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  padding: 0;
  box-shadow: 4rpx 4rpx 0 #000000;
  text-align: center;
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
  border: 2px solid #000000;
  box-shadow: 6rpx 6rpx 0 #000000;
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
</style>
