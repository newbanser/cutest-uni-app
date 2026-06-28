// 简单模式（v2）— 24 题 Likert 量表
// 每题固定选项: 非常不同意 / 比较不同意 / 中立 / 比较同意 / 非常同意
// 计分规则:
//   非常不同意=1, 比较不同意=2, 中立=3, 比较同意=4, 非常同意=5
// reverse=true 的题目需要反向计分: 1↔5, 2↔4, 3→3
//
// 维度说明:
//   I = 内倾 (正向: 越同意越偏I)
//   S = 实感 (正向: 越同意越偏S)
//   T = 思维 (正向: 越同意越偏T)
//   J = 判断 (正向: 越同意越偏J)
//   配对维度 (E/N/F/P) 由反向计算得出

const simpleV2Scenarios = [
  // ===== E/I 维度（6题，全部 I 正向）=====
  { id: 'v2_01', dimension: 'I', text: '比起热闹聚会，我更喜欢安静待着。', reverse: false },
  { id: 'v2_05', dimension: 'I', text: '人群待久了会疲惫，需要独处充电。', reverse: false },
  { id: 'v2_09', dimension: 'I', text: '我不太喜欢主动与人搭话。', reverse: false },
  { id: 'v2_13', dimension: 'I', text: '我更愿意倾听而非主导话题。', reverse: false },
  { id: 'v2_17', dimension: 'I', text: '我更喜欢一对一的深度交流。', reverse: false },
  { id: 'v2_21', dimension: 'I', text: '我能自己待得住，不常需要互动。', reverse: false },

  // ===== S/N 维度（6题：S 正向 2题，S 反向 = N 正向 4题）=====
  { id: 'v2_02', dimension: 'S', text: '我关注眼前事实细节而非抽象。', reverse: false },
  { id: 'v2_06', dimension: 'S', text: '我更喜欢思考未来而非当下。', reverse: true  },  // → N
  { id: 'v2_10', dimension: 'S', text: '我信任直接经验和五感观察。', reverse: false },
  { id: 'v2_14', dimension: 'S', text: '我常有天马行空的联想和想法。', reverse: true  },  // → N
  { id: 'v2_18', dimension: 'S', text: '我喜欢把新想法落实到实际用途。', reverse: true  },  // → N
  { id: 'v2_22', dimension: 'S', text: '我对诗意和隐喻很感兴趣。', reverse: true  },  // → N

  // ===== T/F 维度（6题：T 正向 2题，T 反向 = F 正向 4题）=====
  { id: 'v2_03', dimension: 'T', text: '我靠逻辑分析而非感觉做决定。', reverse: false },
  { id: 'v2_07', dimension: 'T', text: '我做决策会优先考虑他人感受。', reverse: true  },  // → F
  { id: 'v2_11', dimension: 'T', text: '我认为公平比人情更重要。', reverse: false },
  { id: 'v2_15', dimension: 'T', text: '别人情绪易影响我的决定。', reverse: true  },  // → F
  { id: 'v2_19', dimension: 'T', text: '感觉"不对"就会放弃，哪怕逻辑通。', reverse: true  },  // → F
  { id: 'v2_23', dimension: 'T', text: '我倾向用"心"而非用"脑"。', reverse: true  },  // → F

  // ===== J/P 维度（6题：J 正向 3题，J 反向 = P 正向 3题）=====
  { id: 'v2_04', dimension: 'J', text: '我喜欢按计划行事，讨厌变动。', reverse: false },
  { id: 'v2_08', dimension: 'J', text: '我喜欢自由，不被日程束缚。', reverse: true  },  // → P
  { id: 'v2_12', dimension: 'J', text: '我喜欢做完事再休息。', reverse: false },
  { id: 'v2_16', dimension: 'J', text: '我做事喜欢留有余地。', reverse: true  },  // → P
  { id: 'v2_20', dimension: 'J', text: '我习惯提前准备，讨厌手忙脚乱。', reverse: false },
  { id: 'v2_24', dimension: 'J', text: '我能适应变化，不必按原计划。', reverse: true  },  // → P
];

export default simpleV2Scenarios;
