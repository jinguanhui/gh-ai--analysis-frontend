import { defineStore } from "pinia";
import { ref } from "vue";

export const useChartAnalysisStore = defineStore("chartAnalysis", () => {
  // 定义响应式数据，用于持久化存储图表分析相关状态
  const chartName = ref('');
  const analysisTarget = ref('');
  const chartType = ref('');
  const fileList = ref<any[]>([]);
  const analysisResult = ref('');
  const percentProcess = ref(0);
  const info = ref('');
  const chartOption = ref<any>(null); // 存储图表配置，用于页面切换后重新渲染
  const taskId = ref(''); // 添加taskId存储
  const chartId = ref<number>(0); // 添加chartId存储

  // 设置分析参数
  function setAnalysisParams(params: {
    chartName?: string;
    analysisTarget?: string;
    chartType?: string;
    fileList?: any[];
  }) {
    if (params.chartName !== undefined) chartName.value = params.chartName;
    if (params.analysisTarget !== undefined) analysisTarget.value = params.analysisTarget;
    if (params.chartType !== undefined) chartType.value = params.chartType;
    if (params.fileList !== undefined) fileList.value = params.fileList;
  }

  // 设置分析结果
  function setAnalysisResult(result: string) {
    analysisResult.value = result;
  }

  // 设置图表配置
  function setChartOption(option: any) {
    chartOption.value = option;
  }

  // 设置进度信息
  function setProgressInfo(progress: number, infoText: string) {
    percentProcess.value = progress;
    info.value = infoText;
  }

  // 设置任务ID和图表ID
  function setTaskAndChartId(taskIdVal: string, chartIdVal: number) {
    taskId.value = taskIdVal;
    chartId.value = chartIdVal;
  }

  // 重置所有状态
  function resetAll() {
    chartName.value = '';
    analysisTarget.value = '';
    chartType.value = '';
    fileList.value = [];
    analysisResult.value = '';
    percentProcess.value = 0;
    info.value = '';
    chartOption.value = null;
    taskId.value = ''; // 重置taskId
    chartId.value = 0; // 重置chartId
  }

  return {
    chartName,
    analysisTarget,
    chartType,
    fileList,
    analysisResult,
    percentProcess,
    info,
    chartOption,
    taskId,
    chartId,
    setAnalysisParams,
    setAnalysisResult,
    setChartOption,
    setProgressInfo,
    setTaskAndChartId,
    resetAll
  };
});