import scenarios from '../data/scenarios.js';
import simpleScenarios from '../data/simple-scenarios.js';

const STORAGE_KEY = 'scenarioHistory';
const MAX_HISTORY_COUNT = 5;

const scoring = {
  getHistory: function() {
    try {
      const history = uni.getStorageSync(STORAGE_KEY);
      return history || [];
    } catch (e) {
      return [];
    }
  },

  saveHistory: function(scenarioIds) {
    let history = this.getHistory();
    history.unshift(scenarioIds);
    if (history.length > MAX_HISTORY_COUNT) {
      history = history.slice(0, MAX_HISTORY_COUNT);
    }
    try {
      uni.setStorageSync(STORAGE_KEY, history);
    } catch (e) {
      console.error('保存历史记录失败', e);
    }
  },

  getRecentScenarioIds: function() {
    const history = this.getHistory();
    const recentIds = new Set();
    history.forEach(ids => {
      ids.forEach(id => recentIds.add(id));
    });
    return recentIds;
  },

  shuffle: function(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  generateScenarios: function() {
    const dimensions = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
    const selected = [];
    const recentIds = this.getRecentScenarioIds();

    dimensions.forEach(dim => {
      const dimScenarios = scenarios[dim];
      let available = dimScenarios.filter(q => !recentIds.has(q.id));

      if (available.length >= 3) {
        const shuffled = this.shuffle(available);
        selected.push(...shuffled.slice(0, 3));
      } else {
        const shuffled = this.shuffle([...dimScenarios]);
        selected.push(...shuffled.slice(0, 3));
      }
    });

    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    const scenarioIds = selected.map(q => q.id);
    this.saveHistory(scenarioIds);
    return { scenarios: selected, scenarioIds };
  },

  generateSimpleScenarios: function() {
    const dimensions = ['Ni', 'Ne', 'Si', 'Se', 'Ti', 'Te', 'Fi', 'Fe'];
    const selected = [];
    const recentIds = this.getRecentScenarioIds();

    dimensions.forEach(dim => {
      const dimScenarios = simpleScenarios[dim];
      let available = dimScenarios.filter(q => !recentIds.has(q.id));

      if (available.length >= 3) {
        const shuffled = this.shuffle(available);
        selected.push(...shuffled.slice(0, 3));
      } else {
        const shuffled = this.shuffle([...dimScenarios]);
        selected.push(...shuffled.slice(0, 3));
      }
    });

    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    const scenarioIds = selected.map(q => q.id);
    this.saveHistory(scenarioIds);
    return { scenarios: selected, scenarioIds };
  },

  // 简单模式：单题得分 A=5, B=4, C=3, D=2, E=1
  getSimpleScore: function(answerIndex) {
    // answerIndex: 0=A, 1=B, 2=C, 3=D, 4=E
    return 5 - answerIndex;
  },

  // 简单模式：计算8个维度的原始得分（Ni, Ne, Si, Se, Ti, Te, Fi, Fe）
  getSimpleDimensionScores: function(scenariosList, answerIndices) {
    const scores = { Ni: 0, Ne: 0, Si: 0, Se: 0, Ti: 0, Te: 0, Fi: 0, Fe: 0 };
    scenariosList.forEach((q, idx) => {
      const answerIndex = answerIndices[idx];
      if (answerIndex >= 0 && answerIndex <= 4) {
        scores[q.dimension] += this.getSimpleScore(answerIndex);
      }
    });
    return scores;
  },

  // 简单模式：将原始得分转换为百分比（满分15分）
  getSimplePercentages: function(scores) {
    const percentages = {};
    for (const dim in scores) {
      percentages[dim] = Math.round((scores[dim] / 15) * 100);
    }
    return percentages;
  },

  // 简单模式：计算组平均得分
  getGroupAverage: function(scores, groupDims) {
    let total = 0;
    groupDims.forEach(dim => {
      total += scores[dim] || 0;
    });
    return total / groupDims.length;
  },

  // 简单模式：计算组占比
  getGroupPercentage: function(scores, groupDims) {
    const avg = this.getGroupAverage(scores, groupDims);
    return Math.round((avg / 15) * 100);
  },

  // 简单模式：正确的判型逻辑
  // 1. 先找到占比更高的作为主要字母
  // 2. 主要字母占比 45%~55% → X
  // 3. 主要字母占比 >55% → 偏向主要字母
  // 4. 主要字母占比 <45% → 偏向对立字母
  judgeDimension: function(group1Percent, group2Percent, letter1, letter2) {
    // 找到占比更高的作为主要字母
    let mainLetter = group1Percent > group2Percent ? letter1 : letter2;
    let mainPercent = group1Percent > group2Percent ? group1Percent : group2Percent;
    
    // 主要字母占比在 45%~55% → 融合
    if (mainPercent >= 45 && mainPercent <= 55) {
      return 'X';
    }
    
    // 主要字母占比 >55% → 偏向主要字母
    return mainLetter;
  },

  // 简单模式：判定最终人格类型
  determineSimplePersonality: function(scores) {
    // 第一位：E/I/X
    const introvertDims = ['Ni', 'Si', 'Ti', 'Fi'];
    const extrovertDims = ['Ne', 'Se', 'Te', 'Fe'];
    const introvertPercent = this.getGroupPercentage(scores, introvertDims);
    const extrovertPercent = this.getGroupPercentage(scores, extrovertDims);
    const first = this.judgeDimension(introvertPercent, extrovertPercent, 'I', 'E');

    // 第二位：N/S/X
    const intuitionDims = ['Ni', 'Ne'];
    const sensingDims = ['Si', 'Se'];
    const intuitionPercent = this.getGroupPercentage(scores, intuitionDims);
    const sensingPercent = this.getGroupPercentage(scores, sensingDims);
    const second = this.judgeDimension(intuitionPercent, sensingPercent, 'N', 'S');

    // 第三位：T/F/X
    const thinkingDims = ['Ti', 'Te'];
    const feelingDims = ['Fi', 'Fe'];
    const thinkingPercent = this.getGroupPercentage(scores, thinkingDims);
    const feelingPercent = this.getGroupPercentage(scores, feelingDims);
    const third = this.judgeDimension(thinkingPercent, feelingPercent, 'T', 'F');

    // 第四位：J/P/X
    const judgingDims = ['Ni', 'Te', 'Fe', 'Si'];
    const perceivingDims = ['Ti', 'Ne', 'Fi', 'Se'];
    const judgingPercent = this.getGroupPercentage(scores, judgingDims);
    const perceivingPercent = this.getGroupPercentage(scores, perceivingDims);
    const fourth = this.judgeDimension(judgingPercent, perceivingPercent, 'J', 'P');

    return first + second + third + fourth;
  },

  // 根据用户选择的选项编号（1~5）获得该题的分数（1~5）
  // 规则：1=完全符合=5分, 2=比较符合=4分, 3=中立=3分, 4=不太符合=2分, 5=完全不符合=1分
  getSingleScenarioScore: function(answer) {
    switch(answer) {
      case 1: return 5;
      case 2: return 4;
      case 3: return 3;
      case 4: return 2;
      case 5: return 1;
      default: return 0;
    }
  },

  // 计算原始分数（4个维度对，0~15）
  // 规则：每个维度独立计分，题库设计为每个维度的题目选1=最符合该维度
  // E题选1=最E，I题选1=最I，S题选1=最S，以此类推
  getDimensionScores: function(scenariosList, answerIndices) {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    scenariosList.forEach((q, idx) => {
      const index = answerIndices[idx];
      if (index >= 0 && index <= 4) {
        const answer = index + 1; // 索引0~4转换为选项编号1~5
        // 选1=最符合当前维度=5分，选5=最不符合=1分
        let point = 6 - answer; // 1→5, 2→4, 3→3, 4→2, 5→1
        // 大幅增加随机因子，防止所有维度分数完全相同
        point += (Math.random() - 0.5) * 1.5;
        scores[q.dimension] += point;
      }
    });
    return scores;
  },

  // 标准化原始分数（0~15）到（0~100）
  // 每个维度3题，每题1~5分，范围 0~15
  normalizeScores: function(rawScores) {
    const normalized = {};
    const keys = ['E','I','S','N','T','F','J','P'];
    keys.forEach(key => {
      normalized[key] = Math.round((rawScores[key] / 15) * 100);
    });
    return normalized;
  },

  // 获取倾向百分比（用于雷达图等展示）
  // 根据原始分数计算百分比，分数范围0~15
  getPercentages: function(scores) {
    const point = {};
    const pairs = [
      { left: 'E', right: 'I' },
      { left: 'S', right: 'N' },
      { left: 'T', right: 'F' },
      { left: 'J', right: 'P' }
    ];
    pairs.forEach(pair => {
      const leftScore = scores[pair.left] || 0;
      const rightScore = scores[pair.right] || 0;
      const total = leftScore + rightScore;
      if (total > 0) {
        point[pair.left] = Math.round((leftScore / total) * 100);
        point[pair.right] = 100 - point[pair.left];
      } else {
        point[pair.left] = 50;
        point[pair.right] = 50;
      }
    });
    return point;
  },

  // 人格类型判定（基于百分比）
  // 规则：与简单模式保持一致
  determinePersonality: function(rawScores) {
    const THRESHOLD_LOW = 45;
    const THRESHOLD_HIGH = 55;
    let personality = '';
    
    const determineLetter = (leftScore, rightScore, leftLetter, rightLetter) => {
      const total = leftScore + rightScore;
      if (total > 0) {
        const leftPercent = Math.round((leftScore / total) * 100);
        const rightPercent = Math.round((rightScore / total) * 100);
        
        // 与简单模式相同的判型逻辑
        let mainLetter = leftPercent > rightPercent ? leftLetter : rightLetter;
        let mainPercent = leftPercent > rightPercent ? leftPercent : rightPercent;
        
        if (mainPercent >= THRESHOLD_LOW && mainPercent <= THRESHOLD_HIGH) {
          return 'X';
        }
        
        return mainLetter;
      }
      return 'X';
    };
    
    const eScore = rawScores.E || 0;
    const iScore = rawScores.I || 0;
    personality += determineLetter(eScore, iScore, 'E', 'I');
    
    const sScore = rawScores.S || 0;
    const nScore = rawScores.N || 0;
    personality += determineLetter(sScore, nScore, 'S', 'N');
    
    const tScore = rawScores.T || 0;
    const fScore = rawScores.F || 0;
    personality += determineLetter(tScore, fScore, 'T', 'F');
    
    const jScore = rawScores.J || 0;
    const pScore = rawScores.P || 0;
    personality += determineLetter(jScore, pScore, 'J', 'P');
    
    return personality;
  },

  // 计算滚动分数（新原始分标准化后与旧滚动分加权，新权重 0.3）
  calculateRollingScores: function(currentRolling, rawScores, isFirstAnalysis = false) {
    const newNormalized = this.normalizeScores(rawScores);
    if (isFirstAnalysis) return newNormalized;
    const newRolling = {};
    const keys = ['E','I','S','N','T','F','J','P'];
    keys.forEach(key => {
      const old = currentRolling[key] || 0;
      newRolling[key] = Number((old * 0.7 + newNormalized[key] * 0.3).toFixed(2));
    });
    return newRolling;
  },

  getRandomItem: function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  getDimensionName: function(key) {
    const names = {
      'EI': '能量',
      'SN': '认知',
      'TF': '决策',
      'JP': '态度'
    };
    return names[key] || key;
  },

  getLetterName: function(letter) {
    const names = {
      'E': '外倾', 'I': '内倾',
      'S': '实感', 'N': '直觉',
      'T': '思维', 'F': '情感',
      'J': '判断', 'P': '感知',
      'X': '融合'
    };
    return names[letter] || letter;
  },

  analyzeChanges: function(currentView, previousView) {
    if (!previousView) {
      const messages = [
        '这是你的第一次解析，开启人格探索之旅吧！',
        '欢迎来到人格测试，让我们开始探索你的内心世界',
        '初次见面，让我来认识真正的你',
        '恭喜你完成第一次测试，你的人格类型已经揭晓！'
      ];
      return { 
        type: 'first_analysis', 
        level: 'info', 
        message: this.getRandomItem(messages),
        changes: [] 
      };
    }
    const currentScores = currentView.raw_scores || currentView.rolling_scores || currentView.percentages || {};
    const previousScores = previousView.raw_scores || previousView.rolling_scores || previousView.percentages || {};
    const changes = [];
    const dimensions = [
      { key: 'EI', left: 'E', right: 'I', name: '外向/内向' },
      { key: 'SN', left: 'S', right: 'N', name: '实感/直觉' },
      { key: 'TF', left: 'T', right: 'F', name: '思维/情感' },
      { key: 'JP', left: 'J', right: 'P', name: '判断/感知' }
    ];
    const THRESHOLD = 10;
    dimensions.forEach(dim => {
      const currentLeft = currentScores[dim.left] || 0;
      const currentRight = currentScores[dim.right] || 0;
      const previousLeft = previousScores[dim.left] || 0;
      const previousRight = previousScores[dim.right] || 0;
      
      const currentTotal = currentLeft + currentRight;
      const previousTotal = previousLeft + previousRight;
      
      const currentDiffPercent = currentTotal > 0 ? Math.abs(currentLeft - currentRight) / currentTotal * 100 : 0;
      const previousDiffPercent = previousTotal > 0 ? Math.abs(previousLeft - previousRight) / previousTotal * 100 : 0;
      const diffChange = Math.abs(currentDiffPercent - previousDiffPercent);
      
      const currentLetter = currentDiffPercent >= THRESHOLD ? (currentLeft >= currentRight ? dim.left : dim.right) : 'X';
      const previousLetter = previousDiffPercent >= THRESHOLD ? (previousLeft >= previousRight ? dim.left : dim.right) : 'X';
      
      if (currentLetter !== previousLetter) {
        changes.push({
          type: 'flip',
          dimension: dim.key,
          dimensionName: dim.name,
          from: previousLetter,
          to: currentLetter,
          level: 'high',
          scoreChange: diffChange
        });
      } else if (diffChange >= 10) {
        changes.push({
          type: 'significant',
          dimension: dim.key,
          dimensionName: dim.name,
          direction: currentLeft >= currentRight ? dim.left : dim.right,
          currentLetter: currentLetter,
          level: 'medium',
          scoreChange: diffChange
        });
      } else if (diffChange >= 5) {
        changes.push({
          type: 'moderate',
          dimension: dim.key,
          dimensionName: dim.name,
          direction: currentLeft >= currentRight ? dim.left : dim.right,
          currentLetter: currentLetter,
          level: 'low',
          scoreChange: diffChange
        });
      } else if (currentLetter === 'X') {
        changes.push({
          type: 'stable',
          dimension: dim.key,
          dimensionName: dim.name,
          currentLetter: currentLetter,
          level: 'info',
          scoreChange: diffChange
        });
      }
    });
    
    const flipChanges = changes.filter(c => c.type === 'flip');
    const significantChanges = changes.filter(c => c.type === 'significant');
    const moderateChanges = changes.filter(c => c.type === 'moderate');
    
    if (flipChanges.length > 0) {
      let flipDescriptions = flipChanges.map(c => {
        const dimName = this.getDimensionName(c.dimension);
        const fromName = this.getLetterName(c.from);
        const toName = this.getLetterName(c.to);
        if (c.from === 'X' && c.to !== 'X') {
          return `${dimName}维度从融合状态明确为${toName}`;
        } else if (c.from !== 'X' && c.to === 'X') {
          return `${dimName}维度进入融合状态`;
        } else if (c.from === 'X' && c.to === 'X') {
          return `${dimName}维度保持融合平衡`;
        }
        return `${dimName}维度由${fromName}转为${toName}`;
      });
      
      const allChanges = [...flipChanges, ...significantChanges, ...moderateChanges];
      let otherDescriptions = [];
      if (significantChanges.length > 0) {
        otherDescriptions = significantChanges.map(c => {
          const dimName = this.getDimensionName(c.dimension);
          if (c.currentLetter === 'X') {
            return `${dimName}维度处于融合状态`;
          }
          const dirName = this.getLetterName(c.direction);
          return `${dimName}维度明显偏向${dirName}`;
        });
      }
      if (moderateChanges.length > 0) {
        otherDescriptions = otherDescriptions.concat(moderateChanges.map(c => {
          const dimName = this.getDimensionName(c.dimension);
          if (c.currentLetter === 'X') {
            return `${dimName}维度保持融合平衡`;
          }
          const dirName = this.getLetterName(c.direction);
          return `${dimName}维度略有${dirName}倾向`;
        }));
      }
      
      const allDesc = [...flipDescriptions, ...otherDescriptions];
      
      const messages = [
        `黑化预警！检测到有维度发生融合，有维度发生反转。人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`,
        `黑化预警！检测到维度发生变化。人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`,
        `黑化预警！检测到有维度发生融合，有维度发生反转。人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`,
        `黑化预警！检测到维度反转。人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`,
        `黑化预警！检测到有维度发生融合，有维度发生反转。人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`
      ];
      return {
        type: 'flip',
        level: 'high',
        message: this.getRandomItem(messages),
        changes: changes
      };
    } else if (significantChanges.length > 0) {
      let sigDescriptions = significantChanges.map(c => {
        const dimName = this.getDimensionName(c.dimension);
        if (c.currentLetter === 'X') {
          return `${dimName}维度处于融合状态`;
        }
        const dirName = this.getLetterName(c.direction);
        return `${dimName}维度明显偏向${dirName}`;
      });
      
      let modDescriptions = [];
      if (moderateChanges.length > 0) {
        modDescriptions = moderateChanges.map(c => {
          const dimName = this.getDimensionName(c.dimension);
          if (c.currentLetter === 'X') {
            return `${dimName}维度保持融合平衡`;
          }
          const dirName = this.getLetterName(c.direction);
          return `${dimName}维度略有${dirName}倾向`;
        });
      }
      
      const allDesc = [...sigDescriptions, ...modDescriptions];
      
      const messages = [
        `红色预警！你的人格发生重大变化。检测到${sigDescriptions.join('，')}${modDescriptions.length > 0 ? '，' + modDescriptions.join('，') : ''}。建议你记录这种变化带来的感受，与朋友或家人讨论你的观察，获得更多视角。`,
        `红色预警！你的人格发生重大变化。检测到${sigDescriptions.join('，')}${modDescriptions.length > 0 ? '，' + modDescriptions.join('，') : ''}。建议关注这种变化是否与近期的压力或环境改变有关，继续观察这个趋势。`,
        `红色预警！你的人格发生重大变化。检测到${sigDescriptions.join('，')}${modDescriptions.length > 0 ? '，' + modDescriptions.join('，') : ''}。试着理解这种变化背后的原因，注意这种变化是否让你在人际关系或工作中感到更加舒适。`,
        `红色预警！你的人格发生重大变化。检测到${sigDescriptions.join('，')}${modDescriptions.length > 0 ? '，' + modDescriptions.join('，') : ''}。保持开放心态，接纳这种转变，它可能是成长的信号。`,
        `红色预警！你的人格发生重大变化。检测到${sigDescriptions.join('，')}${modDescriptions.length > 0 ? '，' + modDescriptions.join('，') : ''}。适度的变化是健康的，说明你在适应环境，保持关注但不必过度焦虑。`
      ];
      return {
        type: 'significant',
        level: 'medium',
        message: this.getRandomItem(messages),
        changes: changes
      };
    } else if (moderateChanges.length > 0) {
      let modDescriptions = moderateChanges.map(c => {
        const dimName = this.getDimensionName(c.dimension);
        if (c.currentLetter === 'X') {
          return `${dimName}维度处于融合状态`;
        }
        const dirName = this.getLetterName(c.direction);
        return `${dimName}维度略有${dirName}倾向`;
      });
      
      const messages = [
        `温和提醒：${modDescriptions.join('，')}，保持关注${moderateChanges.length > 3 ? '，多个维度正在微妙调整' : ''}。小贴士：微小的变化积累起来也可能带来显著的转变，建议持续观察。`,
        `温和提醒：${modDescriptions.join('、')}，${moderateChanges.length > 1 ? '这些维度' : '该维度'}正在微妙调整，特质稍微明显了一些。提示：这种温和的变化通常是健康的适应过程，不必担心。`,
        `温和提醒：你的${modDescriptions.join('、')}，${moderateChanges.length > 1 ? '多个维度' : '该维度'}有轻微变化。建议：留意这种变化是否与近期的习惯或心态调整有关。`,
        `温和提醒：${modDescriptions.join('；')}，${moderateChanges.length > 1 ? '各维度' : '该维度'}出现温和波动，正在慢慢变化。观察建议：记录每次解析的结果，看看是否形成某种趋势。`,
        `温和提醒：检测到${modDescriptions.join('，')}维度的微小调整${moderateChanges.length > 1 ? '，你的性格正在整体微调' : ''}。提示：人格是动态变化的，这种小幅度的波动很正常。`
      ];
      return {
        type: 'moderate',
        level: 'low',
        message: this.getRandomItem(messages),
        changes: changes
      };
    } else {
      const messages = [
        '稳定如一，你的人格特质保持一致。这表明你近期的生活状态相对平稳，性格处于一个舒适的平衡状态。',
        '你的人格非常稳定，继续保持！稳定的性格有助于建立可靠的人际关系，是成熟的表现。',
        '没有明显变化，你的性格保持稳定状态。提示：稳定并不意味着停滞，内心的成长可能正在悄然发生。',
        '检测到稳定信号，你的人格特征没有显著变化。这是很好的状态，说明你对当前的生活比较适应。',
        '一如既往，你的人格保持一致。建议：可以尝试一些新的体验，看看是否会带来有趣的变化。'
      ];
      return {
        type: 'stable',
        level: 'default',
        message: this.getRandomItem(messages),
        changes: []
      };
    }
  },

  formatDate: function(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  getCurveData: function(records) {
    if (!records || records.length === 0) return null;
    const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
    const personalityCurve = sortedRecords.map(view => ({
      date: view.timestamp,
      personality: view.personality
    }));
    const dimensionCurves = { EI: [], SN: [], TF: [], JP: [] };
    sortedRecords.forEach(view => {
      const scores = view.rolling_scores || view.raw_scores || {};
      const e = scores.E || 0, i = scores.I || 0;
      const s = scores.S || 0, n = scores.N || 0;
      const t = scores.T || 0, f = scores.F || 0;
      const j = scores.J || 0, p = scores.P || 0;
      const eiTotal = e + i;
      const snTotal = s + n;
      const tfTotal = t + f;
      const jpTotal = j + p;
      dimensionCurves.EI.push({ date: view.timestamp, value: eiTotal > 0 ? Math.round((e / eiTotal) * 100) : 50 });
      dimensionCurves.SN.push({ date: view.timestamp, value: snTotal > 0 ? Math.round((s / snTotal) * 100) : 50 });
      dimensionCurves.TF.push({ date: view.timestamp, value: tfTotal > 0 ? Math.round((t / tfTotal) * 100) : 50 });
      dimensionCurves.JP.push({ date: view.timestamp, value: jpTotal > 0 ? Math.round((j / jpTotal) * 100) : 50 });
    });
    return { personalityCurve, dimensionCurves };
  },

  calculateMatch: function(userA, userB) {
    let matchScore = 0;
    
    const aScores = userA.rawScores || userA.raw_scores || {};
    const bScores = userB.rawScores || userB.raw_scores || {};
    
    const keys = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
    let totalDiff = 0;
    let totalScore = 0;
    
    keys.forEach(key => {
      const a = aScores[key] || 0;
      const b = bScores[key] || 0;
      totalDiff += Math.abs(a - b);
      totalScore += a + b;
    });
    
    const maxPossibleDiff = 120;
    const similarity = 100 - (totalDiff / maxPossibleDiff) * 100;
    
    matchScore = Math.round(similarity);
    
    return Math.max(0, Math.min(100, matchScore));
  },

  // 从百分比数据计算维度数据
  // 输入：{E, I, S, N, T, F, J, P} 0-100 百分比（结果页展示的最终分值）
  calculateDimensionData: function(percentages) {
    const dimensionData = {
      EI: { value: 'X', percent: 50 },
      SN: { value: 'X', percent: 50 },
      TF: { value: 'X', percent: 50 },
      JP: { value: 'X', percent: 50 }
    };

    const safePercent = (v) => {
      const n = Number(v);
      if (isNaN(n)) return 0;
      return Math.max(0, Math.min(100, n));
    };

    // 计算 EI
    const ePercent = safePercent(percentages.E);
    const iPercent = safePercent(percentages.I);
    dimensionData.EI = this._judgeDimension(ePercent, iPercent, 'E', 'I');

    // 计算 SN
    const sPercent = safePercent(percentages.S);
    const nPercent = safePercent(percentages.N);
    dimensionData.SN = this._judgeDimension(sPercent, nPercent, 'S', 'N');

    // 计算 TF
    const tPercent = safePercent(percentages.T);
    const fPercent = safePercent(percentages.F);
    dimensionData.TF = this._judgeDimension(tPercent, fPercent, 'T', 'F');

    // 计算 JP
    const jPercent = safePercent(percentages.J);
    const pPercent = safePercent(percentages.P);
    dimensionData.JP = this._judgeDimension(jPercent, pPercent, 'J', 'P');

    return dimensionData;
  },

  _judgeDimension: function(aPercent, bPercent, aLetter, bLetter) {
    const mainLetter = aPercent > bPercent ? aLetter : bLetter;
    const mainPercent = Math.max(aPercent, bPercent);

    if (mainPercent >= 45 && mainPercent <= 55) {
      return { value: 'X', percent: mainPercent };
    }
    return { value: mainLetter, percent: mainPercent };
  },

  // 关系匹配算法 - 新算法
  // userAData / userBData 应包含 {percentages: {E,I,S,N,T,F,J,P}, gender}
  calculateRelationshipMatch: function(userAData, userBData) {
    try {
      // 1. 从百分比数据提取维度数据
      const aDimData = this.calculateDimensionData(userAData.percentages || userAData.rawScores || userAData.raw_scores || {});
      const bDimData = this.calculateDimensionData(userBData.percentages || userBData.rawScores || userBData.raw_scores || {});

      // 2. 计算有效维度匹配分
      let rawTotal = 0;
      let validCount = 0;
      const xCount = this._countX(aDimData) + this._countX(bDimData);

      const dimensions = ['EI', 'SN', 'TF', 'JP'];
      dimensions.forEach(dim => {
        const aVal = aDimData[dim].value;
        const bVal = bDimData[dim].value;

        if (aVal === 'X' || bVal === 'X') {
          return; // 无效维度
        }

        validCount++;
        if (aVal === bVal) {
          rawTotal += 1;
        } else {
          rawTotal -= 1;
        }
      });

      let M = 0;
      if (validCount > 0) {
        M = rawTotal / validCount;
      }

      // 3. 判断是否为情侣语境
      const isCoupleContext = this._isCoupleContext(M, userAData.gender, userBData.gender);
      
      // 4. 情侣语境加分
      if (isCoupleContext) {
        M = Math.min(M + 0.2, 0.95);
      }

      // 5. 判定等级
      const level = this._determineLevel(M, xCount, validCount);

      // 6. 获取关系名
      const relationName = this._getRelationName(level, userAData.gender, userBData.gender, isCoupleContext);

      // 7. 获取颜色
      const color = this._getColor(level, xCount);

      // 8. 狱友彩蛋
      let finalRelationName = relationName;
      let finalColor = color;
      if (level === 'D' && xCount >= 2 && !isCoupleContext) {
        finalRelationName = '狱友';
        finalColor = '⚪';
      }

      // 9. 描述文案（占位符，后续补充）
      const description = this._getRelationDescription(level);

      return {
        relationName: finalRelationName,
        color: finalColor,
        level: level,
        description: description,
        matchScore: Math.round((M + 1) * 50), // 转换为0-100分
        rawM: M,
        xCount: xCount,
        validCount: validCount,
        isCoupleContext: isCoupleContext
      };
    } catch (error) {
      console.error('计算关系匹配失败:', error);
      // 返回安全的默认值，防止程序卡住
      return {
        relationName: '普通朋友',
        color: '🔵',
        level: 'B',
        description: '这是一段独特的关系',
        matchScore: 50,
        rawM: 0,
        xCount: 0,
        validCount: 0,
        isCoupleContext: false
      };
    }
  },

  _countX: function(dimData) {
    let count = 0;
    if (dimData.EI.value === 'X') count++;
    if (dimData.SN.value === 'X') count++;
    if (dimData.TF.value === 'X') count++;
    if (dimData.JP.value === 'X') count++;
    return count;
  },

  _isCoupleContext: function(M, aGender, bGender) {
    // 灵魂知己（S级）+ 双方为异性
    return M >= 0.9 && aGender && bGender && aGender !== bGender;
  },

  _determineLevel: function(M, xCount, validCount) {
    if (validCount === 0) {
      return 'B';
    }

    if (M >= 0.9) {
      return xCount <= 1 ? 'S' : 'C1';
    } else if (M >= 0.7) {
      return 'C1';
    } else if (M >= 0.5) {
      return 'C2';
    } else if (M >= 0.3) {
      return 'C3';
    } else if (M >= -0.2) {
      return 'B';
    } else if (M >= -0.4) {
      return xCount >= 1 ? 'M1' : 'M2';
    } else if (M >= -0.6) {
      return xCount <= 1 ? 'M2' : 'A';
    } else if (M >= -0.8) {
      return 'A';
    } else {
      return xCount <= 1 ? 'D' : 'A';
    }
  },

  _getRelationName: function(level, aGender, bGender, isCouple) {
    const isSameGender = aGender && bGender && aGender === bGender;
    const isDiffGender = aGender && bGender && aGender !== bGender;
    const isMale = aGender === 'male' || bGender === 'male';
    const isFemale = aGender === 'female' || bGender === 'female';

    const RELATION_MAP = {
      S: {
        couple: '灵魂伴侣',
        friendM: '灵魂知己',
        friendF: '灵魂知己',
        male: '孪生兄弟',
        female: '孪生姐妹',
        default: '灵魂知己'
      },
      C1: { default: '脑波同频' },
      C2: { sameGender: '桃园结义', default: '脑波同频' },
      C3: { couple: '欢喜冤家', default: '师徒' },
      M1: { couple: '老夫老妻', sameGender: '死党', female: '闺蜜', default: '臭味相投' },
      B: { default: '寡淡如水' },
      M2: { couple: '需要磨合', default: '臭味相投' },
      A: { default: '礼貌距离' },
      D: { couple: '冤家情侣', sameGender: '死对头', female: '塑料姐妹', male: '塑料兄弟', default: '冤家情侣' },
      XXXX: { default: '纯纯白给' },
      JAIL: { default: '狱友' }
    };

    const levelData = RELATION_MAP[level] || RELATION_MAP.B;

    if (isCouple && levelData.couple) {
      return levelData.couple;
    }

    if (isSameGender && levelData.sameGender) {
      return levelData.sameGender;
    }

    if (isFemale && levelData.female) {
      return levelData.female;
    }

    if (isMale && levelData.male) {
      return levelData.male;
    }

    if (isDiffGender && (levelData.friendM || levelData.friendF)) {
      return isMale ? levelData.friendM || levelData.default : levelData.friendF || levelData.default;
    }

    return levelData.default;
  },

  _getColor: function(level, xCount) {
    const defaultColor = (() => {
      switch (level) {
        case 'S':
        case 'C1':
        case 'C2':
          return '🟡';
        case 'C3':
        case 'M1':
          return '🟣';
        case 'B':
        case 'M2':
        case 'A':
        case 'D':
          return '🔵';
        default:
          return '⚪';
      }
    })();

    if (xCount >= 2) {
      const downgrade = { '🟡': '🟣', '🟣': '🔵', '🔵': '⚪' };
      return downgrade[defaultColor] || '⚪';
    }

    return defaultColor;
  },

  _getRelationDescription: function(level) {
    // 占位符描述，后续补充
    const descriptions = {
      S: '你们是最懂彼此的人，心灵深处有着惊人的默契。',
      C1: '你们的想法总是能同步，脑波频率高度一致。',
      C2: '你们像结拜兄弟一样，有着深厚的情谊。',
      C3: '吵吵闹闹，却又离不开对方。',
      M1: '像老夫老妻一样，互相包容理解。',
      B: '关系平淡如水，不会太近也不会太远。',
      M2: '需要时间磨合，臭味相投也不错。',
      A: '保持礼貌的距离，彼此尊重。',
      D: '冤家路窄，却又彼此牵挂。',
      XXXX: '纯纯白给，毫无默契可言。',
      JAIL: '狱友情深，一起扛过！'
    };
    return descriptions[level] || '这是一段独特的关系。';
  }
};

export default scoring;
