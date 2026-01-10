import myAxios from "@/request";

/**
 * 获取用户的AccessKey列表
 */
export const listAccessKeys = async () => {
  return myAxios.request({
    url: "/accessKey/list",
    method: "POST",
  });
};

/**
 * 创建新的AccessKey
 */
export const createAccessKeys = async () => {
  return myAxios.request({
    url: "/accessKey/create",
    method: "POST",
  });
};

/**
 * 禁用AccessKey
 */
export const disableAccessKeys = async () => {
  return myAxios.request({
    url: "/accessKey/disable",
    method: "POST",
  });
};

/**
 * 删除AccessKey
 */
export const deleteAccessKeys = async () => {
  return myAxios.request({
    url: "/accessKey/delete",
    method: "POST",
  });
};

/**
 * 设置AccessKey最大闲置时间
 * @param idleTime 最大闲置时间（天）
 */
export const setAccessKeyIdleTime = async (idleTime: number) => {
  return myAxios.request({
    url: "/accessKey/idletime",
    method: "POST",
    params: {
      idleTime
    }
  });
};