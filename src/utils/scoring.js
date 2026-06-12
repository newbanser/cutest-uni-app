import scenarios from '../data/scenarios.js';
import simpleScenarios from '../data/simple-scenarios.js';
import officialPairs from '../data/officialPairs.js';

const STORAGE_KEY = 'scenarioHistory';
const MAX_HISTORY_COUNT = 5;

// ===== 新关系等级体系常量 =====
const LEVEL_MAP = {
  LV5: { label: 'LV5', rarity: 'SSR', color: '#FFD700', emoji: '🔥' },
  LV4: { label: 'LV4', rarity: 'SR',  color: '#9B59B6', emoji: '🧠' },
  LV3: { label: 'LV3', rarity: 'R',   color: '#3498DB', emoji: '🤝' },
  LV2: { label: 'LV2', rarity: 'N',   color: '#95A5A6', emoji: '👋' },
  LV1: { label: 'LV1', rarity: 'F',   color: '#95A5A6', emoji: '💀' },
  EGG: { label: '隐藏', rarity: '隐藏', color: '#FA325A', emoji: '🎁' },
};

// 5级×4列关系名
const RELATION_NAMES = {
  LV5: { '通用': '伯牙子期', '男女': '天生情侣', '男男': '父子', '女女': '母女' },
  LV4: { '通用': '世另我',   '男女': '睡过的人', '男男': '亲兄弟', '女女': '好闺蜜' },
  LV3: { '通用': '合伙人',   '男女': '夜店情人', '男男': '酒友',   '女女': '酒友' },
  LV2: { '通用': '桃园结义', '男女': '桃园结义', '男男': '桃园结义', '女女': '桃园结义' },
  LV1: { '通用': '微信好友', '男女': '微信好友', '男男': '微信好友', '女女': '微信好友' },
};

