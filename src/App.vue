<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

onLaunch(() => {
  userStore.loadUserData();
  console.log('App launched');
  
  if (wx.cloud) {
    wx.cloud.init({
      env: 'cloud1-d2gz1iuxn08055996',
      traceUser: true
    });
    console.log('云开发初始化完成，环境ID: cloud1-d2gz1iuxn08055996');
  } else {
    console.warn('wx.cloud 不存在，请确保已开通云开发');
  }
});

onShow(() => {
  console.log('App Show');
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
