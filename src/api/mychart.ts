import myAxios from "@/request";

/**
 * 用户注册
 * @param params
 */
export const userRegister = async (params: any) => {
  return myAxios.request({
    url: "/chart/my/list/page",
    method: "POST",
    data: params,
  });
};