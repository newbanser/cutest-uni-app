<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

onLaunch(() => {
  if (wx.cloud) {
    wx.cloud.init({
      env: 'cloud1-d2gz1iuxn08055996',
      traceUser: true
    });
    console.log('云开发初始化完成，环境ID: cloud1-d2gz1iuxn08055996');
  } else {
    console.warn('wx.cloud 不存在，请确保已开通云开发');
  }

  userStore.loadUserData();
  console.log('App launched');
});

onShow((options) => {
  console.log('App Show', JSON.stringify(options));
  // 从分享链接重新进入时，保存 from 参数供页面使用
  if (options && options.query && options.query.from) {
    uni.setStorageSync('pendingFromLink', options.query.from);
  }
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style>
page {
  background-color: #f4f4f4;
}

/* 禁用 uni-app 框架的远程图片预加载，避免超时问题 */
page::after {
  display: none !important;
}
</style>
