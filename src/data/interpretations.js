const dimensionNames = {
  E: '外倾',
  I: '内倾',
  S: '实感',
  N: '直觉',
  T: '思考',
  F: '情感',
  J: '判断',
  P: '感知',
  X: '融合'
};

const letterDescriptions = {
  E: '外向、社交、热闹',
  I: '内向、独处、安静',
  S: '实感、细节、当下',
  N: '直觉、概念、未来',
  T: '逻辑、分析、原则',
  F: '情感、共情、人际',
  J: '计划、条理、确定',
  P: '随性、灵活、开放',
  X: '平衡、兼容、和谐'
};

const scoreChangeTemplates = {
  '一-1': {
    priority: 7,
    type: 'score_change',
    match: (change) => change >= 0.5 && change < 1.0,
    direction: 'up',
    template: '📈 {dimension}轻微上升，从{oldPercent}%变成{newPercent}%。'
  },
  '一-2': {
    priority: 7,
    type: 'score_change',
    match: (change) => change >= 1.0 && change < 2.0,
    direction: 'up',
    template: '📈 {dimension}明显上升，从{oldPercent}%变成{newPercent}%。'
  },
  '一-3': {
    priority: 3,
    type: 'score_change',
    match: (change) => change >= 2.0,
    direction: 'up',
    template: '🚀 {dimension}大幅上升，从{oldPercent}%变成{newPercent}%。变化显著。'
  },
  '一-4': {
    priority: 7,
    type: 'score_change',
    match: (change) => change >= -0.9 && change < -0.5,
    direction: 'down',
    template: '📉 {dimension}轻微下降，从{oldPercent}%变成{newPercent}%。'
  },
  '一-5': {
    priority: 7,
    type: 'score_change',
    match: (change) => change >= -1.9 && change < -1.0,
    direction: 'down',
    template: '📉 {dimension}明显下降，从{oldPercent}%变成{newPercent}%。'
  },
  '一-6': {
    priority: 3,
    type: 'score_change',
    match: (change) => change < -2.0,
    direction: 'down',
    template: '⚠️ {dimension}大幅下降，从{oldPercent}%变成{newPercent}%。变化显著。'
  }
};

const flipTemplates = {
  '二-EI': {
    priority: 1,
    type: 'flip',
    dimension: 'EI',
    template: '🔄 你的内外向倾向反转了。{oldLetter}倾向（{oldPercent}%）被{newLetter}倾向（{newPercent}%）反超。你最近变得{newDesc}了。'
  },
  '二-SN': {
    priority: 1,
    type: 'flip',
    dimension: 'SN',
    template: '🔄 你的认知方式反转了。{oldLetter}倾向（{oldPercent}%）被{newLetter}倾向（{newPercent}%）反超。你最近看问题的方式变了。'
  },
  '二-TF': {
    priority: 1,
    type: 'flip',
    dimension: 'TF',
    template: '🔄 你的判断方式反转了。{oldLetter}倾向（{oldPercent}%）被{newLetter}倾向（{newPercent}%）反超。你做决定时更依赖{newDesc}了。'
  },
  '二-JP': {
    priority: 1,
    type: 'flip',
    dimension: 'JP',
    template: '🔄 你的生活态度反转了。{oldLetter}倾向（{oldPercent}%）被{newLetter}倾向（{newPercent}%）反超。你最近对计划的态度变了。'
  }
};

