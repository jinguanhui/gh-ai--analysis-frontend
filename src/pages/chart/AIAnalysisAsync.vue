<template>
  <div class="ai-analysis-container">
    <h1>AI数据分析</h1>
    <a-layout class="ai-analysis-layout">
      <!-- 左侧侧边栏 -->
      <a-layout-sider v-model:collapsed="collapsed" :width="350" :collapsible="true" :trigger="null"
        class="input-sider">
        <!-- 侧边栏展开时显示的内容 -->
        <div v-if="!collapsed" class="sider-header">
          <span>分析设置</span>
        </div>

        <!-- 侧边栏展开时显示的分析设置内容 -->
        <div v-if="!collapsed" class="sider-content">
          <div class="input-group">
            <label>图表名称</label>
            <a-input v-model:value="chartAnalysisStore.chartName" placeholder="请输入图表名称" />
          </div>

          <div class="input-group">
            <label>分析目标</label>
            <a-textarea v-model:value="chartAnalysisStore.analysisTarget" placeholder="请输入您希望分析的目标" :rows="4" />
          </div>

          <div class="input-group">
            <label>图表类型</label>
            <a-select v-model:value="chartAnalysisStore.chartType" placeholder="请选择图表类型" allowClear>
              <a-select-option value="折线图">折线图</a-select-option>
              <a-select-option value="柱状图">柱状图</a-select-option>
              <a-select-option value="饼图">饼图</a-select-option>
              <a-select-option value="面积图">面积图</a-select-option>
              <a-select-option value="雷达图">雷达图</a-select-option>
            </a-select>
          </div>

          <div class="input-group">
            <label>上传Excel文件</label>
            <a-upload :fileList="chartAnalysisStore.fileList" :beforeUpload="beforeUpload" :remove="handleRemove"
              accept=".xlsx,.xls" :maxCount="1">
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
        </div>

        <!-- 侧边栏折叠时显示的图标 -->
        <div v-else class="sider-collapsed-icon" @click="collapsed = !collapsed">
          <ToolTwoTone style="font-size: 20px; color: #1890ff;" />
        </div>
      </a-layout-sider>

      <!-- 右侧结果区域 -->
      <a-layout-content class="result-content">
        <!-- 侧边栏展开/收起按钮 -->
        <div class="toggle-btn" @click="collapsed = !collapsed">
          <a-button type="text" size="large">
            <component :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined" />
          </a-button>
        </div>

        <a-card title="分析结果" :bordered="false" class="result-card">
          <!-- 使用v-show替代v-if，确保DOM元素始终存在 -->
          <div v-show="chartAnalysisStore.analysisResult" class="result-content">
            <div class="result-text">
              <h3>分析报告</h3>
              <p>{{ chartAnalysisStore.analysisResult }}</p>
            </div>

            <div class="chart-container">
              <h3>数据图表</h3>
              <div ref="chartRef" id="chartShow" class="chart"></div>
            </div>
          </div>

          <div v-show="!chartAnalysisStore.analysisResult && chartAnalysisStore.percentProcess === 0" class="no-result">
            <a-empty description="暂无分析结果，请在左侧设置分析参数并点击开始分析" />
          </div>
        </a-card>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup lang="ts" name="AIAnalysis">
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import myAxios from '@/request';
import { message } from 'ant-design-vue';
import { useLoginUserStore } from '@/store/useLoginUserStore';
import { useChartAnalysisStore } from '@/store/useChartAnalysisStore';
import { encryptWithAES, encryptWithRSA, generateAESKey } from '@/utils/EncryptionUtils';
import { Layout } from 'ant-design-vue';
import { UploadOutlined, MenuUnfoldOutlined, MenuFoldOutlined, ToolTwoTone } from '@ant-design/icons-vue';

// 解构Layout组件
const { Sider, Content } = Layout;

// 获取路由和用户状态
const router = useRouter();
const loginUserStore = useLoginUserStore();
const chartAnalysisStore = useChartAnalysisStore(); // 使用新的store

// 定义本地响应式数据（仅用于加载状态和图表实例）
const isLoading = ref(false);
const chartRef = ref<HTMLElement | null>(null);
const collapsed = ref(false); // 侧边栏展开/收起状态
let myChart: echarts.ECharts | null = null;

// 初始化图表的函数
const initChart = () => {
  if (!myChart && chartRef.value) {
    myChart = echarts.init(chartRef.value);
    console.log('图表初始化成功', myChart);

    window.addEventListener('resize', handleResize);
  }
};