// 第一屏内容素材
const FIRST_SCREEN_CONTENT = {
  LV5: {
    '通用': { quote: '"你俩上辈子可能是同一个人"', snapshot: '你们之间几乎没有信息差。\n你一张嘴TA就知道你要说什么。\n你还没生气TA就开始哄了。\n这种默契不是培养出来的，是出厂设置就写好的。', keywords: ['默契','同步','知音','双生'] },
    '男女': { quote: '"月老拿钢筋给你们绑的红线"', snapshot: '你们是那种"在一起不用说话也不尴尬"的关系。\n你抛的梗TA能接，TA的沉默你能懂。\n吵架吵到一半两个人都忘了在吵什么。\n不是什么轰轰烈烈的爱情，但谁也离不开谁。', keywords: ['般配','舒适','长久','宿命'] },
    '男男': { quote: '"除了血缘关系，这是最铁的"', snapshot: '他可能不会说好听的话，但你需要的时候他一定在。\n他骂你是为你好，他夸你是真觉得你行。\n你们之间没有那么多客套，有事说事，没事各忙各的。\n但这种关系，比很多整天腻在一起的朋友都牢靠。', keywords: ['兄弟','可靠','硬核','无言'] },
    '女女': { quote: '"比闺蜜更深一层——是家人"', snapshot: '她是那个你半夜三点打电话也会接的人。\n你哭的时候她不一定会哄你，但她会陪着你哭完。\n你们吵过架、冷战过、互相拉黑过——\n但只要你说"我需要你"，她永远在。', keywords: ['羁绊','包容','无条件的','家'] },
  },
  LV4: {
    '通用': { quote: '"你在TA身上看到了自己"', snapshot: '你们的成长路径可能不同，但终点是一样的。\n对同一件事的看法经常惊人地一致。\n你刚想说"我想吃火锅"，TA已经拿起外套了。\n不是刻意同步，是脑子长得一样。', keywords: ['镜面','同频','理解','自在'] },
    '男女': { quote: '"你懂我深浅，我懂你长短"', snapshot: '你们之间该懂的都懂了。\n没有那么多弯弯绕绕，说话不用打草稿。\n在一起的时候是两个人，分开的时候是两个独立的人。\n这种关系最舒服的地方就是——不用装。', keywords: ['坦诚','自在','亲密','放松'] },
    '男男': { quote: '"不是亲的，但胜似亲的"', snapshot: '一起扛过事、一起喝过酒、一起骂过老板。\n你借钱不用打借条，他借你的车不用问。\n平时可能几个月不联系，但一个电话就到。\n男人之间的友谊就是这么简单。', keywords: ['义气','信任','简单','长久'] },
    '女女': { quote: '"上厕所都要手拉手的那种"', snapshot: '你们的聊天记录从上往下翻全是哈哈哈哈。\n一起骂过同一个男人，一起夸过同一件衣服。\n她知道你所有的秘密，包括你不想让别人知道的那种。\n你谈对象第一个要过她的关。', keywords: ['亲密','无话不说','陪伴','共享'] },
  },
  LV3: {
    '通用': { quote: '"在一起能做事的，不止是朋友"', snapshot: '你们的关系建立在"能一起成事"的基础上。\n各有所长，互相信任，配合默契。\n私下不一定经常约饭，但工作上是最佳搭档。\n这种关系比朋友更务实，比同事更信任。', keywords: ['合作','信任','高效','务实'] },
    '男女': { quote: '"有感觉，但不一定有未来"', snapshot: '你们的暧昧写在脸上。\n晚上一起疯的时候是真的开心。\n但天亮之后，你们都知道这段关系没有结果。\n不过没关系——当下的快乐也是快乐。', keywords: ['暧昧','热烈','短暂','尽兴'] },
    '男男': { quote: '"能一起喝到天亮的那种"', snapshot: '你们的共同语言是杯酒。\n开心了喝，不开心了也喝。\n喝多了什么都能聊——平时不会说的话，酒桌上全说了。\n第二天谁都不提，但关系又近了一点。', keywords: ['兄弟','痛快','真实','解压'] },
    '女女': { quote: '"能一起喝到天亮的那种"', snapshot: '你们的局从来不用客套。\n"出来喝一杯"＝"我有话想跟你说"。\n微醺的时候说的那些话，比清醒的时候真诚一百倍。\n第二天互相发消息："昨晚我没说什么不该说的吧？"', keywords: ['闺蜜','微醺','交心','解压'] },
  },
  LV2: {
    '通用': { quote: '"刘关张看了都得说好"', snapshot: '你们的关系有仪式感。\n不一定天天见面，但见面了就是兄弟。\n你的事就是我的事——这句话不是说着玩的。\n这种关系不求多，有那么一两个就够了。', keywords: ['义气','承诺','可靠','长久'] },
    '男女': { quote: '"刘关张看了都得说好"', snapshot: '你们的友情不带任何暧昧。\n就是单纯觉得这个人靠谱、值得交。\n有事互相撑，没事各自忙。\n这种纯粹的信任，比很多关系都难得。', keywords: ['纯粹','信任','坦荡','仗义'] },
    '男男': { quote: '"刘关张看了都得说好"', snapshot: '你们的兄弟情是喝出来的，也是一起扛事扛出来的。\n平时各忙各的，但只要兄弟开口——\n没有第二句话，先帮了再说。\n男人的友情就是这么简单粗暴。', keywords: ['兄弟','义气','扛事','简单'] },
    '女女': { quote: '"刘关张看了都得说好"', snapshot: '你们的友情不玩虚的。\n你被欺负了她是第一个冲上去的人。\n你成功了她是真心为你高兴的人。\n女人之间的义气，不比男人差。', keywords: ['义气','担当','真诚','守护'] },
  },
  LV1: {
    '通用': { quote: '"列表好友，聊天记录为空的"', snapshot: '你们加了好友之后就没说过几句话。\n朋友圈偶尔点个赞，但从来没有私聊过。\n逢年过节群发的时候会想起来有这个联系人。\n说熟也不熟，说不熟…确实不太熟。', keywords: ['躺列','不熟','点赞之交','躺着'] },
    '男女': { quote: '"列表好友，聊天记录为空的"', snapshot: '不知道什么时候加的，也不知道为什么没删。\n偶尔刷到TA朋友圈，才知道TA最近在干嘛。\n想过打个招呼，但不知道说什么。\n就一直这么躺着，躺着躺着就躺了几年。', keywords: ['躺列','不熟','过客','躺平'] },
    '男男': { quote: '"列表好友，聊天记录为空的"', snapshot: '可能是以前的同学、前同事、游戏好友。\n以前还一起开黑，现在连上线时间都不重合了。\n没有删好友是因为——万一哪天又开黑呢。\n但大家都知道，那个"哪天"可能不会来了。', keywords: ['躺列','过去','淡了','怀念'] },
    '女女': { quote: '"列表好友，聊天记录为空的"', snapshot: '可能是以前很熟的朋友。\n不知道从什么时候开始就不怎么说话了。\n你还记得TA的生日，但不会像以前那样卡点发了。\n不是关系不好了，是生活把你们推到不同的方向了。', keywords: ['躺列','淡了','成长','各自安好'] },
  },
};