const combinationTemplates = {
  '三-1': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'E', change: 'up' }, { key: 'I', change: 'down' }],
    template: '🔄 你的外向倾向加强，内向倾向减弱。你最近似乎更愿意和人待在一起。'
  },
  '三-2': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'E', change: 'down' }, { key: 'I', change: 'up' }],
    template: '🔄 你的内向倾向加强，外向倾向减弱。你最近似乎更需要独处时间。'
  },
  '三-3': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'S', change: 'up' }, { key: 'N', change: 'down' }],
    template: '🔄 你的实感倾向加强，直觉倾向减弱。你最近更关注具体、实际的事情。'
  },
  '三-4': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'S', change: 'down' }, { key: 'N', change: 'up' }],
    template: '🔄 你的直觉倾向加强，实感倾向减弱。你最近更关注概念、未来和可能性。'
  },
  '三-5': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'T', change: 'up' }, { key: 'F', change: 'down' }],
    template: '🔄 你的思考倾向加强，情感倾向减弱。你最近做决定时更依赖逻辑分析。'
  },
  '三-6': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'T', change: 'down' }, { key: 'F', change: 'up' }],
    template: '🔄 你的情感倾向加强，思考倾向减弱。你最近做决定时更在意感受和人际关系。'
  },
  '三-7': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'J', change: 'up' }, { key: 'P', change: 'down' }],
    template: '🔄 你的计划倾向加强，随性倾向减弱。你最近更喜欢按计划做事。'
  },
  '三-8': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'J', change: 'down' }, { key: 'P', change: 'up' }],
    template: '🔄 你的随性倾向加强，计划倾向减弱。你最近更享受灵活、不设限的状态。'
  },
  '三-9': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'E', change: 'up' }, { key: 'J', change: 'up' }],
    template: '🔄 你的外向和计划倾向同时上升。你最近不仅更愿意社交，还更有条理了。'
  },
  '三-10': {
    priority: 5,
    type: 'combination',
    conditions: [{ key: 'E', change: 'down' }, { key: 'P', change: 'up' }],
    template: '🔄 你的内向和随性倾向同时上升。你最近更喜欢独处，也更享受随机应变。'
  }
};

const thresholdTemplates = {
  '四-1': {
    priority: 4,
    type: 'threshold',
    threshold: 50,
    template: '🎯 {dimension}首次突破50%，从{oldPercent}%变成{newPercent}%。你的{dimension}倾向开始占上风。'
  },
  '四-2': {
    priority: 4,
    type: 'threshold',
    threshold: 60,
    template: '📊 {dimension}达到{newPercent}%，倾向已经比较明显了。'
  },
  '四-3': {
    priority: 4,
    type: 'threshold',
    threshold: 75,
    template: '💪 {dimension}达到{newPercent}%，倾向非常强烈。这可能是你比较稳定的特质。'
  },
  '四-4': {
    priority: 4,
    type: 'threshold',
    threshold: 90,
    template: '🔥 {dimension}达到{newPercent}%，几乎是极端倾向。你在这一端非常典型。'
  }
};

const stabilityTemplates = {
  '五-1': {
    priority: 6,
    type: 'stability',
    pattern: 'continuous_up',
    count: 3,
    template: '📈 你的{dimension}已经连续{count}次上升，趋势正在形成。'
  },
  '五-2': {
    priority: 6,
    type: 'stability',
    pattern: 'continuous_up',
    count: 5,
    template: '🎯 你的{dimension}已经连续{count}次上升，趋势比较稳固了。'
  },
  '五-3': {
    priority: 6,
    type: 'stability',
    pattern: 'continuous_down',
    count: 3,
    template: '📉 你的{dimension}已经连续{count}次下降，趋势正在形成。'
  },
  '五-4': {
    priority: 6,
    type: 'stability',
    pattern: 'continuous_down',
    count: 5,
    template: '🎯 你的{dimension}已经连续{count}次下降，趋势比较稳固了。'
  },
  '五-5': {
    priority: 6,
    type: 'stability',
    pattern: 'stable',
    count: 3,
    template: '✅ 你的{dimension}最近{count}次解析波动很小，人格越来越稳定了。'
  }
};

const personalityTemplates = {
  '六-1': {
    priority: 2,
    type: 'personality_change',
    template: '📅 近{N}次解析的综合人格从{oldPersonality}变成了{newPersonality}。这是你近期的整体倾向变化。'
  },
  '六-2': {
    priority: 2,
    type: 'personality_different',
    template: '⚠️ 你近{N}次综合人格是{combinedPersonality}，但本次解析是{currentPersonality}。今天的状态可能和平时不太一样。'
  },
  '六-3': {
    priority: 7,
    type: 'personality_same',
    template: '✅ 你近{N}次综合人格是{combinedPersonality}，和本次结果一致。你的状态比较稳定。'
  }
};

export default {
  dimensionNames,
  letterDescriptions,
  scoreChangeTemplates,
  flipTemplates,
  combinationTemplates,
  thresholdTemplates,
  stabilityTemplates,
  personalityTemplates
}
