import scenarios from '../data/scenarios.js';
import simpleScenarios from '../data/simple-scenarios.js';
import officialPairs from '../data/officialPairs.js';

const STORAGE_KEY = 'scenarioHistory';
const MAX_HISTORY_COUNT = 5;

// ===== v3.1: 12型六大属性标签 =====
const PROPERTY_LABELS = {
  resonator:  { tag: '共鸣', en: 'Resonance' },
  passion:    { tag: '热爱', en: 'Passion' },
  rivalry:    { tag: '竞争', en: 'Rivalry' },
  growth:     { tag: '成长', en: 'Growth' },
  drain:      { tag: '遗憾', en: 'Drain' },
  companion:  { tag: '伙伴', en: 'Companion' },
};

// ===== v3.1: 12型关系数据库（默认=男女名称） =====
const RELATION_TYPES = {
  drain_relation:      { id:1,  property:'drain',     name:'求而不得', nameEn:'Futile pursuit',
    quote:'戒不掉，也拥有不了',
    snapshot:'你明知道这段关系会消耗自己，却还是忍不住靠近。没有大矛盾，只是每次见完面都会有点疲惫。久而久之，关系还在，耐心却越来越少',
    rarityPct:0.41 },
  last_card:           { id:2,  property:'resonator', name:'最后底牌', nameEn:'Last Card',
    quote:'真撑不住的时候，第一个想到的人是TA',
    snapshot:'平时联系不一定最多，朋友圈互动也不一定最勤。但真遇到事的时候，你知道这个人一定在。TA不是热闹时的观众，而是关键局里最后能出的那张底牌',
    rarityPct:1.98 },
  power_clash:         { id:3,  property:'rivalry',   name:'双王组合', nameEn:'Two Kings',
    quote:'我可以输给任何人，但不能输给TA',
    snapshot:'你们都是主角，站在同一个舞台上，彼此较劲也彼此成就。没有对方的时候觉得轻松，有对方的时候反而更想赢。这种关系没有反派，只有旗鼓相当的对手',
    rarityPct:2.33 },
  greatest_love:       { id:4,  property:'passion',   name:'人间挚爱', nameEn:'The Closest',
    quote:'如果偏爱有形状，大概就是TA',
    snapshot:'和TA在一起的时候，世界会自动调高一点亮度。很多人追求合适，而你们更像先遇见了喜欢。未来能不能走到最后不知道，但此刻的真心一点都不掺假',
    rarityPct:2.73 },
  soul_accomplice:     { id:5,  property:'resonator', name:'灵魂共犯', nameEn:'Soulmate',
    quote:'你负责开口，我负责递刀',
    snapshot:'你们的脑回路像共用一个云盘。刚准备吐槽，TA已经替你骂完；刚想发消息，TA已经发来了。外人觉得你们神同步，你们觉得只是正常发挥',
    rarityPct:2.80 },
  money_partners:      { id:6,  property:'companion', name:'搞钱拍档', nameEn:'Partner',
    quote:'感情归感情，发财更重要',
    snapshot:'你们最大的共同语言叫目标。聊理想可以，聊规划更可以。别人聚会谈八卦，你们聚会谈项目。不是没有感情，只是把未来看得更重要',
    rarityPct:3.44 },
  better_with_time:    { id:7,  property:'companion', name:'越陈越香', nameEn:'Old Friend',
    quote:'时间没冲淡关系，反而酿出了味道',
    snapshot:'你们的关系不像烟花，更像老酒。刚开始不算惊艳，但越相处越舒服。很多人陪你一程，而TA属于那种回头看时还在的人',
    rarityPct:5.86 },
  another_me:          { id:8,  property:'growth',    name:'另一个我', nameEn:'Twins',
    quote:'最懂我的人，活成了另一个版本的我',
    snapshot:'你们像两面镜子，照出了彼此相似的部分。很多时候甚至能预测对方下一句话。相处久了会发现，原来理解一个人可以这么轻松',
    rarityPct:11.18 },
  destined_partner:    { id:9,  property:'growth',    name:'天选搭子', nameEn:'Companion',
    quote:'世界这么大，偏偏和你最顺路',
    snapshot:'无论是工作、学习还是生活，总能莫名其妙凑到一起。很多关系需要经营，而你们像自带匹配机制。一起做什么不重要，重要的是和谁一起',
    rarityPct:14.95 },
  right_beside_you:    { id:10, property:'companion', name:'老夫老妻', nameEn:'Family',
    quote:'没有惊天动地，只是刚好一路',
    snapshot:'你们不是最特别的关系，却是最常见也最舒服的关系。没有太多戏剧性，没有太多波澜。只是走着走着发现，彼此已经陪伴了很长一段路',
    rarityPct:15.40 },
  certified_fool:      { id:11, property:'passion',   name:'欢喜冤家', nameEn:'Frenemy',
    quote:'嘴上说算了，心里说再试试',
    snapshot:'你们总能精准踩中彼此雷区，然后又莫名其妙和好。上一秒想拉黑，下一秒在刷新聊天框。别人看不懂，你们自己也看不懂，但就是舍不得彻底退出游戏',
    rarityPct:17.51 },
  former_path:         { id:12, property:'rivalry',   name:'昨日同路', nameEn:'Ex-friend',
    quote:'我懂你的路，只是不再陪你走了',
    snapshot:'你们曾经站在同一个起点，也拥有相似的目标。后来方向慢慢改变，没有争吵，没有背叛，只是走着走着，发现彼此已经去了不同的远方',
    rarityPct:21.41 },
};

