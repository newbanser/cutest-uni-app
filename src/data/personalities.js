const dimensionLabels = {
  E: '外倾-E',
  I: '内倾-I',
  X: '融合-X',
  S: '实感-S',
  N: '直觉-N',
  T: '思维-T',
  F: '情感-F',
  J: '判断-J',
  P: '感知-P'
};

const campGroups = {
  'SP': { name: 'SP 黄人组', english: 'Explorers', category: '基本人格' },
  'NF': { name: 'NF 绿人组', english: 'Diplomats', category: '基本人格' },
  'SJ': { name: 'SJ 蓝人组', english: 'Sentinels', category: '基本人格' },
  'NT': { name: 'NT 紫人组', english: 'Analysts', category: '基本人格' },
  '1X': { name: '1X 异象组', english: 'Singulars', category: '特别隐藏' },
  '2X': { name: '2X 双面组', english: 'Splitters', category: '稀世隐藏' },
  '3X': { name: '3X 原型组', english: 'Primordials', category: '至臻隐藏' },
  '4X': { name: '4X 混沌组', english: 'Chaotics', category: '限定隐藏' }
};

function getCamp(code) {
  const xCount = (code.match(/X/g) || []).length;
  if (xCount === 0) {
    const second = code[1];
    const third = code[2];
    if (second === 'S' && third === 'F') return `${campGroups['SP'].category} - ${campGroups['SP'].name} ${campGroups['SP'].english}`;
    if (second === 'N' && third === 'F') return `${campGroups['NF'].category} - ${campGroups['NF'].name} ${campGroups['NF'].english}`;
    if (second === 'S' && third === 'T') return `${campGroups['SJ'].category} - ${campGroups['SJ'].name} ${campGroups['SJ'].english}`;
    if (second === 'N' && third === 'T') return `${campGroups['NT'].category} - ${campGroups['NT'].name} ${campGroups['NT'].english}`;
  } else if (xCount === 1) {
    return `${campGroups['1X'].category} - ${campGroups['1X'].name} ${campGroups['1X'].english}`;
  } else if (xCount === 2) {
    return `${campGroups['2X'].category} - ${campGroups['2X'].name} ${campGroups['2X'].english}`;
  } else if (xCount === 3) {
    return `${campGroups['3X'].category} - ${campGroups['3X'].name} ${campGroups['3X'].english}`;
  } else if (xCount === 4) {
    return `${campGroups['4X'].category} - ${campGroups['4X'].name} ${campGroups['4X'].english}`;
  }
  return '未知阵营';
}

