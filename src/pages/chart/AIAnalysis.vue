<template>
  <div class="ai-analysis-container">
    <h1>AI数据分析</h1>
    <div class="ai-analysis-content">
      <!-- 左侧输入区域 -->
      <div class="input-section">
        <a-card title="分析设置" :bordered="false">
          <div class="input-group">
            <label>图表名称</label>
            <a-input v-model:value="chartName" placeholder="请输入图表名称" />
          </div>

          <div class="input-group">
            <label>分析目标</label>
            <a-textarea v-model:value="analysisTarget" placeholder="请输入您希望分析的目标，例如：销售额趋势分析、用户行为分析等" :rows="4" />
          </div>

          <div class="input-group">
            <label>图表类型</label>
            <a-select v-model:value="chartType" placeholder="请选择图表类型" allowClear>
              <a-select-option value="line">折线图</a-select-option>
              <a-select-option value="bar">柱状图</a-select-option>
              <a-select-option value="pie">饼图</a-select-option>
              <a-select-option value="scatter">散点图</a-select-option>
              <a-select-option value="area">面积图</a-select-option>
              <a-select-option value="radar">雷达图</a-select-option>
            </a-select>
          </div>

          <div class="input-group">
            <label>上传Excel文件</label>
            <a-upload :fileList="fileList" :beforeUpload="beforeUpload" :remove="handleRemove" accept=".xlsx,.xls"
              :maxCount="1">
              <a-button>
                <upload-outlined></upload-outlined>
                选择Excel文件
              </a-button>
            </a-upload>
          </div>

          <a-button type="primary" @click="handleAnalysis" :loading="isLoading" block class="analyze-btn">
            开始AI分析
          </a-button>

          <!-- 添加重置按钮 -->
          <a-button @click="handleReset" block class="reset-btn" style="margin-top: 10px;">
            重置
          </a-button>
        </a-card>
      </div>

      <!-- 右侧结果区域 -->
      <div class="result-section">
        <a-card title="分析结果" :bordered="false">
          <!-- 进度条区域：优先显示圆形进度条，完成后显示结果 -->
          <!-- <div v-if="percentProcess < 100 && percentProcess > 0" class="progress-wrapper">
            <a-progress type="circle" :stroke-color="{
              '0%': '#108ee9',
              '100%': '#87d068',
            }" :percent="percentProcess" :width="120" />
            <p class="progress-tip">分析进度：{{ info }}</p>
          </div> -->

          <!-- 使用v-show替代v-if，确保DOM元素始终存在 -->
          <div v-show="analysisResult" class="result-content">
            <div class="result-text">
              <h3>分析报告</h3>
              <p>{{ analysisResult }}</p>
            </div>

            <div class="chart-container">
              <h3>数据图表</h3>
              <div ref="chartRef" id="chartShow" class="chart"></div>
            </div>
          </div>

          <div v-if="isLoading">
            <a-progress :stroke-color="{
            from: '#108ee9',
            to: '#87d068',
            }" 
          :percent=percentProcess 
          status="active" />
          <p class="progress-tip">分析进度：{{ info }}</p>
          </div>


          <div v-show="!analysisResult && percentProcess === 0" class="no-result">
            <a-empty description="暂无分析结果，请在左侧设置分析参数并点击开始分析" />
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UploadOutlined } from '@ant-design/icons-vue';
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import myAxios from '@/request';
import { message } from 'ant-design-vue';
import { useLoginUserStore } from '@/store/useLoginUserStore';
import ProgressBar from '@/src/components/ProcessBar.vue';

// 获取路由和用户状态
const router = useRouter();
const loginUserStore = useLoginUserStore();

// 定义响应式数据
const chartName = ref('');
const analysisTarget = ref('');
const chartType = ref('');
const fileList = ref<any[]>([]);
const isLoading = ref(false);
const analysisResult = ref('');
const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;
const percentProcess = ref(0);
let eventSource: EventSource | null = null; // 声明SSE连接实例
// 模拟后端数据
const info = ref('');

