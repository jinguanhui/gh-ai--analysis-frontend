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
                            <a-select-option value="散点图">散点图</a-select-option>
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
        <a-row :gutter="16">
            <!-- 遍历图表列表，每个图表使用卡片包裹 -->
            <a-col :span="12" v-for="chart in chartList" :key="chart.id" style="margin-bottom: 24px;">
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
                    </div>

                    <!-- 图表渲染区域 -->
                    <div class="chart-preview">
                        <!-- 使用函数式ref来获取每个图表的DOM元素 -->
                        <div :ref="el => setChartRef(chart.id, el)" class="chart-canvas"></div>
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

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useLoginUserStore } from '@/store/useLoginUserStore';
import * as echarts from 'echarts';
import { getChartList, getChartById } from '@/api/mychart';

// 获取路由和用户状态
const router = useRouter();
const loginUserStore = useLoginUserStore();

// 定义响应式数据
const chartList = ref<any[]>([]);
const chartRefs = ref<Record<number, HTMLElement | null>>({});
const myCharts = ref<Record<number, echarts.ECharts | null>>({});
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

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

        // 设置图表选项
        myCharts.value[chartId]?.setOption(chartOption, true);

        console.log(`图表${chartId}渲染成功`, chartOption);
    } catch (error) {
        console.error(`解析图表${chartId}的配置失败:`, error);
        console.error(`原始genChart数据:`, chart.genChart);
        message.error(`图表${chartId}渲染失败`);
    }
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
                });
            });
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

// 组件挂载时的操作
onMounted(() => {
    // 检查用户是否登录
    if (loginUserStore.loginUser.username === "未登录") {
        message.error('请先登录');
        router.push('/user/login');
        return;
    }

    // 加载图表列表
    loadChartList();

    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);
});

// 组件卸载时的清理工作
onUnmounted(() => {
    // 移除窗口大小变化监听
    window.removeEventListener('resize', handleResize);

    // 销毁所有图表实例
    Object.values(myCharts.value).forEach(chart => {
        chart?.dispose();
    });
});
</script>

<style scoped>
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
    align-items: flex-start;
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