// 隐藏彩蛋配置（按优先级从高到低）
const EASTER_EGGS = [
  { name: '🧊 绝对零度', check: (ctx) => ctx.M === -1 && ctx.xCount === 0, rarity: '极稀有' },
  { name: '🔒 狱友',    check: (ctx) => ctx.level === 'LV1' && ctx.xCount >= 2 && !ctx.isCoupleContext, rarity: '常见' },
  { name: '🧨 炸了',    check: (ctx) => ctx.level === 'LV1' && ctx.column === '男女', rarity: '常见' },
  { name: '🎭 谜人',    check: (ctx) => ctx.xCount >= 6, rarity: '常见' },
  { name: '🫥 隐形人',  check: (ctx) => ctx.level === 'LV2' && ctx.xCount >= 2, rarity: '常见' },
  { name: '👻 查无此人', check: (ctx) => ctx.level === 'LV1' && ctx.matchCount === 1, rarity: '中等' },
  { name: '📇 已读不回', check: (ctx) => ctx.level === 'LV1' && ctx.xCount >= 1 && ctx.matchCount <= 1, rarity: '常见' },
  { name: '🔄 镜像',    check: (ctx) => ctx.M === 0 && ctx.validCount === 4, rarity: '中等' },
  { name: '🪞 雾中镜',  check: (ctx) => ctx.level === 'LV5' && ctx.xCount >= 1, rarity: '中等' },
  { name: '🃏 明牌',    check: (ctx) => ctx.genderA === 'x' && ctx.genderB === 'x', rarity: '中等' },
  { name: '🗿 石像',    check: (ctx) => ctx.level === 'LV1' && ctx.xCount === 0, rarity: '中等' },
  { name: '🤝 塑料',    check: (ctx) => ctx.level === 'LV5' && ctx.column === '男女' && ctx.matchCount === 1, rarity: '中等' },
  { name: '🌊 起伏',    check: (ctx) => ctx.matchCount >= 2 && false, rarity: '中等' },  // 需外部判断，默认false
  { name: '🐉 龙与凤',  check: (ctx) => ctx.level === 'LV5' && ctx.column === '男女' && ctx.xCount >= 4, rarity: '极稀有' },
  { name: '🎰 薛定谔',  check: (ctx) => false, rarity: '极稀有' },  // 需三次不同等级，需外部判断
  { name: '⏳ 老友记',  check: (ctx) => false, rarity: '极稀有' },  // 需同人5次，需外部判断
];

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

  // ===== 关系匹配算法 v2 =====
  // userAData / userBData 应包含 {percentages: {E,I,S,N,T,F,J,P}, gender}
  // opts: { matchCount: number } 可选，传入和同一个人匹配的次数用于隐藏彩蛋
  calculateRelationshipMatch: function(userAData, userBData, opts = {}) {
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

      // 3. 性别列判定
      const genderColumn = this._getGenderColumn(userAData.gender, userBData.gender);

      // 4. 情侣语境
      const isCoupleContext = this._isCoupleContext(M, userAData.gender, userBData.gender);

      // 5. 情侣语境微调加分（+0.05，不越级）
      if (isCoupleContext) {
        M = Math.min(M + 0.05, 0.95);
      }

      // 6. 判定等级（新5级）
      const level = this._determineLevel(M, xCount, validCount);
      const levelConfig = LEVEL_MAP[level] || LEVEL_MAP.LV1;

      // 7. 检查隐藏彩蛋（优先于关系名）
      const eggCtx = {
        M, xCount, validCount, level,
        column: genderColumn,
        genderA: userAData.gender,
        genderB: userBData.gender,
        isCoupleContext,
        matchCount: opts.matchCount || 1,
        personalityA: userAData.personality || '',
        personalityB: userBData.personality || '',
      };
      const easterEgg = this._checkEasterEgg(eggCtx);

      // 8. 如果触发隐藏彩蛋，覆盖关系名
      let finalName = '';
      let finalRarity = levelConfig.rarity;
      let finalColor = levelConfig.color;

      if (easterEgg) {
        finalName = easterEgg.name;
        finalRarity = easterEgg.rarity;
        finalColor = '#FA325A';
      } else {
        finalName = RELATION_NAMES[level]?.[genderColumn] || '未知关系';
      }

      // 9. 第一屏内容
      const screenContent = FIRST_SCREEN_CONTENT[level]?.[genderColumn] || FIRST_SCREEN_CONTENT.LV1?.['通用'] || {};

      // 10. 查询官配信息
      const officialPair = this._lookupOfficialPair(userAData.personality, userBData.personality);

      // 11. 降级颜色（xCount ≥ 4 时稀有度降一级）
      const downgraded = xCount >= 4;

      return {
        // ===== 新字段（结果页使用） =====
        level: level,
        levelLabel: levelConfig.label,
        levelName: finalName,
        rarity: downgraded ? this._downgradeRarity(finalRarity) : finalRarity,
        rarityColor: downgraded ? this._downgradeColor(finalColor) : finalColor,

        // ===== 第一屏内容 =====
        soulQuote: screenContent.quote || '',
        snapshot: screenContent.snapshot || '',
        keywords: screenContent.keywords || [],

        // ===== 隐藏彩蛋 =====
        easterEgg: easterEgg ? {
          name: easterEgg.name,
          rarity: easterEgg.rarity,
          color: '#FA325A'
        } : null,

        // ===== 官配信息 =====
        officialPair: officialPair,

        // ===== 原始数据 =====
        matchScore: Math.round((M + 1) * 50),
        rawM: M,
        xCount: xCount,
        validCount: validCount,
        isCoupleContext: isCoupleContext,
        genderColumn: genderColumn,

        // ===== 兼容旧字段（history.vue等仍使用） =====
        relationName: finalName,
        color: downgraded ? '⚪' : levelConfig.emoji,
        description: screenContent.snapshot?.replace(/\n/g, '') || '',
      };
    } catch (error) {
      console.error('计算关系匹配失败:', error);
      return {
        level: 'LV2',
        levelLabel: 'LV2',
        levelName: '微信好友',
        rarity: 'N',
        rarityColor: '#95A5A6',
        soulQuote: '',
        snapshot: '',
        keywords: [],
        easterEgg: null,
        officialPair: null,
        matchScore: 50,
        rawM: 0,
        xCount: 0,
        validCount: 0,
        isCoupleContext: false,
        genderColumn: '通用',
        relationName: '微信好友',
        color: '👋',
        description: '',
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

  _getGenderColumn: function(aGender, bGender) {
    if (!aGender || !bGender || aGender === 'x' || bGender === 'x') return '通用';
    if (aGender !== bGender) return '男女';
    if (aGender === 'male') return '男男';
    if (aGender === 'female') return '女女';
    return '通用';
  },

  _isCoupleContext: function(M, aGender, bGender) {
    return M >= 0.9 && aGender && bGender && aGender !== bGender;
  },

  _determineLevel: function(M, xCount, validCount) {
    if (validCount === 0) return 'LV2';

    if (M >= 0.9) {
      return xCount <= 1 ? 'LV5' : 'LV4';
    } else if (M >= 0.7) {
      return 'LV4';
    } else if (M >= 0.3) {
      return 'LV3';
    } else if (M >= -0.4) {
      return 'LV2';
    } else {
      return 'LV1';
    }
  },

  _checkEasterEgg: function(ctx) {
    for (const egg of EASTER_EGGS) {
      try {
        if (egg.check(ctx)) return egg;
      } catch (e) {
        continue;
      }
    }
    return null;
  },

  _lookupOfficialPair: function(personalityA, personalityB) {
    if (!personalityA || !personalityB) return null;
    const cleanedA = personalityA.toUpperCase();
    const cleanedB = personalityB.toUpperCase();
    // 双向查找
    const pair = officialPairs[cleanedA];
    if (pair && pair.code === cleanedB) {
      return { name: pair.name, intro: pair.intro || '' };
    }
    const pairB = officialPairs[cleanedB];
    if (pairB && pairB.code === cleanedA) {
      return { name: pairB.name, intro: pairB.intro || '' };
    }
    return null;
  },

  _downgradeRarity: function(rarity) {
    const map = { 'SSR': 'SR', 'SR': 'R', 'R': 'N', 'N': 'F', 'F': 'F' };
    return map[rarity] || 'N';
  },

  _downgradeColor: function(color) {
    const map = { '#FFD700': '#9B59B6', '#9B59B6': '#3498DB', '#3498DB': '#95A5A6', '#95A5A6': '#95A5A6' };
    return map[color] || '#95A5A6';
  },

  // 旧记录迁移兼容：将旧等级映射到新等级的新名字
  // 用于 history.vue 和 crush-result.vue 展示旧匹配记录
  migrateLegacyMatchData: function(oldMatchData, genderColumn) {
    if (!oldMatchData) return null;
    const col = genderColumn || '通用';
    const oldLevel = oldMatchData.level || '';
    const oldName = oldMatchData.relationName || '';

    // 旧等级 → 新等级
    const legacyLevelMap = {
      'S': 'LV5', 'C1': 'LV4', 'C2': 'LV4', 'C3': 'LV3',
      'M1': 'LV3', 'B': 'LV2', 'M2': 'LV2', 'A': 'LV1', 'D': 'LV1',
      'XXXX': 'LV1', 'JAIL': 'LV5',
    };
    const newLevel = legacyLevelMap[oldLevel] || 'LV2';
    const levelConfig = LEVEL_MAP[newLevel] || LEVEL_MAP.LV2;

    // 尝试从旧名推断语境列
    let column = col;
    if (col === '通用' && oldName) {
      // 根据个别旧名反向推断
      const coupleNames = ['灵魂伴侣', '老夫老妻', '欢喜冤家', '冤家情侣'];
      const maleNames = ['孪生兄弟', '死对头', '塑料兄弟'];
      const femaleNames = ['孪生姐妹', '闺蜜'];
      if (coupleNames.includes(oldName)) column = '男女';
      else if (maleNames.includes(oldName)) column = '男男';
      else if (femaleNames.includes(oldName)) column = '女女';
    }

    // 获取新名字（通用列兜底）
    const newName = RELATION_NAMES[newLevel]?.[column] || RELATION_NAMES[newLevel]?.['通用'] || oldName;
    const screenContent = FIRST_SCREEN_CONTENT[newLevel]?.[column] || FIRST_SCREEN_CONTENT[newLevel]?.['通用'] || {};

    return {
      level: newLevel,
      levelLabel: levelConfig.label,
      levelName: newName,
      rarity: levelConfig.rarity,
      rarityColor: levelConfig.color,
      soulQuote: screenContent.quote || '',
      snapshot: screenContent.snapshot || '',
      keywords: screenContent.keywords || [],
      matchScore: oldMatchData.matchScore || 50,
      relationName: newName,
      color: levelConfig.emoji,
      description: oldMatchData.description || '',
      _isMigrated: true,
    };
  },
};

export default scoring;
