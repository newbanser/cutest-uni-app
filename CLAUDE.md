# cutest-uni-app — 81型融合人格测试

uni-app 微信小程序，Vue 3 + Pinia + 微信云开发。

## 关键文件

| 文件 | 作用 |
|------|------|
| `src/utils/scoring.js` | 核心算法：评分、人格判定、关系匹配、变化分析 |
| `src/stores/user.js` | 用户状态管理（Pinia），含云端同步逻辑 |
| `src/data/scenarios.js` | 标准版题库（E/I/S/N/T/F/J/P 各30题） |
| `src/data/simple-scenarios.js` | 简易版题库（8认知功能维度） |
| `src/data/officialPairs.js` | 81型官配名单 |
| `src/data/personalities.js` | 人格类型描述 |
| `cloudfunctions/` | 微信云函数（savePersonality, getPersonality, createMatch 等） |

## 常用命令

```
npm run dev:mp-weixin    # 开发模式
npm run build:mp-weixin  # 构建微信小程序
npm run dev:h5           # H5 开发
```

## 可用 Skill

- `/add-scenario` — 向标准版或简易版题库添加测试题

## 注意

- 判型阈值：主字母占比 45%-55% → X（融合型），>55% → 明确偏向
- 关系等级：LV1~LV5，对应 5 级×4 列性别语境
- 云函数部署：微信开发者工具右键 cloudfunctions 目录上传