// 处理窗口大小变化，重新调整图表大小
const handleResize = () => {
  if (myChart) {
    myChart.resize();
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
    // 如果store中有图表配置，重新渲染图表
    if (chartAnalysisStore.chartOption && myChart) {
      myChart.setOption(chartAnalysisStore.chartOption, true);
      myChart.resize();
    }
  });
});

// 监听analysisResult变化，确保图表已初始化
watch(() => chartAnalysisStore.analysisResult, (newVal) => {
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

watch(() => collapsed.value, () => {
  nextTick(() => {
    if (myChart) {
      myChart.resize();
    }
  });
});

// 组件卸载时清理事件监听，但不清除store中的数据
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});

// 重置逻辑
const handleReset = () => {
  chartAnalysisStore.resetAll(); // 使用store的重置方法
  if (myChart) myChart.setOption({}, true); // 清空图表
  isLoading.value = false;
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

  chartAnalysisStore.fileList = [file]; // 更新store中的文件列表
  return false; // 阻止默认上传行为
};

const handleRemove = (file: any) => {
  chartAnalysisStore.fileList = []; // 清空store中的文件列表
};

// 核心：AI分析
const handleAnalysis = async () => {
  const { chartName, analysisTarget, chartType, fileList } = chartAnalysisStore;

  // 基础校验
  if (!chartName || !analysisTarget || !chartType || fileList.length === 0) {
    message.error('请完善所有分析参数');
    return;
  }

  // 重置状态
  isLoading.value = true;
  chartAnalysisStore.analysisResult = '';
  chartAnalysisStore.percentProcess = 0;
  chartAnalysisStore.info = '';
  chartAnalysisStore.chartOption = null;

  try {
    // 1. 分离文件和文本参数
    const formData = new FormData();
    const file = fileList[0];
    const textParams = {
      name: chartName,
      goal: analysisTarget,
      chartType: chartType
    };

    // 保持文件原始格式，不加密
    formData.append('file', file);

    // 将文本参数用AES加密
    const key = generateAESKey();
    const encryptedData = encryptWithAES(JSON.stringify(textParams), key);
    const publicKey: any = localStorage.getItem("publicKey");
    const encryptedKey = encryptWithRSA(key, publicKey);

    // 添加加密参数到表单
    formData.append('encryptedKey', encryptedKey);
    formData.append('encryptedData', encryptedData);

    // 2. 提交任务
    const initResponse = await myAxios.post('/chart/gen', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000
    });

    const { code, data, message: resMsg } = initResponse.data;
    
    if (code !== 200 || !data?.taskId) {
      message.error(resMsg || '任务提交失败');
      isLoading.value = false;
      return;
    }
    
    const { taskId, chartId } = data;
    
    console.log(`！！！！！！！！！！！！taskId: ${taskId}, chartId: ${chartId}`);
    // 保存taskId和chartId到store
    chartAnalysisStore.setTaskAndChartId(taskId, chartId);
    
    message.success('任务提交成功，正在分析...');
    isLoading.value = false;
    
    // 跳转到图表管理页面
    router.push('/chart/chartManage');

  } catch (error: any) {
    console.error('分析请求失败:', error);
    message.error(error.response?.data?.message || '请求异常，请稍后重试');
    chartAnalysisStore.percentProcess = 0;
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* 现有的样式保持不变 */
.ai-analysis-container {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.ai-analysis-layout {
  margin-top: 16px;
  height: calc(100vh - 80px);
  overflow: hidden;
}

.input-sider {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.sider-header {
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}

.sider-content {
  padding: 16px;
}

/* 侧边栏折叠时的图标样式 */
.sider-collapsed-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
}

.result-content {
  padding: 0 24px;
  position: relative;
  overflow-y: auto;
}

.toggle-btn {
  position: absolute;
  top: 16px;
  left: 8px;
  z-index: 1;
}

.result-card {
  height: 100%;
  overflow: hidden;
}

.result-card :deep(.ant-card-body) {
  height: calc(100% - 64px);
  overflow-y: auto;
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
  min-height: 800px;
}

.chart-container h3 {
  margin-bottom: 10px;
}

.chart {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  min-height: 500px;
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
  .ai-analysis-layout {
    height: auto;
  }

  .input-sider {
    position: static !important;
    width: 100% !important;
    height: auto;
  }

  .result-content {
    padding: 16px;
  }

  .chart {
    aspect-ratio: 4 / 3;
  }
}
</style>