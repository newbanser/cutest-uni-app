// 云函数调用工具 - 统一处理云函数调用
export const cloudFunc = {
  // 安全调用云函数（自动降级到本地存储
  async call(name, data = {}) {
    if (!uni.cloud) {
      console.log(`[cloudFunc] uni.cloud 不可用，跳过云函数调用`);
      return { success: false, message: '云开发未初始化', useLocal: true };
    }

    try {
      const res = await uni.cloud.callFunction({ name, data });
      console.log(`[cloudFunc] 云函数调用成功: ${name}`, res);
      
      // 成功后，同时也保存一份到本地作为备份
      try {
        const cuteId = data.cuteId || data.cuteid;
        if (name === 'savePersonality' && cuteId) {
          const key = `personality_${cuteId}`;
          uni.setStorageSync(key, data);
        } else if (name === 'createMatch') {
          const matches = uni.getStorageSync('matchHistory') || [];
          matches.unshift({ ...data, time: Date.now() });
          if (matches.length > 50) {
            matches.pop();
          }
          uni.setStorageSync('matchHistory', matches);
        }
      } catch (e) {
        console.error('[cloudFunc] 本地备份失败:', e);
      }
      
      return res.result || { success: true };
    } catch (err) {
      console.error(`[cloudFunc] 云函数调用失败: ${name}`, err);
      
      // 云函数调用失败，尝试使用本地数据
      const cuteId = data.cuteId || data.cuteid;
      if (name === 'getPersonality' && cuteId) {
        const key = `personality_${cuteId}`;
        const localData = uni.getStorageSync(key);
        if (localData) {
          console.log(`[cloudFunc] 使用本地数据:`, localData);
          return {
            success: true, data: localData, fromLocal: true };
        }
      }
      
      return {
        success: false,
        message: err.errMsg || err.message || '云函数调用失败',
        error: err,
        useLocal: true
      };
    }
  }
};
