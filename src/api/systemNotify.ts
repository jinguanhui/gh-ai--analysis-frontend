import myAxios from "@/request";

/**
 * 分页获取系统消息列表
 * @param params
 */
export const getSysNotificationList = async (params: any) => {
  return myAxios.request({
    url: "/systemNotify/list/page",
    method: "POST",
    data: params,
  });
};
/**
 * 将所有系统通知标记为已读
 */
export const updateSysNotify = async () => {
  return myAxios.request({
    url: "/systemNotify/update",
    method: "POST",
  });
};