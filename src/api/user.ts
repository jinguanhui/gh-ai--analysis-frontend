import myAxios from "@/request";

/**
 * 用户注册
 * @param params
 */
export const userRegister = async (params: any) => {
  return myAxios.request({
    url: "/user/register",
    method: "POST",
    data: params,
  });
};

/**
 * 用户登录
 * @param params
 */
export const userLogin = async (params: any) => {
  return myAxios.request({
    url: "/user/login",
    method: "POST",
    data: params,
  });
};

/**
 * 获取用户列表
 * @param username
 */
export const searchUsers = async (username: any) => {
  return myAxios.request({
    url: "/user/search",
    method: "GET",
    params: {
      username,
    },
  });
};

/**
 * 删除用户
 * @param id
 */
export const deleteUser = async (id: string) => {
  return myAxios.request({
    url: "/user/delete",
    method: "POST",
    data: id,
    // 关键点：要传递 JSON 格式的值
    headers: {
      "Content-Type": "application/json",
    },
  });
};
