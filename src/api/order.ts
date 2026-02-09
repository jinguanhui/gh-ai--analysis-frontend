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

/**
 * 支付宝支付
 */
export const alipay = async (params: any) => {
  return myAxios.request({
    url: "/alipay/pay",
    method: "POST",
    data: params,
  });
};

/**
 * 获取订单列表
 * @param params
 */
export const getOrderList = async (params: any) => {
  return myAxios.request({
    url: "/order/list/page",
    method: "POST",
    data: params,
  });
};
