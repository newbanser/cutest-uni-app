const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Schema
const userSchema = new mongoose.Schema({
  openid: { type: String, required: true, unique: true },
  nickname: { type: String, default: '匿名用户' },
  avatar: { type: String, default: '' },
  personality: { type: String, default: '' },
  dimensions: {
    E: { type: Number, default: 0 },
    I: { type: Number, default: 0 },
    S: { type: Number, default: 0 },
    N: { type: Number, default: 0 },
    T: { type: Number, default: 0 },
    F: { type: Number, default: 0 },
    J: { type: Number, default: 0 },
    P: { type: Number, default: 0 }
  }
}, { timestamps: true });

const matchSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchScore: { type: Number, default: 0 },
  relationshipType: { type: String, default: '' },
  user1Confirmed: { type: Boolean, default: false },
  user2Confirmed: { type: Boolean, default: false },
  user1Nickname: { type: String, default: '' },
  user2Nickname: { type: String, default: '' },
  user1Personality: { type: String, default: '' },
  user2Personality: { type: String, default: '' }
}, { timestamps: true });

matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

// 匹配计算函数
function calculateMatch(personality1, personality2) {
  let totalScore = 0;
  const dims = ['E', 'S', 'T', 'J'];
  dims.forEach(dim => {
    const oppositeDim = getOpposite(dim);
    const has1E = personality1.includes(dim);
    const has1I = personality1.includes(oppositeDim);
    const has2E = personality2.includes(dim);
    const has2I = personality2.includes(oppositeDim);
    
    if (has1E && has2E) {
      totalScore += 30;
    } else if (has1E && has2I) {
      totalScore += 15;
    } else if (has1I && has2E) {
      totalScore += 15;
    }
  });
  
  let type = '普通朋友';
  if (totalScore >= 90) type = '灵魂伴侣';
  else if (totalScore >= 70) type = '知己好友';
  else if (totalScore >= 50) type = '互补搭档';
  else if (totalScore >= 30) type = '友好相处';
  else type = '需要磨合';
  
  return { score: totalScore, relationshipType: type };
}

function getOpposite(dim) {
  const pairs = { 'E': 'I', 'I': 'E', 'S': 'N', 'N': 'S', 'T': 'F', 'F': 'T', 'J': 'P', 'P': 'J' };
  return pairs[dim] || dim;
}

// Connect to MongoDB
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      family: 4
    });
    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '人格匹配服务运行中', timestamp: new Date().toISOString() });
});

// Create/Update User
app.post('/api/users', async (req, res) => {
  try {
    await connectDB();
    const { openid, nickname, avatar, personality, dimensions } = req.body;
    
    if (!openid) {
      return res.status(400).json({ success: false, message: 'openid 是必填项' });
    }
    
    const user = await User.findOneAndUpdate(
      { openid },
      {
        nickname: nickname || '匿名用户',
        avatar: avatar || '',
        personality: personality || '',
        dimensions: dimensions || {}
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// Get User
app.get('/api/users/:openid', async (req, res) => {
  try {
    await connectDB();
    const user = await User.findOne({ openid: req.params.openid });
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('获取用户错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// Calculate Match
app.post('/api/matches/calculate', (req, res) => {
  try {
    const { personality1, personality2 } = req.body;
    
    if (!personality1 || !personality2) {
      return res.status(400).json({ success: false, message: 'personality1 和 personality2 都是必填项' });
    }
    
    const result = calculateMatch(personality1, personality2);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('计算匹配错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// Create Match
app.post('/api/matches', async (req, res) => {
  try {
    await connectDB();
    const { user1Id, user2Id } = req.body;
    
    if (!user1Id || !user2Id) {
      return res.status(400).json({ success: false, message: 'user1Id 和 user2Id 都是必填项' });
    }
    
    const user1 = await User.findById(user1Id);
    const user2 = await User.findById(user2Id);
    
    if (!user1 || !user2) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const existingMatch = await Match.findOne({
      $or: [
        { user1: user1Id, user2: user2Id },
        { user1: user2Id, user2: user1Id }
      ]
    });
    
    if (existingMatch) {
      return res.json({ success: true, data: existingMatch, message: '配对已存在' });
    }
    
    const matchResult = calculateMatch(user1.personality || 'XXXX', user2.personality || 'XXXX');
    
    const match = new Match({
      user1: user1Id,
      user2: user2Id,
      matchScore: matchResult.score,
      relationshipType: matchResult.relationshipType,
      user1Nickname: user1.nickname,
      user2Nickname: user2.nickname,
      user1Personality: user1.personality,
      user2Personality: user2.personality
    });
    
    await match.save();
    
    res.status(201).json({ success: true, data: match });
  } catch (error) {
    console.error('创建配对错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// Get User Matches
app.get('/api/matches/user/:userId', async (req, res) => {
  try {
    await connectDB();
    const matches = await Match.find({
      $or: [
        { user1: req.params.userId },
        { user2: req.params.userId }
      ]
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('获取配对列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: '路由不存在' });
});

module.exports = app;
