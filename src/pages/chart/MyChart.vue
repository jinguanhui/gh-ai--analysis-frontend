<template>
    <div class="my-chart-container">
        <h1>图表管理</h1>

        <!-- 高级搜索表单 -->
        <a-card :bordered="false" class="search-card">
            <a-row :gutter="16">
                <a-col :span="8">
                    <div class="search-item">
                        <span class="search-label">图表名称：</span>
                        <a-input v-model:value="searchForm.name" placeholder="请输入图表名称" allowClear />
                    </div>
                </a-col>
                <a-col :span="8">
                    <div class="search-item">
                        <span class="search-label">分析目标：</span>
                        <a-input v-model:value="searchForm.goal" placeholder="请输入分析目标" allowClear />
                    </div>
                </a-col>
                <a-col :span="8">
                    <div class="search-item">
                        <span class="search-label">图表类型：</span>
                        <a-select v-model:value="searchForm.chartType" placeholder="请选择图表类型" allowClear>
                            <a-select-option value="折线图">折线图</a-select-option>
                            <a-select-option value="柱状图">柱状图</a-select-option>
                            <a-select-option value="饼图">饼图</a-select-option>
                            <a-select-option value="面积图">面积图</a-select-option>
                            <a-select-option value="雷达图">雷达图</a-select-option>
                        </a-select>
                    </div>
                </a-col>
            </a-row>
            <a-row :gutter="16" style="margin-top: 16px;">
                <a-col :span="12">
                    <div class="search-item">
                        <span class="search-label">创建时间：</span>
                        <a-range-picker v-model:value="searchForm.createTimeRange" style="width: 65%;"
                            :placeholder="['开始日期', '结束日期']" />
                    </div>
                </a-col>
                <a-col :span="12" style="display: flex; justify-content: flex-end; gap: 16px;">
                    <a-button type="primary" @click="handleSearch" style="margin-right: 8px;">
                        搜索
                    </a-button>
                    <a-button @click="handleResetSearch">
                        刷新
                    </a-button>
                </a-col>
            </a-row>
        </a-card>

        <!-- 使用栅格系统布局 -->
        <a-row :gutter="[16, 24]">
            <a-col :span="12" v-for="chart in chartList" :key="chart.id">
                <a-card :title="chart.name" :bordered="false" class="chart-card" @click="goToChartDetail(chart.id)"
                    style="cursor: pointer;">
                    <!-- 图表信息 -->
                    <div class="chart-info">
                        <div class="info-item">
                            <span class="info-label">分析目标：</span>
                            <span class="info-value">{{ chart.goal }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">图表类型：</span>
                            <span class="info-value">{{ chart.chartType }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">创建时间：</span>
                            <span class="info-value">{{ formatDate(chart.createTime) }}</span>
                        </div>
                        <!-- 添加图表状态 -->
                        <div class="info-item">
                            <span class="info-label">图表状态：</span>
                            <span class="info-value status-badge" :class="`status-${chart.status}`">
                                {{ chart.execMessage || getStatusText(chart.status) }}
                            </span>
                        </div>
                        <!-- 添加执行信息 -->
                        <div v-if="chart.execMessage" class="info-item">
                            <span class="info-label">执行信息：</span>
                            <span class="info-value">{{ chart.execMessage }}</span>
                        </div>
                    </div>

                    <!-- 图表渲染区域 -->
                    <div v-if="chart.status === 'succeed'" class="chart-preview">
                        <!-- 使用函数式ref来获取每个图表的DOM元素 -->
                        <div :ref="el => setChartRef(chart.id, el)" class="chart-canvas"></div>
                    </div>
                    <div v-else-if="chart.status === 'failed'">
                        <a-result status="error" :title="chart.execMessage" />
                    </div>
                    <div v-else>
                        <!-- 显示进度条 -->
                        <div class="progress-container">
                            <!-- <a-progress :percent="chartProgress[chart.id]?.progress || 0" status="active" />
                            <div class="progress-text">{{ chartProgress[chart.id]?.taskInfo || chart.execMessage ||
                                '正在处理中...' }}</div> -->
                            <ProgressBar :percent="chartProgress[chart.id]?.progress || 0"
                                :info="chartProgress[chart.id]?.taskInfo || chart.execMessage || '正在处理中...'" />
                        </div>
                    </div>

                </a-card>
            </a-col>
        </a-row>

        <!-- 分页组件 -->
        <div class="pagination-container">
            <a-pagination :current="currentPage" :page-size="pageSize" :total="total" :show-size-changer="false"
                @change="handlePageChange" />
        </div>
    </div>
</template>

<script setup lang="ts" name="chartManage">
import { getChartList } from '@/api/mychart';
import myAxios from '@/request';
import { useChartAnalysisStore } from '@/store/useChartAnalysisStore';
import { useLoginUserStore } from '@/store/useLoginUserStore';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts';
import { nextTick, onActivated, onDeactivated, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ProgressBar from '@/components/ProgressBar.vue';

// 获取路由和用户状态
const router = useRouter();
const loginUserStore = useLoginUserStore();

const chartAnalysisStore = useChartAnalysisStore(); // 使用新的store


// 定义响应式数据
const chartList = ref<any[]>([]);
const chartRefs = ref<Record<number, HTMLElement | null>>({});
const myCharts = ref<Record<number, echarts.ECharts | null>>({});
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const eventSources = ref<Record<number, EventSource | null>>({}); // 存储每个图表的SSE连接
// 修改后
const chartProgress = ref<Record<number, { progress: number; taskInfo: string }>>({}); // 存储每个图表的进度和进度信息
// 搜索表单数据
const searchForm = ref({
    name: '',
    goal: '',
    chartType: '',
    createTimeRange: [] as Date[]
});

// 设置图表ref
const setChartRef = (chartId: number, el: HTMLElement | null) => {
    chartRefs.value[chartId] = el;
};

// 跳转到图表详情页
const goToChartDetail = (chartId: number) => {
    router.push(`/chart/detail/${chartId}`);
};

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
        'failed': '任务执行失败',
        'running': '任务正在执行',
        'wait': '任务等待执行'
    };
    return statusMap[status] || status;
};

// 初始化单个图表
const initChart = (chartId: number) => {
    // 确保DOM元素存在且图表实例未创建
    if (!chartRefs.value[chartId] || myCharts.value[chartId]) return;

    // 创建图表实例
    myCharts.value[chartId] = echarts.init(chartRefs.value[chartId]);

    // 查找对应的图表数据
    const chart = chartList.value.find(item => item.id === chartId);
    if (!chart) return;

    // 确保genChart字段存在
    if (!chart.genChart) {
        console.error(`图表${chartId}缺少genChart数据`);
        return;
    }

    try {
        // 解析genChart字段为对象
        let chartOption;
        if (typeof chart.genChart === 'string') {
            // 使用new Function安全地解析包含函数的配置字符串
            const cleanedGenChart = chart.genChart.replace(/\n/g, '').replace(/\s+/g, ' ');
            // 将JSON字符串转换为可执行的JavaScript代码
            const parseFunc = new Function(`return ${cleanedGenChart}`);
            chartOption = parseFunc();
        } else {
            chartOption = chart.genChart;
        }

        // 移除图表标题
        if (chartOption && typeof chartOption === 'object' && 'title' in chartOption) {
            delete chartOption.title;
        }

        myCharts.value[chartId]?.setOption(chartOption, true);

        console.log(`图表${chartId}渲染成功`, chartOption);
    } catch (error) {
        console.error(`解析图表${chartId}的配置失败:`, error);
        console.error(`原始genChart数据:`, chart.genChart);
        message.error(`图表${chartId}渲染失败`);
    }
};

// 建立SSE连接
const establishSSEConnection = (chartId: number, taskId: string) => {
    if (eventSources.value[chartId]) {
        return; // 已经有连接了，不再建立新连接
    }

    try {
        // 处理baseURL拼接，避免跨域或路径错误
        let sseUrl = `/chart/progress/${taskId}`;
        if (myAxios.defaults.baseURL && !myAxios.defaults.baseURL.includes(window.location.host)) {
            sseUrl = `${myAxios.defaults.baseURL}${sseUrl}`;
        }
        // 解决SSE缓存问题：添加时间戳参数
        const token = localStorage.getItem("token");
        sseUrl = `${sseUrl}?token=${token}`;

        const eventSource = new EventSource(sseUrl);
        eventSources.value[chartId] = eventSource;
        console.log(`图表${chartId}的SSE连接已建立：`, sseUrl);

        // SSE消息处理
        eventSource.onmessage = (event) => {
            try {
                const progressData = JSON.parse(event.data);
                console.log(`接收图表${chartId}的进度消息:`, progressData);

                // 进度更新：严格限制0-100范围
                if (progressData.code === 200 && progressData.data?.taskProcess !== undefined) {
                    const newProgress = Math.min(Math.max(progressData.data.taskProcess, 0), 100);
                    // 存储进度和进度信息
                    chartProgress.value[chartId] = {
                        progress: newProgress,
                        taskInfo: progressData.data.taskInfo || '正在处理中...'
                    };

                    // 任务完成：关闭SSE
                    if (newProgress >= 100) {
                        closeSSEConnection(chartId);
                        // 重新加载图表列表
                        // initChart(event.data.chartId)
                        loadChartList();
                    }
                }else {
                    message.error(`图表${chartList.value[chartId].name}生成失败`);
                    closeSSEConnection(chartId);
                }
            } catch (e) {
                console.error(`解析图表${chartId}的SSE消息失败:`, e);
                closeSSEConnection(chartId);
            }
        };

        // SSE连接错误处理
        eventSource.onerror = (error) => {
            console.error(`图表${chartId}的SSE连接错误:`, error);
            closeSSEConnection(chartId);
            loadChartList();
        };

    } catch (error: any) {
        console.error(`图表${chartId}建立SSE连接失败:`, error);
        closeSSEConnection(chartId);
    }
};

// 关闭SSE连接
const closeSSEConnection = (chartId: number) => {
    if (eventSources.value[chartId]) {
        eventSources.value[chartId]?.close();
        eventSources.value[chartId] = null;
        delete chartProgress.value[chartId];
        console.log(`图表${chartId}的SSE连接已关闭`);
    }

    // 删除图表ID和任务ID的映射关系
    chartAnalysisStore.chartIdToTaskIdMap.delete(chartId);
};

// 加载图表列表
const loadChartList = async () => {
    try {
        // 格式化日期范围
        const createTimeRange = searchForm.value.createTimeRange;
        const startTime = createTimeRange[0] ? createTimeRange[0].toISOString() : '';
        const endTime = createTimeRange[1] ? createTimeRange[1].toISOString() : '';


        const response = await getChartList({
            current: currentPage.value,
            pageSize: pageSize.value,
            name: searchForm.value.name,
            goal: searchForm.value.goal,
            chartType: searchForm.value.chartType,
            startTime,
            endTime
        });

        if (response.data.code === 200) {
            chartList.value = response.data.data.records || [];
            total.value = response.data.data.total || 0;

            // 清空现有图表实例
            Object.values(myCharts.value).forEach(chart => {
                chart?.dispose();
            });
            myCharts.value = {};

            // 延迟一下，确保DOM已更新
            nextTick(() => {
                // 初始化所有图表
                chartList.value.forEach(chart => {
                    initChart(chart.id);
                    const taskId = chartAnalysisStore.chartIdToTaskIdMap.get(chart.id);
                    console.log(`建立图表${chart.chartId}的SSE连接，taskId: ${taskId}`);


                    // 为非成功和非失败状态的图表建立SSE连接
                    if (chart.status !== 'succeed' && chart.status !== 'failed' && taskId) {
                        establishSSEConnection(chart.id, taskId);
                    }
                });
            });
            message.success('图表列表已更新');
        } else {
            message.error(response.data.message || '获取图表列表失败');
        }
    } catch (error: any) {
        console.error('获取图表列表异常:', error);
        message.error(error.response?.data?.message || '获取图表列表异常');
    }
};

// 处理页码变化
const handlePageChange = (page: number) => {
    currentPage.value = page;
    loadChartList();
};

// 处理搜索
const handleSearch = () => {
    currentPage.value = 1;
    loadChartList();
};

// 处理重置搜索
const handleResetSearch = () => {
    searchForm.value = {
        name: '',
        goal: '',
        chartType: '',
        createTimeRange: [] as Date[]
    };
    currentPage.value = 1;
    loadChartList();
};

// 处理窗口大小变化，重新调整所有图表大小
const handleResize = () => {
    Object.values(myCharts.value).forEach(chart => {
        chart?.resize();
    });
};

// 组件被激活时的操作（KeepAlive相关）
onActivated(() => {
    // 检查用户是否登录
    if (loginUserStore.loginUser.username === "未登录") {
        message.error('请先登录');
        router.push('/user/login');
        return;
    }

    // 加载图表列表
    loadChartList();
    // 组件被激活时，重新添加窗口大小变化监听
    window.addEventListener('resize', handleResize);
    
    // 重新初始化所有图表
    chartList.value.forEach(chart => {
        initChart(chart.id);
        const taskId = chartAnalysisStore.chartIdToTaskIdMap.get(chart.id);

        // 为非成功和非失败状态的图表重新建立SSE连接
        if (chart.status !== 'succeed' && chart.status !== 'failed' && taskId) {
            establishSSEConnection(chart.id, taskId);
        }
    });
});

// 组件被停用时的操作（KeepAlive相关）
onDeactivated(() => {
    // 组件被停用时，移除窗口大小变化监听
    window.removeEventListener('resize', handleResize);

    // 销毁所有图表实例，但保留SSE连接
    Object.values(myCharts.value).forEach(chart => {
        chart?.dispose();
    });
    myCharts.value = {};
});


// // 组件挂载时的操作
// onMounted(() => {


//     // 添加窗口大小变化监听
//     window.addEventListener('resize', handleResize);
// });

// 组件卸载时的清理工作
onUnmounted(() => {
    chartAnalysisStore.chartIdToTaskIdMap.clear();

    // 关闭所有SSE连接
    Object.keys(eventSources.value).forEach(chartId => {
        closeSSEConnection(Number(chartId));
    });

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

.my-chart-container {
    padding: 24px;
    background-color: #f5f5f5;
    min-height: 100vh;
}

.search-card {
    margin-bottom: 24px;
    padding: 16px;
}

.search-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.search-label {
    font-weight: 500;
    font-size: 14px;
}

.chart-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.chart-info {
    margin-bottom: 16px;
}

.info-item {
    margin-bottom: 8px;
    display: flex;
}

.info-label {
    font-weight: 500;
    width: 80px;
    flex-shrink: 0;
}

.info-value {
    flex: 1;
    word-break: break-word;
}

.chart-preview {
    flex: 1;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chart-canvas {
    width: 100%;
    height: 100%;
    min-height: 300px;
}

.progress-container {
    padding: 20px;
    text-align: center;
}

.progress-text {
    margin-top: 8px;
    color: #666;
    font-size: 14px;
}

.pagination-container {
    margin-top: 24px;
    text-align: center;
}

@media (max-width: 1200px) {
    .search-item {
        flex-direction: column;
    }

    .search-label {
        margin-bottom: 4px;
    }
}

@media (max-width: 768px) {
    .my-chart-container {
        padding: 16px;
    }

    .search-card {
        padding: 12px;
    }

    .chart-preview {
        min-height: 200px;
    }

    .chart-canvas {
        min-height: 200px;
    }
}
</style>