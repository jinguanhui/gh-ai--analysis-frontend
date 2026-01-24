<template>
  <div v-if="visible" class="progress-container">
    <a-progress 
      :stroke-color="{
        from: '#108ee9',
        to: '#87d068',
      }" 
      :percent="percent" 
      status="active" 
    />
    <p class="progress-tip">{{ tipPrefix }}：{{ info }}</p>
  </div>
</template>

<script setup lang="ts">
import { Progress } from 'ant-design-vue';

// 定义组件属性
interface Props {
  visible: boolean;
  percent: number;
  info: string;
  tipPrefix?: string;
}

// 接收属性
const props = withDefaults(defineProps<Props>(), {
  tipPrefix: '分析进度'
});
</script>

<style scoped>
.progress-container {
  padding: 20px 0;
}

.progress-tip {
  margin-top: 10px;
  text-align: center;
  color: #666;
}
</style>