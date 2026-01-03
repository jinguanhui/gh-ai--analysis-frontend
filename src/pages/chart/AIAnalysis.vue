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

          <div v-show="!analysisResult" class="no-result">
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
import { useLoginUserStore } from '@/store/useLoginUserStore'; // 使用项目实际的store

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
});

// 重置表单数据的函数
const handleReset = () => {
  chartName.value = '';
  analysisTarget.value = '';
  chartType.value = '';
  fileList.value = [];
  analysisResult.value = '';

  // 清除图表
  if (myChart) {
    myChart.setOption({});
  }
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

const handleAnalysis = async () => {
  if (!chartName.value) {
    message.error('请输入图表名称');
    return;
  }

  if (!analysisTarget.value) {
    message.error('请输入分析目标');
    return;
  }

  if (!chartType.value) {
    message.error('请选择图表类型');
    return;
  }

  if (fileList.value.length === 0) {
    message.error('请上传Excel文件');
    return;
  }

  isLoading.value = true;
  analysisResult.value = '';

  // 确保图表已初始化
  nextTick(() => {
    initChart();
    if (myChart) {
      myChart.setOption({});
    }
  });

  try {
    // 创建FormData对象上传文件
    const formData = new FormData();
    formData.append('file', fileList.value[0]);
    formData.append('name', chartName.value);
    formData.append('goal', analysisTarget.value);
    formData.append('chartType', chartType.value);

    // 使用项目中的myAxios实例调用后端API进行AI分析
    const response = await myAxios.post('/chart/gen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const res = response.data;

    if (res.code === 200 && res.data) {
      // 提取分析结果
      analysisResult.value = res.data.genResult || '分析完成';

      if (res.data.genChart) {
        try {
          let chartData: any;
          // 检查genChart是否已经是对象，还是字符串
          if (typeof res.data.genChart === 'string') {
            // 如果是字符串，尝试解析JSON
            try {
              chartData = JSON.parse(res.data.genChart);

              // 验证解析后的数据结构是否有效
              if (!chartData || typeof chartData !== 'object') {
                throw new Error('解析后的图表配置无效');
              }
            } catch (jsonError) {
              console.error('JSON解析失败，genChart内容:', res.data.genChart);
              message.error('图表配置解析处理失败!');
              return;
            }
          } else {
            // 如果已经是对象，直接使用
            chartData = res.data.genChart;

            // 验证对象是否有效
            if (!chartData || typeof chartData !== 'object') {
              throw new Error('图表配置对象无效');
            }
          }

          // 确保图表配置中包含必要的属性
          if (!chartData.series || !Array.isArray(chartData.series)) {
            console.error('图表配置缺少有效的series属性');
            message.error('图表配置格式不正确!');
            return;
          }

          console.log('图表配置:', chartData);

          // 再次确保myChart已初始化
          nextTick(() => {
            initChart();
            if (myChart) {
              myChart.setOption(chartData);
              // 设置图表后确保调整大小以占满容器
              myChart.resize();
              console.log('图表设置完成');
            } else {
              console.error('图表初始化失败，无法显示图表');
              message.error('图表初始化失败，无法显示图表');
            }
          });
        } catch (parseError) {
          console.error('图表配置处理失败:', parseError);
          message.error('图表配置处理失败!');
        }
      } else {
        message.error('图表生成失败!');
      }
    } else {
      message.error(res.message || '分析失败，请重试');
    }
  } catch (error: any) {
    console.error('分析请求失败:', error);
    message.error(error.response?.data?.message || '分析请求失败，请重试');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
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
  /* 减去顶部标题和padding的高度 */
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
  /* 设置最小高度，确保图表有足够的显示空间 */
}

.chart-container h3 {
  margin-bottom: 10px;
}

.chart {
  width: 100%;
  aspect-ratio: 16 / 9;
  /* 设置宽高比例，保持图表的原始比例 */
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  min-height: 350px;
  /* 设置最小高度，确保图表不被过度压缩 */
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
    /* 移动端调整为更适合的比例 */
  }
}
</style>