// 初始化图表的函数
const initChart = () => {
  if (!myChart && chartRef.value) {
    myChart = echarts.init(chartRef.value);
    console.log('图表初始化成功', myChart);

    // 添加窗口大小变化监听，确保图表能自适应容器大小
    window.addEventListener('resize', handleResize);
  }
};

// 处理窗口大小变化，重新调整图表大小
const handleResize = () => {
  if (myChart) {
    myChart.resize();
  }
};

// 关闭SSE连接的工具函数
const closeSSE = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    console.log('SSE连接已主动关闭');
  }
};

// 页面加载完成后初始化图表
onMounted(() => {
  // 检查用户是否登录，如果未登录则重定向到登录页
  if (loginUserStore.loginUser.username === "未登录") {
    message.error('请先登录');
    router.push('/login');
    return;
  }

  console.log('页面加载完成');
  // 延迟一下确保DOM已完全渲染
  nextTick(() => {
    initChart();
  });
});

// 监听analysisResult变化，确保图表已初始化
watch(analysisResult, (newVal) => {
  if (newVal) {
    // 分析结果出现时，确保图表已初始化
    nextTick(() => {
      initChart();
      // 确保图表在数据加载后能正确调整大小
      if (myChart) {
        myChart.resize();
      }
    });
  }
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
  closeSSE(); // 卸载组件时关闭SSE
});

// 重置逻辑
const handleReset = () => {
  chartName.value = '';
  analysisTarget.value = '';
  chartType.value = '';
  fileList.value = [];
  analysisResult.value = '';
  percentProcess.value = 0; // 重置进度
  info.value = ''; // 重置任务信息
  closeSSE(); // 重置时关闭SSE
  if (myChart) myChart.setOption({}, true); // 清空图表
  message.success('已重置所有参数');
};

const beforeUpload = (file: any) => {
  // 限制文件类型
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel';
  if (!isExcel) {
    message.error('只能上传Excel文件!');
    return false;
  }

  // 限制文件大小 (例如 5MB)
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('文件大小不能超过5MB!');
    return false;
  }

  fileList.value = [file];
  return false; // 阻止默认上传行为
};

const handleRemove = (file: any) => {
  fileList.value = [];
};

