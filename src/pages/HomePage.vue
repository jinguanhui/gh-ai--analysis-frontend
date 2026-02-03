<template>
  <div id="homePage">
    <h1>{{ msg }}</h1>
    <a onclick="window.aiRouter.push('/chart/analysis')">打开AI聊天窗口</a>
  </div>
</template>

<script setup lang="ts">
import router from '@/router';

const msg = "欢迎来到GH智能数据分析系统，在这里你可以进行任意数据分析和可视化展示，AI会智能给出你的数据可视化建议。";
// 将router实例挂载到window对象，以便在HTML中访问
if (typeof window !== 'undefined') {
  (window as any).aiRouter = router;
}
</script>

<style scoped>
#homePage {
}
</style>