const personalityNames = {
  ISTP: 'Virtuoso 鉴赏家', ISFP: 'Adventurer 探险家', ESTP: 'Entrepreneur 企业家', ESFP: 'Entertainer 表演者',
  INFJ: 'Advocate 提倡者', INFP: 'Mediator 调停者', ENFJ: 'Protagonist 主人公', ENFP: 'Campaigner 竞选者',
  ISTJ: 'Logistician 物流师', ISFJ: 'Defender 守卫者', ESTJ: 'Executive 总经理', ESFJ: 'Consul 执政官',
  INTJ: 'Architect 建筑师', INTP: 'Logician 逻辑学家', ENTJ: 'Commander 指挥官', ENTP: 'Debater 辩论家',
  
  XSTJ: 'Legislator 立法者', XSTP: 'Manufacturer 造物者', XSFJ: 'Benefactor 济世者', XSFP: 'Firewalker 浴火者',
  XNTJ: 'Administrator 执政者', XNTP: 'Discourser 论道者', XNFJ: 'Psalmist 唱诗者', XNFP: 'Arian 咏叹者',
  IXTJ: 'Breaker 破局者', IXTP: 'Wall-gazer 面壁者', IXFJ: 'Lamplighter 掌灯者', IXFP: 'Server 侍神者',
  EXTJ: 'Executor 行刑者', EXTP: 'Challenger 挑战者', EXFJ: 'Guardian 保卫者', EXFP: 'Dancer 欢舞者',
  ISXJ: 'Rainmaker 求雨者', ISXP: 'Windlistener 听风者', INXJ: 'Stargazer 观星者', INXP: 'Soulkeeper 修灵者',
  ESXJ: 'Beamgatherer 聚光者', ESXP: 'Sunchaser 逐日者', ENXJ: 'Wavewalker 踏浪者', ENXP: 'Preacher 布道者',
  ISTX: 'Keeper 维护者', ISFX: 'Rescuer 救护者', INTX: 'Navigator 领航者', INFX: 'Inspirer 鼓舞者',
  ESTX: 'Helmsman 掌舵者', ESFX: 'Patroller 巡逻者', ENTX: 'Pathfinder 探路者', ENFX: 'Watcher 瞭望者',
  
  XXTJ: 'Worldtamer 镇世者', XXTP: 'Ascender 飞升者', XXFJ: 'Transcender 超度者', XXFP: 'Stoic 忘情者',
  XSXJ: 'Sentinel 捍卫者', XSXP: 'Explorer 探索者', XNXJ: 'Visionary 远见者', XNXP: 'Wanderer 漫游者',
  XSTX: 'Operator 操盘手', XSFX: 'Interior 内政官', XNTX: 'Analyst 分析师', XNFX: 'Diplomat 外交家',
  IXXJ: 'Introvert 内敛者', IXXP: 'Coherent 自洽者', EXXJ: 'Skywalker 天行者', EXXP: 'Unbounded 无界者',
  IXTX: 'Thinker 沉思者', IXFX: 'Dreamspeaker 梦语者', EXTX: 'Sovereign 君临者', EXFX: 'Lethewalker 忘川者',
  ISXX: 'Sweeper 拂尘者', INXX: 'Chanter 诵经者', ESXX: 'Absolver 开释者', ENXX: 'Preacher 传教者',
  
  IXXX: 'Introvert 内倾者', EXXX: 'Extrovert 外倾者', XSXX: 'Sensor 实感者', XNXX: 'Intuitive 直觉者',
  XXTX: 'Thinker 思考者', XXFX: 'Feeler 情感者', XXXJ: 'Judger 判断者', XXXP: 'Perceiver 感知者',
  
  XXXX: 'Chaotics 未知者',
  
  unknown: 'Hello 新人你好'
};

function getName(code) {
  return personalityNames[code] || `${code} Personality`;
}