// ===== v3.1: 性别换肤表（12型 × 3性别列 × 投资度方向） =====
// 格式: GENDER_VARIANTS[spec][genderColumn] → { name, nameEn, ...投资度方向 → image }
// 投资度仅 drain_relation 有方向区分；其余类型男女同一张图
// image 字段为 crush_XXX，对应云存储 crush_XXX.png
const GENDER_VARIANTS = {
  drain_relation: {
    '男女': { name:'求而不得', nameEn:'',
      男多: 'crush_001', 女多: 'crush_002' },
    '男男': { name:'镜花水月', nameEn:'', image: 'crush_003' },
    '女女': { name:'雾里看花', nameEn:'', image: 'crush_004' },
  },
  last_card: {
    '男女': { name:'最后相守', nameEn:'', image: 'crush_005' },
    '男男': { name:'最后底牌', nameEn:'', image: 'crush_006' },
    '女女': { name:'最后联盟', nameEn:'', image: 'crush_007' },
  },
  power_clash: {
    '男女': { name:'国王皇后', nameEn:'', image: 'crush_008' },
    '男男': { name:'双王组合', nameEn:'', image: 'crush_009' },
    '女女': { name:'双后组合', nameEn:'', image: 'crush_010' },
  },
  greatest_love: {
    '男女': { name:'人间挚爱', nameEn:'', image: 'crush_011' },
    '男男': { name:'最强死党', nameEn:'', image: 'crush_012' },
    '女女': { name:'最强闺蜜', nameEn:'', image: 'crush_013' },
  },
  soul_accomplice: {
    '男女': { name:'灵魂共犯', nameEn:'', image: 'crush_014' },
    '男男': { name:'灵魂兄弟', nameEn:'', image: 'crush_015' },
    '女女': { name:'灵魂姐妹', nameEn:'', image: 'crush_016' },
  },
  money_partners: {
    '男女': { name:'搞钱拍档', nameEn:'', image: 'crush_017' },
    '男男': { name:'搞钱兄弟', nameEn:'', image: 'crush_018' },
    '女女': { name:'搞钱姐妹', nameEn:'', image: 'crush_019' },
  },
  better_with_time: {
    '男女': { name:'陈年老友', nameEn:'', image: 'crush_020' },
    '男男': { name:'陈年兄弟', nameEn:'', image: 'crush_021' },
    '女女': { name:'陈年姐妹', nameEn:'', image: 'crush_022' },
  },
  another_me: {
    '男女': { name:'镜像性转', nameEn:'', image: 'crush_023' },
    '男男': { name:'镜像兄弟', nameEn:'', image: 'crush_024' },
    '女女': { name:'镜像姐妹', nameEn:'', image: 'crush_025' },
  },
  destined_partner: {
    '男女': { name:'天作之合', nameEn:'', image: 'crush_026' },
    '男男': { name:'搭子兄弟', nameEn:'', image: 'crush_027' },
    '女女': { name:'搭子姐妹', nameEn:'', image: 'crush_028' },
  },
  right_beside_you: {
    '男女': { name:'老夫老妻', nameEn:'', image: 'crush_029' },
    '男男': { name:'至亲兄弟', nameEn:'', image: 'crush_030' },
    '女女': { name:'至亲姐妹', nameEn:'', image: 'crush_031' },
  },
  certified_fool: {
    '男女': { name:'欢喜冤家', nameEn:'', image: 'crush_032' },
    '男男': { name:'损友兄弟', nameEn:'', image: 'crush_033' },
    '女女': { name:'损友姐妹', nameEn:'', image: 'crush_034' },
  },
  former_path: {
    '男女': { name:'昨日同路', nameEn:'', image: 'crush_035' },
    '男男': { name:'渐行渐远', nameEn:'', image: 'crush_036' },
    '女女': { name:'曾经同行', nameEn:'', image: 'crush_037' },
  },
};;

