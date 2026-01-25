<template>
    <div class="chart-detail-container">
        <h1 class="page-title">图表详情</h1>

        <!-- 面包屑导航 -->
        <a-breadcrumb class="breadcrumb-nav">
            <a-breadcrumb-item><a href="/chart/chartManage">图表管理</a></a-breadcrumb-item>
            <a-breadcrumb-item>{{ chartDetail?.name || '图表详情' }}</a-breadcrumb-item>
        </a-breadcrumb>

        <!-- 加载中状态 -->
        <a-spin :spinning="loading" tip="加载中...">
            <a-card v-if="chartDetail" :bordered="false" class="detail-card">
                <!-- 基本信息 -->
                <div class="basic-info">
                    <div class="info-item">
                        <span class="info-label">图表名称：</span>
                        <span class="info-value">{{ chartDetail.name }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">分析目标：</span>
                        <span class="info-value">{{ chartDetail.goal }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">图表类型：</span>
                        <span class="info-value">{{ chartDetail.chartType }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">创建时间：</span>
                        <span class="info-value">{{ formatDate(chartDetail.createTime) }}</span>
                    </div>
                    <!-- 添加图表状态 -->
                    <div class="info-item">
                        <span class="info-label">图表状态：</span>
                        <span class="info-value status-badge" :class="`status-${chartDetail.status}`">
                            {{ chartDetail.execMessage || getStatusText(chartDetail.status) }}
                        </span>
                    </div>
                    <!-- 添加执行信息 -->
                    <div v-if="chartDetail.execMessage" class="info-item">
                        <span class="info-label">执行信息：</span>
                        <span class="info-value">{{ chartDetail.execMessage }}</span>
                    </div>
                </div>

                <!-- 图表展示 -->
                <div class="chart-section">
                    <h3 class="section-title">图表展示</h3>
                    <div ref="chartRef" v-show="chartDetail.genChart !== null" class="chart-container"></div>
                    <a-result v-if="chartDetail.status === 'failed'" status="error" :title="chartDetail.execMessage" />
                    <a-result v-if="chartDetail.status === 'wait' || chartDetail.status === 'running'" status="info" :title="chartDetail.execMessage" />
                </div>

                <!-- 分析结果 -->
                <div v-if="chartDetail.genResult" class="result-section">
                    <h3 class="section-title">分析结果</h3>
                    <div class="result-content">
                        <p>{{ chartDetail.genResult }}</p>
                    </div>
                </div>

                <!-- 原始数据 -->
                <div v-if="chartDetail.chartData" class="data-section">
                    <h3 class="section-title">原始数据</h3>
                    <div class="data-content">
                        <a-textarea :value="chartDetail.chartData" :rows="10" readonly />
                    </div>
                </div>
            </a-card>
        </a-spin>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { useLoginUserStore } from '@/store/useLoginUserStore';
import * as echarts from 'echarts';
import { getChartById } from '@/api/mychart';

// 获取路由和用户状态
const router = useRouter();
const route = useRoute();
const loginUserStore = useLoginUserStore();

// 定义响应式数据
const loading = ref(true);
const chartDetail = ref<any>({});
const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;

// 格式化日期
const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取状态文本
const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
        'succeed': '任务成功执行',
        'wait': '任务等待执行中',
        'failed': '任务执行失败',
        'running': '任务正在执行'
    };
    return statusMap[status] || status;
};

// 初始化图表
const initChart = () => {
    if (!chartRef.value || !chartDetail.value?.genChart) return;

    // 创建图表实例
    myChart = echarts.init(chartRef.value);

    try {
        // 解析genChart字段为对象
        let chartOption;
        if (typeof chartDetail.value.genChart === 'string') {
            // 使用new Function安全地解析包含函数的配置字符串
            const cleanedGenChart = chartDetail.value.genChart.replace(/\n/g, '').replace(/\s+/g, ' ');
            // 将JSON字符串转换为可执行的JavaScript代码
            const parseFunc = new Function(`return ${cleanedGenChart}`);
            chartOption = parseFunc();
        } else {
            chartOption = chartDetail.value.genChart;
        }

        // 设置图表选项
        myChart.setOption(chartOption, true);
        console.log('图表渲染成功', chartOption);
    } catch (error) {
        console.error('解析图表配置失败:', error);
        message.error('图表渲染失败');
    }
};

// 处理窗口大小变化，重新调整图表大小
const handleResize = () => {
    if (myChart) {
        myChart.resize();
    }
};

// 获取图表详情
const fetchChartDetail = async () => {
    try {
        const id = Number(route.params.id);
        if (isNaN(id)) {
            message.error('图表ID无效');
            router.push('/chart/chartManage');
            return;
        }

        loading.value = true;
        const response = await getChartById(id);

        if (response.data.code === 200 && response.data.data) {
            chartDetail.value = response.data.data;

            // 延迟一下，确保DOM已更新
            nextTick(() => {
                initChart();
            });
        } else {
            message.error(response.data.message || '获取图表详情失败');
            router.push('/chart/chartManage');
        }
    } catch (error: any) {
        console.error('获取图表详情异常:', error);
        message.error(error.response?.data?.message || '获取图表详情异常');
        router.push('/chart/chartManage');
    } finally {
        loading.value = false;
    }
};

// 组件挂载时的操作
onMounted(() => {
    // 检查用户是否登录
    if (loginUserStore.loginUser.username === "未登录") {
        message.error('请先登录');
        router.push('/user/login');
        return;
    }

    // 获取图表详情
    fetchChartDetail();

    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);
});