const descriptions = {
  ISTP: '冷静务实的实践者，善于解决实际问题', ISFP: '温柔敏感的艺术家，热爱生活和美好事物',
  ESTP: '精力充沛的实践者，善于把握机会', ESFP: '热情活泼的社交者，善于娱乐和表达',
  INFJ: '富有洞察力和创造力的理想主义者，追求意义和价值', INFP: '温和善良的理想主义者，致力于帮助他人',
  ENFJ: '热情有魅力的领导者，善于激励他人', ENFP: '充满热情和创造力的社交者，善于激发他人',
  ISTJ: '务实可靠的组织者，善于管理和执行', ISFJ: '温暖关怀的守护者，致力于帮助和保护他人',
  ESTJ: '高效务实的管理者，善于组织和领导', ESFJ: '热情友好的社交者，善于建立和谐的人际关系',
  INTJ: '战略家，相信万物皆可用逻辑和规划实现最优解', INTP: '充满好奇心的理论家，热衷于探索思想的边界',
  ENTJ: '天生的领导者，善于规划和执行，追求高效', ENTP: '聪明好奇的创新者，喜欢挑战传统观念',
  
  XSTJ: '制定规则的立法者，为社会建立秩序', XSTP: '创造万物的造物者，将想法变为现实',
  XSFJ: '无私奉献的济世者，帮助需要帮助的人', XSFP: '勇敢无畏的浴火者，在困境中重生',
  XNTJ: '掌控全局的执政者，引领时代发展', XNTP: '智慧深邃的论道者，探索真理的边界',
  XNFJ: '传递希望的唱诗者，用爱感化世界', XNFP: '情感丰富的咏叹者，表达内心的声音',
  IXTJ: '突破困境的破局者，开创全新局面', IXTP: '深思熟虑的面壁者，独自探索真理',
  IXFJ: '照亮前路的掌灯者，指引他人前行', IXFP: '默默奉献的侍神者，守护精神家园',
  EXTJ: '执行正义的行刑者，维护公平公正', EXTP: '挑战权威的挑战者，推动变革创新',
  EXFJ: '守护众生的保卫者，抵御外部威胁', EXFP: '自由奔放的欢舞者，享受生命美好',
  ISXJ: '呼风唤雨的求雨者，带来生机希望', ISXP: '感知自然的听风者，与天地共鸣',
  INXJ: '仰望星空的观星者，探索宇宙奥秘', INXP: '守护灵魂的修灵者，净化心灵世界',
  ESXJ: '汇聚光芒的聚光者，照亮黑暗角落', ESXP: '追逐梦想的逐日者，永不停歇前行',
  ENXJ: '乘风破浪的踏浪者，勇往直前', ENXP: '传播信念的布道者，启发他人心智',
  ISTX: '守护秩序的维护者，保持稳定和谐', ISFX: '拯救危难的救护者，给予温暖关怀',
  INTX: '引领方向的领航者，指引正确道路', INFX: '鼓舞人心的鼓舞者，激发内在潜能',
  ESTX: '掌控航向的掌舵者，引领团队前进', ESFX: '维护和平的巡逻者，保障安全稳定',
  ENTX: '开拓未知的探路者，开辟新的道路', ENFX: '守望未来的瞭望者，预见发展趋势',
  
  XXTJ: '威震天下的镇世者，维护世界平衡', XXTP: '超越凡俗的飞升者，追求更高境界',
  XXFJ: '普度众生的超度者，解脱痛苦束缚', XXFP: '超脱情感的忘情者，达到内心平静',
  XSXJ: '坚定守护的捍卫者，保护珍视之物', XSXP: '探索未知的探索者，发现新的可能',
  XNXJ: '远见卓识的远见者，洞察未来趋势', XNXP: '自由漫步的漫游者，探索生命意义',
  XSTX: '精准操控的操盘手，把握全局动向', XSFX: '治理内政的内政官，管理内部事务',
  XNTX: '深入分析的分析师，揭示事物本质', XNFX: '善于沟通的外交家，建立友好关系',
  IXXJ: '内心丰富的内敛者，专注内心世界', IXXP: '自我完善的自洽者，达到内心和谐',
  EXXJ: '翱翔天际的天行者，超越常规束缚', EXXP: '无限可能的无界者，突破所有限制',
  IXTX: '深度思考的沉思者，探寻真理本质', IXFX: '传递梦境的梦语者，连接现实与幻想',
  EXTX: '至高无上的君临者，统治一切领域', EXFX: '跨越遗忘的忘川者，超脱生死轮回',
  ISXX: '净化心灵的拂尘者，清除杂念烦恼', INXX: '虔诚祈祷的诵经者，寻求精神寄托',
  ESXX: '宽恕罪恶的开释者，给予救赎机会', ENXX: '传播信仰的传教者，引导他人向善',
  
  IXXX: '纯粹内倾的内倾者，深入探索自我', EXXX: '纯粹外倾的外倾者，积极融入世界',
  XSXX: '纯粹实感的实感者，专注现实体验', XNXX: '纯粹直觉的直觉者，探索抽象世界',
  XXTX: '纯粹思考的思考者，理性分析一切', XXFX: '纯粹情感的情感者，感受万物真情',
  XXXJ: '纯粹判断的判断者，喜欢计划有序', XXXP: '纯粹感知的感知者，享受自由随性',
  
  XXXX: '超越一切的混沌者，蕴含无限可能',
  
  unknown: '很开心看到你来，点击上方按钮立刻开始吧'
};

function getDescription(code) {
  return descriptions[code] || '具有独特特质的人格类型';
}

