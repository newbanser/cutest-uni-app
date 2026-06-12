/**
 * 自动构建 mp-weixin 的监听脚本
 * 用法：node scripts/auto-build.js
 * 零依赖，仅用 Node.js 内置 fs + child_process
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WATCH_DIR = path.join(PROJECT_ROOT, 'src');
const DEBOUNCE_MS = 1500;  // 1.5秒防抖，避免连续保存触发多次构建

let timer = null;
let building = false;

// 上一次构建时 src 目录的文件快照（mtime），用于去重
let lastBuildMtimes = new Map();

function getAllFiles(dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      try {
        if (entry.isDirectory()) {
          files.push(...getAllFiles(fullPath));
        } else {
          const stat = fs.statSync(fullPath);
          files.push({ path: fullPath, mtime: stat.mtimeMs });
        }
      } catch (e) { /* 忽略权限不足的文件 */ }
    }
  } catch (e) { /* 忽略 */ }
  return files;
}

function hasChanged() {
  const currentFiles = getAllFiles(WATCH_DIR);
  const currentMap = new Map(currentFiles.map(f => [f.path, f.mtime]));

  if (currentMap.size !== lastBuildMtimes.size) return true;

  for (const [filePath, mtime] of currentMap) {
    if (lastBuildMtimes.get(filePath) !== mtime) return true;
  }
  return false;
}

function build() {
  if (building) return;
  if (!hasChanged()) return;

  building = true;
  const now = new Date().toLocaleTimeString();
  console.log(`\n📦 [${now}] 检测到文件变更，开始构建...`);
  console.log('━'.repeat(40));

  try {
    execSync('npm run build:mp-weixin', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      timeout: 60000
    });
    lastBuildMtimes = new Map(getAllFiles(WATCH_DIR).map(f => [f.path, f.mtime]));
    console.log('━'.repeat(40));
    console.log('✅ 构建完成，mp-weixin 已更新');
  } catch (e) {
    console.log('━'.repeat(40));
    console.error('❌ 构建失败，请检查上方错误信息');
  } finally {
    building = false;
  }
}

function startWatching() {
  console.log('🔍 cutest-auto-build 已启动');
  console.log(`📂 监听目录: ${WATCH_DIR}`);
  console.log(`⏱️  防抖间隔: ${DEBOUNCE_MS}ms`);
  console.log('💡 修改 src/ 下任何文件后自动运行 npm run build:mp-weixin');
  console.log('💡 按 Ctrl+C 停止监听\n');

  // 启动时先跑一次构建
  lastBuildMtimes = new Map(getAllFiles(WATCH_DIR).map(f => [f.path, f.mtime]));
  console.log('📸 已记录初始文件快照，等待变更...\n');

  try {
    fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
      if (!filename || building) return;
      // 只关心文件变更/新增/删除
      if (eventType !== 'change' && eventType !== 'rename') return;

      clearTimeout(timer);
      timer = setTimeout(build, DEBOUNCE_MS);
    });
  } catch (e) {
    console.error('❌ 文件监听失败:', e.message);
    console.log('💡 备选方案：手动运行 npm run build:mp-weixin');
    process.exit(1);
  }
}

startWatching();
