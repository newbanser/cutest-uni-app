import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'
import fs from 'fs'

// 自定义插件：自动复制 cloudfunctions 目录
function copyCloudfunctions() {
  return {
    name: 'copy-cloudfunctions',
    writeBundle() {
      const src = resolve(__dirname, 'cloudfunctions')
      const dest = resolve(__dirname, 'dist/build/mp-weixin/cloudfunctions')
      
      if (fs.existsSync(src)) {
        // 如果目标目录已存在，删除后复制
        if (fs.existsSync(dest)) {
          fs.rmSync(dest, { recursive: true, force: true })
        }
        copyDir(src, dest)
        console.log('✅ cloudfunctions 目录已自动复制到编译产物')
      }
    }
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name)
    const destPath = resolve(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export default defineConfig({
  plugins: [uni(), copyCloudfunctions()],
  server: {
    port: 3000,
    host: true
  }
})