// 组件卸载时的清理工作
onUnmounted(() => {
    // 移除窗口大小变化监听
    window.removeEventListener('resize', handleResize);

    // 销毁图表实例
    if (myChart) {
        myChart.dispose();
        myChart = null;
    }
});
</script>

<style scoped>
/* 状态样式 */
.status-badge {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 500;
}

.status-succeed {
    background-color: #f6ffed;
    border: 1px solid #b7eb8f;
    color: #52c41a;
}

.status-wait {
    background-color: #e6f7ff;
    border: 1px solid #91d5ff;
    color: #1890ff;
}

.status-failed {
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    color: #f5222d;
}

.status-running {
    background-color: #fffbe6;
    border: 1px solid #ffe58f;
    color: #faad14;
}

.chart-detail-container {
    padding: 24px;
    background-color: #f5f5f5;
    min-height: 100vh;
}

/* 页面标题样式 */
.page-title {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #1890ff;
}

/* 面包屑导航样式 */
.breadcrumb-nav {
    margin-bottom: 24px;
    padding: 8px 16px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.detail-card {
    margin-top: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    overflow: hidden;
}

/* 基本信息样式 */
.basic-info {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-bottom: 24px;
    padding: 20px;
    background-color: #fafafa;
    border-radius: 8px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.info-label {
    font-weight: 500;
    min-width: 90px;
    color: #555;
    background-color: #e6f7ff;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 14px;
    border: 1px solid #91d5ff;
}

.info-value {
    flex: 1;
    word-break: break-word;
    max-width: 400px;
    font-size: 15px;
    color: #333;
    padding: 4px 12px;
    background-color: #fff;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
}

/* 章节标题样式 */
.section-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #f0f0f0;
    display: flex;
    align-items: center;
}

.section-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 20px;
    background-color: #1890ff;
    margin-right: 12px;
    border-radius: 2px;
}

.chart-section,
.result-section,
.data-section {
    margin-bottom: 32px;
    padding: 0 20px;
}

/* 图表容器样式 */
.chart-container {
    width: 100%;
    height: 450px;
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 分析结果样式 */
.result-content {
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.result-content p {
    line-height: 1.8;
    color: #555;
    font-size: 15px;
    margin: 0;
}

/* 原始数据样式 */
.data-content {
    background-color: #fff;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.data-content :deep(.ant-input-textarea) {
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .chart-detail-container {
        padding: 16px;
    }

    .page-title {
        font-size: 24px;
    }

    .basic-info {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
    }

    .info-item {
        width: 100%;
    }

    .info-value {
        max-width: none;
    }

    .chart-section,
    .result-section,
    .data-section {
        padding: 0 16px;
    }

    .chart-container {
        height: 350px;
        padding: 12px;
    }
}
</style>