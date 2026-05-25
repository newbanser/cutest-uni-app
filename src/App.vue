<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

onLaunch(() => {
  userStore.loadUserData();
  console.log('App launched');
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
  background-color: #f5f5f5;
}
</style>