// 核心：AI分析 + SSE进度监听
const handleAnalysis = async () => {
  // 基础校验
  if (!chartName.value || !analysisTarget.value || !chartType.value || fileList.value.length === 0) {
    message.error('请完善所有分析参数');
    return;
  }

  // 重置状态
  isLoading.value = true;
  analysisResult.value = '';
  percentProcess.value = 0;
  info.value = '';
  closeSSE(); // 先关闭已有SSE连接

  try {
    // 1. 构造表单数据
    const formData = new FormData();
    formData.append('file', fileList.value[0]);
    formData.append('name', chartName.value);
    formData.append('goal', analysisTarget.value);
    formData.append('chartType', chartType.value);

    // 2. 第一步：提交任务，获取taskId
    const initResponse = await myAxios.post('/chart/gen', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000 // 延长超时时间，适配文件上传
    });

    const { code, data, message: resMsg } = initResponse.data;
    if (code === 401) {
      message.error(resMsg || '登录过期，请重新登录');
      router.push('/user/login');
      return;
    }
    if (code !== 200 || !data?.taskId) {
      message.error(resMsg || '任务提交失败');
      isLoading.value = false;
      return;
    }
    const { taskId } = data;
    message.success('任务提交成功，开始分析...');

    // 3. 第二步：建立SSE连接，监听进度
    // 处理baseURL拼接，避免跨域或路径错误
    let sseUrl = `/chart/progress/${taskId}`;
    if (myAxios.defaults.baseURL && !myAxios.defaults.baseURL.includes(window.location.host)) {
      sseUrl = `${myAxios.defaults.baseURL}${sseUrl}`;
    }
    // 解决SSE缓存问题：添加时间戳参数
    const token = localStorage.getItem("token");
    sseUrl = `${sseUrl}?t=${new Date().getTime()}&token=${token}`;

    eventSource = new EventSource(sseUrl);
    console.log('SSE连接已建立：', sseUrl);

    // SSE消息处理（核心：实时更新进度）
    eventSource.onmessage = (event) => {
      try {
        const progressData = JSON.parse(event.data);
        console.log('接收进度消息:', progressData);

        // 进度更新：严格限制0-100范围
        if (progressData.code === 200 && progressData.data?.taskProcess !== undefined) {
          const newProgress = Math.min(Math.max(progressData.data.taskProcess, 0), 100);
          percentProcess.value = newProgress;
          info.value = progressData.data.taskInfo;
          isLoading.value = newProgress < 100; // 进度100%时关闭loading

          // 任务完成：关闭SSE + 渲染结果
          if (newProgress >= 100) {
            analysisResult.value = progressData.data.genResult || 'AI分析完成！';
            // 渲染图表
            if (progressData.data.genChart) {
              const chartOption = typeof progressData.data.genChart === 'string'
                ? JSON.parse(progressData.data.genChart)
                : progressData.data.genChart;
              nextTick(() => {
                initChart();
                if (myChart) {
                  myChart.setOption(chartOption, true);
                  myChart.resize();
                }
              });
            }
            closeSSE(); // 完成后关闭SSE
            message.success('分析完成！');
          }
        } else if (progressData.code === 500) {
          message.error(progressData.message || '任务执行失败');
          percentProcess.value = 0;
          info.value = '';
          closeSSE();
          isLoading.value = false;
        }
      } catch (e) {
        console.error('解析SSE消息失败:', e);
        message.error('进度更新异常，已停止监听');
        percentProcess.value = 0;
        info.value = '';
        closeSSE();
        isLoading.value = false;
      }
    };

    // SSE连接错误处理
    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      // 排除正常关闭的情况
      if (eventSource?.readyState === EventSource.CLOSED) {
        console.log('SSE连接正常关闭');
      } else {
        message.error('进度监听断开，请检查后端服务或刷新页面重试');
        percentProcess.value = 0;
        info.value = '';
        closeSSE();
      }
      isLoading.value = false;
    };

    // SSE连接关闭监听
    // eventSource.onclose = () => {
    //   console.log('SSE连接已关闭');
    //   isLoading.value = false;
    // };

    eventSource.addEventListener('close', () => {
      console.log('SSE连接已关闭');
      isLoading.value = false;
    });

  } catch (error: any) {
    console.error('分析请求失败:', error);
    message.error(error.response?.data?.message || '请求异常，请稍后重试');
    percentProcess.value = 0;
    info.value = '';
    closeSSE();
    isLoading.value = false;
  }
};
</script>

<style scoped>
.ant-progress-circle {
  margin: 20px auto;
}

.progress-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}


.progress-bar {
  width: 100%;
  background: #e0e0e0;
}

.progress {
  height: 20px;
  background: #76c7c0;
}

/* 现有的样式保持不变 */
.ai-analysis-container {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 150vh;
}

.ai-analysis-content {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  height: calc(100vh - 80px);
}

.input-section {
  flex: 1;
  max-width: 400px;
}

.result-section {
  flex: 2;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.result-section :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.analyze-btn {
  margin-top: 10px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  flex: 1;
}

.result-text {
  padding-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.result-text h3 {
  margin-bottom: 10px;
}

.result-text p {
  line-height: 1.6;
}

.chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.chart-container h3 {
  margin-bottom: 10px;
}

.chart {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  min-height: 350px;
}

.no-result {
  text-align: center;
  padding: 40px 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .ai-analysis-content {
    flex-direction: column;
    height: auto;
  }

  .input-section {
    max-width: 100%;
  }

  .chart {
    aspect-ratio: 4 / 3;
  }
}
</style>