// 隐藏标签：基于 Ed + D 计算
function getHiddenTags(ed, d) {
  var tags = [];
  if (ed > 10) {
    tags.push('情绪失衡');
    if (d > 0)      tags.push('你更投入');
    else if (d < 0) tags.push('TA更投入');
  } else {
    tags.push('情绪对称');
  }
  return tags;
}

// 投资度句子：根据 Ed + D + 对方性别生成一句话
// female → 她, male → 他, 未知 → 他
function getInvestmentSentence(ed, d, friendGender) {
  var ta;
  if (friendGender === 'female') {
    ta = '她';
  } else {
    ta = '他';
  }
  if (ed <= 10) {
    return '情绪能量双双在线，旗鼓相当';
  } else if (d > 0) {
    return '在这段关系中，你的情绪浓度更高，你更在意' + ta;
  } else if (d < 0) {
    return '在这段关系中，' + ta + '的情绪浓度更高，' + ta + '更在意你';
  }
  return '';
}

// 隐藏彩蛋配置（保留旧版，后续可重设计）
const EASTER_EGGS = [];

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

  // 简单模式：算分判型（45%~55%→X 融合）
  // 全面一致：相等时取左侧字母以避免判 X 回退的错位
  judgeDimension: function(group1Percent, group2Percent, letter1, letter2) {
    var mainLetter = group1Percent >= group2Percent ? letter1 : letter2;
    var mainPercent = group1Percent >= group2Percent ? group1Percent : group2Percent;

    if (mainPercent >= 45 && mainPercent <= 55) {
      return 'X';
    }

    return mainLetter;
  },

  // 简单模式：判定最终人格类型（荣格/地狱模式共用判型逻辑）
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

  // ===== 简单模式 v2（24题 Likert 量表）=====
  // 选项: 非常不同意=1, 比较不同意=2, 比较同意=3, 非常同意=4
  // 总分范围 4~24，14 为中线
  // >14 → 前字母（I/S/T/J），<14 → 后字母（E/N/F/P），=14 → 偏向温和侧

  // 单题得分：answerIndex 0=A/非常不同意 → 1分，1=B/比较不同意 → 2分，2=C/比较同意 → 4分，3=D/非常同意 → 5分
  getSimpleV2Score: function(answerIndex) {
    var map = [1, 2, 4, 5];
    return map[answerIndex] || 1;
  },

  // 计算 4 个维度的原始累加分（I, S, T, J，处理 reverse）
  getSimpleV2DimensionScores: function(scenariosList, answerIndices) {
    const scores = { I: 0, S: 0, T: 0, J: 0 };
    scenariosList.forEach((q, idx) => {
      const answerIndex = answerIndices[idx];
      if (answerIndex >= 0 && answerIndex <= 3) {
        var map = [1, 2, 4, 5];
        let raw = map[answerIndex];
        if (q.reverse) {
          var revMap = [5, 4, 2, 1];
          raw = revMap[answerIndex];
        }
        scores[q.dimension] += raw;
      }
    });
    return scores;
  },

  // 将 4 维度分(6-30)转换为 8 字母 raw_scores(0-15)
  convertSimpleV2ToRawScores: function(dimScores) {
    const iScore = dimScores.I || 18;
    const sScore = dimScores.S || 18;
    const tScore = dimScores.T || 18;
    const jScore = dimScores.J || 18;

    // 线性映射: 6→0, 18→7, 30→15
    const iRaw = Math.round(((iScore - 6) / 24) * 15);
    const sRaw = Math.round(((sScore - 6) / 24) * 15);
    const tRaw = Math.round(((tScore - 6) / 24) * 15);
    const jRaw = Math.round(((jScore - 6) / 24) * 15);

    // 配对维度 = 15 - 正向维度
    return {
      E: 15 - iRaw,
      I: iRaw,
      S: sRaw,
      N: 15 - sRaw,
      T: tRaw,
      F: 15 - tRaw,
      J: jRaw,
      P: 15 - jRaw
    };
  },

  // 简单模式 v2 判型：基于 4 维度分(6-30)，18 为中线
  determineSimpleV2Personality: function(dimScores) {
    const first = (dimScores.I || 18) > 18 ? 'I' : 'E';
    const second = (dimScores.S || 18) > 18 ? 'S' : 'N';
    const third = (dimScores.T || 18) > 18 ? 'T' : 'F';
    const fourth = (dimScores.J || 18) > 18 ? 'J' : 'P';
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
        // 微量随机抖动，防止所有维度分数完全相同（±0.15范围，对总分影响<1%）
        point += (Math.random() - 0.5) * 0.3;
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

  // 地狱模式判型（与荣格模式一致的判型逻辑）
  determinePersonality: function(rawScores) {
    const THRESHOLD_LOW = 45;
    const THRESHOLD_HIGH = 55;
    let personality = '';

    const determineLetter = (leftScore, rightScore, leftLetter, rightLetter) => {
      const total = leftScore + rightScore;
      if (total > 0) {
        const leftPercent = Math.round((leftScore / total) * 100);
        const rightPercent = Math.round((rightScore / total) * 100);

        let mainLetter = leftPercent >= rightPercent ? leftLetter : rightLetter;
        let mainPercent = leftPercent >= rightPercent ? leftPercent : rightPercent;

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
      { key: 'EI', left: 'E', right: 'I' },
      { key: 'SN', left: 'S', right: 'N' },
      { key: 'TF', left: 'T', right: 'F' },
      { key: 'JP', left: 'J', right: 'P' }
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
          from: previousLetter,
          to: currentLetter,
          level: 'high',
          scoreChange: diffChange
        });
      } else if (diffChange >= 10) {
        changes.push({
          type: 'significant',
          dimension: dim.key,
          direction: currentLeft >= currentRight ? dim.left : dim.right,
          currentLetter: currentLetter,
          level: 'medium',
          scoreChange: diffChange
        });
      } else if (diffChange >= 5) {
        changes.push({
          type: 'moderate',
          dimension: dim.key,
          direction: currentLeft >= currentRight ? dim.left : dim.right,
          currentLetter: currentLetter,
          level: 'low',
          scoreChange: diffChange
        });
      } else if (currentLetter === 'X') {
        changes.push({
          type: 'stable',
          dimension: dim.key,
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

      const messages = [
        `黑化预警！检测到维度发生变化，${flipDescriptions.join('，')}。人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`,
        `黑化预警！${flipDescriptions.join('，')}。人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`,
        `黑化预警！检测到维度反转，${flipDescriptions.join('，')}。人格变化通常反映了生活状态的改变，试着接纳这种转变，它可能是成长的信号。`
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

  // ===== Relationship Atlas v1.0: 个人属性 =====
  _calcEmotion: function(pct) {
    var f = Number(pct.F) || 50, e = Number(pct.E) || 50;
    return Math.round(f * 0.6 + e * 0.4);
  },
  _calcConflict: function(pct) {
    var t = Number(pct.T) || 50, j = Number(pct.J) || 50;
    return Math.round(t * 0.5 + j * 0.5);
  },
  _calcTempo: function(pct) {
    var e = Number(pct.E) || 50, p = Number(pct.P) || 50;
    return Math.round(e * 0.5 + p * 0.5);
  },

  // ===== Relationship Atlas v1.0: 六维关系计算 =====
  _calcRCET: function(aP, bP) {
    var eD = Math.abs((Number(aP.E)||50) - (Number(bP.E)||50));
    var sD = Math.abs((Number(aP.S)||50) - (Number(bP.S)||50));
    var tD = Math.abs((Number(aP.T)||50) - (Number(bP.T)||50));
    var jD = Math.abs((Number(aP.J)||50) - (Number(bP.J)||50));
    var R = Math.round(100 - (eD*0.25 + sD*0.35 + tD*0.25 + jD*0.15));
    var baseC = Math.round((this._calcConflict(aP) + this._calcConflict(bP)) / 2);
    var C = Math.round(baseC + (100 - R) * 0.25);
    var E = Math.round((this._calcEmotion(aP) + this._calcEmotion(bP)) / 2);
    var T = Math.round(100 - Math.abs(this._calcTempo(aP) - this._calcTempo(bP)));
    var Ed = Math.abs(this._calcEmotion(aP) - this._calcEmotion(bP));
    var D = this._calcEmotion(aP) - this._calcEmotion(bP);
    return { R: R, C: C, E: E, T: T, Ed: Ed, D: D };
  },

	  // ===== v3.0: 12型六大属性判定 =====
	  _propertyClassify: function(rc) {
	    var R = rc.R, C = rc.C, E = rc.E, T = rc.T, Ed = rc.Ed;
	    if (R >= 82 && C < 45) return 'resonator';       // 共鸣
	    if (E >= 58 && R >= 50 && C < 72) return 'passion'; // 热爱
	    if (C >= 68 && R >= 48) return 'rivalry';         // 竞争
	    if (R >= 65 && T >= 75 && C < 68) return 'growth'; // 成长
	    if (C >= 68 && R < 58 && Ed >= 18) return 'drain'; // 遗憾
	    return 'companion';                               // 伙伴（兜底）
	  },

	  // ===== v3.0: 12型细分类器 =====
	  _classify36: function(rc, aP, bP, property) {
	    var R = rc.R, C = rc.C, E = rc.E, T = rc.T, Ed = rc.Ed;

	    // 共鸣 (2型)
	    if (property === 'resonator') {
	      if (E >= 48 && T >= 82) return 'soul_accomplice';
	      return 'last_card';
	    }

	    // 热爱 (2型)
	    if (property === 'passion') {
	      if (R >= 78 && T >= 85) return 'greatest_love';
	      return 'certified_fool';
	    }

	    // 竞争 (2型)
	    if (property === 'rivalry') {
	      if (R >= 72 && E >= 48) return 'power_clash';
	      return 'former_path';
	    }

	    // 成长 (2型)
	    if (property === 'growth') {
	      if (R >= 78) return 'another_me';
	      return 'destined_partner';
	    }

	    // 遗憾 (1型)
	    if (property === 'drain') return 'drain_relation';

	    // 伙伴 (3型，兜底)
	    if (T >= 76 && E < 48) return 'money_partners';
	    if (T >= 60 && E >= 50 && C < 65) return 'better_with_time';
	    return 'right_beside_you';
	  },


  // ===== v3.1: 性别换肤 + 投资度路由 =====
  // 返回 { name, nameEn, imageKey } 其中 imageKey 已考虑投资度方向
  _resolveGenderVariant: function(spec, genderColumn, D) {
    var table = GENDER_VARIANTS[spec];
    if (!table) {
      // spec 不在表中 → 用 RELATION_TYPES 兜底
      var fallback = RELATION_TYPES[spec] || null;
      return fallback ? { name: fallback.name, nameEn: fallback.nameEn, imageKey: null } : null;
    }
    var col = table[genderColumn];
    if (!col) {
      // 性别列无数据 → 取表中第一个可用列兜底
      var keys = Object.keys(table);
      col = table[keys[0]];
    }

    var imageKey = null;
    // drain_relation 有投资度方向（男多/女多），其余类型统一 .image
    if (D > 0) {
      imageKey = col['男多'] || col.image || null;
    } else if (D < 0) {
      imageKey = col['女多'] || col.image || null;
    } else {
      imageKey = col.image || col['男多'] || col['女多'] || null;
    }

    return {
      name: col.name,
      nameEn: col.nameEn,
      imageKey: imageKey
    };
  },

  // ===== v3.1: 主入口 =====
  calculateRelationshipMatch: function(uA, uB, opts) {
    try {
      var aP = uA.percentages || uA.rawScores || uA.raw_scores || {};
      var bP = uB.percentages || uB.rawScores || uB.raw_scores || {};
      var typeA = uA.personality || '';
      var typeB = uB.personality || '';

      // Phase 0: 官配查询
      var officialPair = this._lookupOfficialPair(typeA, typeB);
      var isOfficial = !!officialPair;

      // Phase 1: 官配修正因子
      var aP_adj = {}, bP_adj = {};
      ['E','I','S','N','T','F','J','P'].forEach(function(k) {
        aP_adj[k] = Number(aP[k]) || 50;
        bP_adj[k] = Number(bP[k]) || 50;
        if (isOfficial) {
          var diff = Math.abs(aP_adj[k] - bP_adj[k]);
          var reduceBy = Math.round(diff * 0.2);
          if (aP_adj[k] > bP_adj[k]) {
            aP_adj[k] = Math.max(0, aP_adj[k] - Math.round(reduceBy / 2));
            bP_adj[k] = Math.min(100, bP_adj[k] + Math.round(reduceBy / 2));
          } else {
            aP_adj[k] = Math.min(100, aP_adj[k] + Math.round(reduceBy / 2));
            bP_adj[k] = Math.max(0, bP_adj[k] - Math.round(reduceBy / 2));
          }
          if (k === 'F') {
            aP_adj[k] = Math.min(100, aP_adj[k] + 5);
            bP_adj[k] = Math.min(100, bP_adj[k] + 5);
          }
        }
      });

      // Phase 2: 计算六维关系
      var rc = this._calcRCET(aP_adj, bP_adj);

      // Phase 3: 六大属性判定
      var property = this._propertyClassify(rc);

      // Phase 4: 12型细分
      var spec = this._classify36(rc, aP_adj, bP_adj, property);
      var typeInfo = RELATION_TYPES[spec] || RELATION_TYPES['right_beside_you'];

      // Phase 5: 性别列 + 投资度方向
      var gc = this._getGenderColumn(uA.gender, uB.gender);
      var variant = this._resolveGenderVariant(spec, gc, rc.D);
      var displayName = (variant && variant.name) || typeInfo.name;
      var displayNameEn = (variant && variant.nameEn) || typeInfo.nameEn;
      var imageKey = (variant && variant.imageKey) || null;

      // Phase 6: 隐藏标签 + 投资度句子
      var hiddenTags = getHiddenTags(rc.Ed, rc.D);
      var investmentSentence = getInvestmentSentence(rc.Ed, rc.D, uB.gender);
      var propLabel = PROPERTY_LABELS[property] || PROPERTY_LABELS['companion'];

      // Phase 7: 组装返回
      // 稀有度直接使用 typeInfo.rarityPct
      return {
        level: property,
        levelName: displayName,
        levelNameEn: displayNameEn,
        rarity: '全球仅 ' + (typeInfo.rarityPct || 1) + '%',
        rarityColor: typeInfo.rarityPct < 5 ? '#FA325A' : '#95A5A6',
        rcet: { R: rc.R, C: rc.C, E: rc.E, T: rc.T, Ed: rc.Ed, D: rc.D },
        soulQuote: typeInfo.quote || '',
        snapshot: typeInfo.snapshot || '',
        keywords: [],
        scene: '',
        typicalPairs: [],
        officialPair: officialPair || null,
        isOfficial: isOfficial,
        matchScore: Math.round(rc.R),
        relationName: displayName,
        description: '',
        color: propLabel.emoji,
        rawM: (rc.R / 100) * 2 - 1,
        xCount: 0,
        validCount: 4,
        isCoupleContext: false,
        genderColumn: gc,
        _dbKey: spec,
        imageKey: imageKey,
        occupation: property,
        occupationLabel: propLabel.tag,
        gameClass: '',
        spec: spec,
        property: property,
        propertyName: propLabel.tag,
        typeId: typeInfo.id,
        hiddenTags: hiddenTags,
        investmentSentence: investmentSentence,
      };
    } catch (e) {
      console.error('calculateRelationshipMatch error:', e);
      return {
        level: 'companion', levelName: '老夫老妻', levelNameEn: 'Family',
        rarity: '', rarityColor: '',
        rcet: { R: 50, C: 50, E: 50, T: 50, Ed: 0, D: 0 },
        soulQuote: '', snapshot: '', keywords: [], scene: '', typicalPairs: [],
        officialPair: null, isOfficial: false, matchScore: 50, relationName: '老夫老妻',
        description: '', color: '',
        rawM: 0, xCount: 0, validCount: 4,
        isCoupleContext: false, genderColumn: '男女', _dbKey: 'right_beside_you',
        imageKey: null,
        occupation: 'companion', occupationLabel: '伙伴',
        gameClass: '', spec: 'right_beside_you',
        property: 'companion', propertyName: '伙伴', typeId: 10,
        hiddenTags: ['情绪对称'], investmentSentence: '情绪能量双双在线，旗鼓相当',
      };
    }
  },

  // ===== 保留函数（不依赖旧常量） =====
  _getGenderColumn: function(aGender, bGender) {
    // 性别只分生理性别 male/female，未知或缺失则抛出明确提示
    if (!aGender || !bGender) {
      console.warn('[scoring] _getGenderColumn: 缺少性别数据，默认按男女处理');
      return '男女';
    }
    if (aGender === 'female' && bGender === 'female') return '女女';
    if (aGender === 'male' && bGender === 'male') return '男男';
    return '男女';
  },

  _lookupOfficialPair: function(personalityA, personalityB) {
    if (!personalityA || !personalityB) return null;
    var cleanedA = personalityA.toUpperCase();
    var cleanedB = personalityB.toUpperCase();
    var pair = officialPairs[cleanedA];
    if (pair && pair.code === cleanedB) {
      return { name: pair.name, intro: pair.intro || '' };
    }
    var pairB = officialPairs[cleanedB];
    if (pairB && pairB.code === cleanedA) {
      return { name: pairB.name, intro: pairB.intro || '' };
    }
    return null;
  },
};

export default scoring;
