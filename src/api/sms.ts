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
 * 发送修改手机验证码
 * @param params
 */
export const sendChangePhoneCode = async (params: any) => {
  return myAxios.request({
    url: "/sms/send/update",
    method: "POST",
    data: params,
  });
};

/**
 * 验证修改手机验证码
 * @param params
 */
export const verifyChangePhoneCode = async (params: any) => {
  return myAxios.request({
    url: "/sms/verify/update",
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


/**
 * 发送邮件验证码
 * @param params
 */
export const sendMailCode = async (params: any) => {
  return myAxios.request({
    url: "/sms/mail/send",
    method: "POST",
    data: params,
  });
};

/**
 * 验证邮件验证码并登录
 * @param params
 */
export const verifyMailCodeAndLogin = async (params: any) => {
  return myAxios.request({
    url: "/sms/mail/verify",
    method: "POST",
    data: params,
  });
};

/**
 * 发送修改密码手机验证码
 * @param params
 */
export const sendChangePsdCode = async (params: any) => {
  return myAxios.request({
    url: "/sms/send/change_psd",
    method: "POST",
    data: params,
  });
};

/**
 * 验证修改密码手机验证码
 * @param params
 */
export const verifyChangePsdCode = async (params: any) => {
  return myAxios.request({
    url: "/sms/verify/change_psd",
    method: "POST",
    data: params,
  });
};