function getTraits(code) {
  const traitMap = {
    ISTP: ['冷静务实', '善于分析', '动手能力强', '适应性强'],
    ISFP: ['温柔敏感', '富有创意', '热爱生活', '善于感受'],
    ESTP: ['精力充沛', '善于行动', '务实灵活', '善于社交'],
    ESFP: ['热情活泼', '善于表演', '善于社交', '乐观积极'],
    INFJ: ['富有洞察力', '富有同情心', '理想主义', '善于倾听'],
    INFP: ['善良温和', '富有同情心', '理想主义', '忠诚可靠'],
    ENFJ: ['热情洋溢', '善于沟通', '富有感染力', '善于激励'],
    ENFP: ['热情开朗', '富有创意', '善于社交', '乐观积极'],
    ISTJ: ['务实可靠', '责任心强', '注重细节', '有条不紊'],
    ISFJ: ['温暖关怀', '乐于助人', '细心周到', '忠诚可靠'],
    ESTJ: ['务实高效', '善于组织', '责任心强', '果断决策'],
    ESFJ: ['热情友好', '善于社交', '乐于助人', '注重传统'],
    INTJ: ['战略思维', '独立思考', '果断坚定', '追求完美'],
    INTP: ['好奇心强', '逻辑严谨', '创新思维', '独立精神'],
    ENTJ: ['果断决策', '目标导向', '自信坚定', '善于组织'],
    ENTP: ['机智幽默', '善于辩论', '创意无限', '适应性强'],
    
    XSTJ: ['制定规则', '建立秩序', '公正严明', '责任感强'],
    XSTP: ['创造力强', '动手能力', '勇于尝试', '灵活应变'],
    XSFJ: ['无私奉献', '乐于助人', '慈悲为怀', '关怀他人'],
    XSFP: ['勇敢无畏', '坚韧不拔', '热情奔放', '自由不羁'],
    XNTJ: ['掌控全局', '远见卓识', '决策果断', '领导力强'],
    XNTP: ['智慧深邃', '善于思考', '追求真理', '思想开放'],
    XNFJ: ['传递希望', '富有爱心', '善于表达', '感化他人'],
    XNFP: ['情感丰富', '富有诗意', '内心敏感', '表达力强'],
    IXTJ: ['突破创新', '敢于挑战', '战略眼光', '执行力强'],
    IXTP: ['深思熟虑', '独立思考', '专注执着', '追求真理'],
    IXFJ: ['照亮前路', '指引他人', '富有智慧', '乐于助人'],
    IXFP: ['默默奉献', '守护精神', '内心宁静', '虔诚真挚'],
    EXTJ: ['执行正义', '维护公平', '果断坚决', '原则性强'],
    EXTP: ['挑战权威', '推动变革', '勇敢无畏', '创新思维'],
    EXFJ: ['守护众生', '保护他人', '责任感强', '勇气非凡'],
    EXFP: ['自由奔放', '享受生活', '热情洋溢', '活力四射'],
    ISXJ: ['呼风唤雨', '带来希望', '与自然和谐', '感知敏锐'],
    ISXP: ['感知自然', '与天地共鸣', '内心平静', '直觉敏锐'],
    INXJ: ['仰望星空', '探索宇宙', '富有远见', '思想深邃'],
    INXP: ['守护灵魂', '净化心灵', '内心丰富', '精神追求'],
    ESXJ: ['汇聚光芒', '照亮黑暗', '积极乐观', '充满能量'],
    ESXP: ['追逐梦想', '永不停歇', '热情洋溢', '行动力强'],
    ENXJ: ['乘风破浪', '勇往直前', '勇于探索', '敢于冒险'],
    ENXP: ['传播信念', '启发他人', '说服力强', '富有魅力'],
    ISTX: ['守护秩序', '保持稳定', '细心谨慎', '责任感强'],
    ISFX: ['拯救危难', '给予关怀', '温柔善良', '富有同情心'],
    INTX: ['引领方向', '指引道路', '远见卓识', '洞察力强'],
    INFX: ['鼓舞人心', '激发潜能', '富有感染力', '积极向上'],
    ESTX: ['掌控航向', '引领团队', '决策果断', '领导力强'],
    ESFX: ['维护和平', '保障安全', '细心周到', '责任感强'],
    ENTX: ['开拓未知', '开辟道路', '勇于探索', '创新精神'],
    ENFX: ['守望未来', '预见趋势', '洞察力强', '前瞻性'],
    
    XXTJ: ['威震天下', '维护平衡', '力量强大', '威严庄重'],
    XXTP: ['超越凡俗', '追求境界', '思想深刻', '不断进化'],
    XXFJ: ['普度众生', '解脱痛苦', '慈悲为怀', '大爱无疆'],
    XXFP: ['超脱情感', '内心平静', '无欲无求', '心境澄明'],
    XSXJ: ['坚定守护', '保护珍视', '忠诚可靠', '勇气非凡'],
    XSXP: ['探索未知', '发现可能', '好奇心强', '勇于冒险'],
    XNXJ: ['远见卓识', '洞察趋势', '前瞻性强', '眼光独到'],
    XNXP: ['自由漫步', '探索意义', '思想开放', '随性而为'],
    XSTX: ['精准操控', '把握动向', '分析能力强', '决策精准'],
    XSFX: ['治理内政', '管理事务', '组织能力强', '细心周到'],
    XNTX: ['深入分析', '揭示本质', '逻辑清晰', '理性思考'],
    XNFX: ['善于沟通', '建立关系', '外交手腕', '亲和力强'],
    IXXJ: ['内心丰富', '专注内在', '自我反思', '深度思考'],
    IXXP: ['自我完善', '内心和谐', '自我接纳', '平衡发展'],
    EXXJ: ['翱翔天际', '超越常规', '雄心壮志', '追求卓越'],
    EXXP: ['无限可能', '突破限制', '自由不羁', '创造力强'],
    IXTX: ['深度思考', '探寻真理', '理性分析', '独立思考'],
    IXFX: ['传递梦境', '连接现实', '想象力丰富', '直觉敏锐'],
    EXTX: ['至高无上', '统治领域', '领导力强', '威严霸气'],
    EXFX: ['跨越遗忘', '超脱轮回', '神秘莫测', '超越生死'],
    ISXX: ['净化心灵', '清除杂念', '内心纯净', '精神升华'],
    INXX: ['虔诚祈祷', '精神寄托', '信仰坚定', '心灵宁静'],
    ESXX: ['宽恕罪恶', '给予救赎', '慈悲宽容', '胸怀宽广'],
    ENXX: ['传播信仰', '引导向善', '说服力强', '使命感强'],
    
    IXXX: ['纯粹内倾', '深入自我', '内省探索', '内心丰富'],
    EXXX: ['纯粹外倾', '融入世界', '社交活跃', '充满活力'],
    XSXX: ['纯粹实感', '专注现实', '感官敏锐', '注重体验'],
    XNXX: ['纯粹直觉', '探索抽象', '想象力丰富', '洞察力强'],
    XXTX: ['纯粹思考', '理性分析', '逻辑严谨', '客观公正'],
    XXFX: ['纯粹情感', '感受真情', '富有同情心', '温暖善良'],
    XXXJ: ['纯粹判断', '喜欢计划', '有条理', '目标明确'],
    XXXP: ['纯粹感知', '享受自由', '随性而为', '适应灵活'],
    
    XXXX: ['超越一切', '混沌无限', '蕴含可能', '神秘莫测'],
    
    unknown: ['持续关注，获取更多人格探索内容', '定期解析，了解自己的变化', '感谢你的持续关注']
  };
  return traitMap[code] || ['平衡发展', '适应性强', '多元视角', '整合能力'];
}

const personalities = {};

const first = ['I', 'E', 'X'];
const second = ['N', 'S', 'X'];
const third = ['T', 'F', 'X'];
const fourth = ['J', 'P', 'X'];

first.forEach(f => {
  second.forEach(s => {
    third.forEach(t => {
      fourth.forEach(fo => {
        const code = f + s + t + fo;
        personalities[code] = {
          camp: getCamp(code),
          name: getName(code),
          dimensionTags: [dimensionLabels[f], dimensionLabels[s], dimensionLabels[t], dimensionLabels[fo]],
          description: getDescription(code),
          traits: getTraits(code)
        };
      });
    });
  });
});

personalities['unknown'] = {
  camp: '首次测试后，即可更新自己的阵营',
  name: 'Hello 新人你好',
  dimensionTags: ['未知-?', '未知-?', '未知-?', '未知-?'],
  description: '很开心看到你来，点击上方按钮立刻开始吧',
  traits: ['持续关注，获取更多人格探索内容', '定期解析，了解自己的变化', '感谢你的持续关注']
};

export default {
  personalitiesData: {
    personalities
  },
  campGroups
};