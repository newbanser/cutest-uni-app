import scenarios from '../data/scenarios.js';

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
  // 规则：E和I差值≥10%→高分方，<10%→X；同理其他维度
  determinePersonality: function(rawScores) {
    const THRESHOLD = 10;
    let personality = '';
    
    const eScore = rawScores.E || 0;
    const iScore = rawScores.I || 0;
    const eiDiff = Math.abs(eScore - iScore) / 15 * 100;
    if (eiDiff >= THRESHOLD) {
      personality += eScore >= iScore ? 'E' : 'I';
    } else {
      personality += 'X';
    }
    
    const sScore = rawScores.S || 0;
    const nScore = rawScores.N || 0;
    const snDiff = Math.abs(sScore - nScore) / 15 * 100;
    if (snDiff >= THRESHOLD) {
      personality += sScore >= nScore ? 'S' : 'N';
    } else {
      personality += 'X';
    }
    
    const tScore = rawScores.T || 0;
    const fScore = rawScores.F || 0;
    const tfDiff = Math.abs(tScore - fScore) / 15 * 100;
    if (tfDiff >= THRESHOLD) {
      personality += tScore >= fScore ? 'T' : 'F';
    } else {
      personality += 'X';
    }
    
    const jScore = rawScores.J || 0;
    const pScore = rawScores.P || 0;
    const jpDiff = Math.abs(jScore - pScore) / 15 * 100;
    if (jpDiff >= THRESHOLD) {
      personality += jScore >= pScore ? 'J' : 'P';
    } else {
      personality += 'X';
    }
    
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
        '准备好发现你的人格类型了吗？开始吧！'
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
    const THRESHOLD = 2;
    dimensions.forEach(dim => {
      const currentLeft = currentScores[dim.left] || 0;
      const currentRight = currentScores[dim.right] || 0;
      const previousLeft = previousScores[dim.left] || 0;
      const previousRight = previousScores[dim.right] || 0;
      const currentDiff = currentLeft - currentRight;
      const previousDiff = previousLeft - previousRight;
      const diffChange = Math.abs(currentDiff - previousDiff);
      const currentLetter = currentDiff >= THRESHOLD ? dim.left : currentDiff <= -THRESHOLD ? dim.right : 'X';
      const previousLetter = previousDiff >= THRESHOLD ? dim.left : previousDiff <= -THRESHOLD ? dim.right : 'X';
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
      } else if (diffChange >= 4) {
        changes.push({
          type: 'significant',
          dimension: dim.key,
          dimensionName: dim.name,
          direction: currentDiff > 0 ? dim.left : dim.right,
          currentLetter: currentLetter,
          level: 'medium',
          scoreChange: diffChange
        });
      } else if (diffChange >= 2) {
        changes.push({
          type: 'moderate',
          dimension: dim.key,
          dimensionName: dim.name,
          direction: currentDiff > 0 ? dim.left : dim.right,
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
        `黑化预警！${flipDescriptions.join('，')}，${flipChanges.length > 1 ? '多个维度同时反转' : '核心维度发生反转'}。这可能与近期经历相关，建议回顾近期的生活变化，注意观察这种转变带来的影响。${allDesc.length > 2 ? '其他维度也有变化：' + otherDescriptions.join('；') : ''}`,
        `黑化预警！${flipDescriptions.join('、')}发生翻转！${flipChanges.length === 4 ? '四大维度全部反转，你的人格正在经历彻底的重塑！' : '这是重要的信号'}。建议反思近期的重大事件，关注这种变化是否让你感到不适。`,
        `黑化预警！${flipDescriptions.join('，')}，${flipChanges.length === 4 ? '四个维度全部发生突变！' : '维度发生突变！'}你的人格正在经历剧烈转变。注意事项：保持自我觉察，观察这种变化是否持续，必要时可以与朋友交流感受。${otherDescriptions.length > 0 ? '同时' + otherDescriptions.join('、') : ''}。`,
        `黑化预警！检测到${flipDescriptions.join('，')}维度反转${flipChanges.length === 4 ? '，四大维度全部颠覆！' : '。'}${allDesc.length > 1 ? '具体变化：' + allDesc.join('；') : ''}。提示：人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`,
        `黑化预警！${flipDescriptions.join('、')}大反转！${flipChanges.length === 4 ? '四重反转！' : ''}是成长还是伪装？只有你自己知道。${otherDescriptions.length > 0 ? '另外' + otherDescriptions.join('、') : ''}。建议：保持开放心态，给变化一些时间，不必急于下结论。`
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
  }
};

export default scoring;
