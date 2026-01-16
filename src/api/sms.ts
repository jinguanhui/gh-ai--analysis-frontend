import myAxios from "@/request";


/**
 * 发送验证码
 * @param params
 */
export const sendCode = async (params: any) => {
  return myAxios.request({
    url: "/sms/send",
    method: "POST",
    data: params,
  });
};


/**
 * 验证验证码并登录
 * @param params
 */
export const verifyCodeAndLogin = async (params: any) => {
  return myAxios.request({
    url: "/sms/verify",
    method: "POST",
    data: params,
  });
};