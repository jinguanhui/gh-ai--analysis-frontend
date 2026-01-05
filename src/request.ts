import axios from "axios";

console.log(process.env.NODE_ENV);

const myAxios = axios.create({
  // 区分开发和线上环境
  baseURL: "http://localhost:8124/api",
  timeout: 100000,
  withCredentials: true,
});

// Add a request interceptor
myAxios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    // 添加token到请求头
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.token = token;
    }
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
myAxios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    console.log(response);

    const { data } = response;
    console.log(data);
    // 未登录或token过期
    if (data.code === 40100 || data.code === 401) {
      // 不是获取用户信息接口，或者不是登录页面，则跳转到登录页面
      if (
        !response.request.responseURL.includes("user/current") &&
        !window.location.pathname.includes("/user/login")
      ) {
        // 清除本地存储的token和用户信息
        localStorage.removeItem("token");
        window.location.href = `/user/login?redirect=${window.location.href}`;
      }
    }
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    // 处理401错误
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/user/login")) {
        window.location.href = `/user/login?redirect=${window.location.href}`;
      }
    }
    return Promise.reject(error);
  }
);

export default myAxios;
