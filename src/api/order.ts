import myAxios from "@/request";

/**
 * 创建订单
 * @param params
 */
export const createOrder = async (params: any) => {
  return myAxios.request({
    url: "/order/create",
    method: "POST",
    data: params,
  });
};

/**
 * 获取订单详情
 * @param params
 */
export const getOrderDetail = async (params: any) => {
  return myAxios.request({
    url: "/order/detail",
    method: "POST",
    data: params,
  });
};