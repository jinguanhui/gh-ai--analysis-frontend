import myAxios from "@/request";

/**
 * 获取图表列表
 * @param params
 */
export const getChartList = async (params: any) => {
  return myAxios.request({
    url: "/chart/my/list/page",
    method: "POST",
    data: params,
  });
};

/**
 * 根据ID获取图表详情
 * @param id
 */
export const getChartById = async (id: number) => {
  return myAxios.request({
    url: "/chart/get",
    method: "GET",
    params: { id },
  });
};