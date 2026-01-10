import axios from "axios";
import { userLogout } from "@/api/user";
import { message } from "ant-design-vue";

console.log(process.env.NODE_ENV);

const myAxios = axios.create({
  // 区分开发和线上环境
  baseURL: "http://localhost:8124/api",
  timeout: 100000,
  withCredentials: true,
});

// 用于标记是否正在刷新token
let isRefreshing = false;
// 用于存储等待刷新token的请求队列
let requests:any[] = [];

// Add a request interceptor
myAxios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    // 添加token到请求头
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.token = token;
      config.headers.set("stamp", new Date().getTime().toString());
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
    return response;
  },
  async function (error) {
    const { response } = error;
    // 处理401状态码（token失效）
    if (response && response.status === 401 || response.status === 403 ) {
      // 如果不是登录页面，则尝试刷新token
      if (!window.location.pathname.includes("/user/login")) {
        const originalRequest = error.config;
        
        // 如果正在刷新token，则将请求加入队列
        if (isRefreshing) {
          return new Promise((resolve) => {
            requests.push((token: string) => {
              originalRequest.headers.token = token;
              resolve(myAxios(originalRequest));
            });
          });
        }
        
        // 标记开始刷新token
        isRefreshing = true;
        
        try {
          // 调用刷新token接口
          const refreshResponse = await myAxios.post("/user/refreshToken");
          
          if (refreshResponse.data.code === 200 && refreshResponse.data.data) {
            // 存储新的token
            const newToken = refreshResponse.data.data;
            localStorage.setItem("token", newToken);
            
            // 更新当前请求的token
            originalRequest.headers.token = newToken;
            
            // 处理队列中的请求
            requests.forEach(cb => cb(newToken));
            requests = [];
            
            // 重新发送原请求
            return myAxios(originalRequest);
          } else {
            // 刷新token失败，跳转到登录页面
            localStorage.removeItem("token");
            //  移除refreshToken
            await userLogout();
            window.location.href = `/user/login?redirect=${window.location.href}`;
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // 刷新token失败，跳转到登录页面
          //  移除refreshToken
            await userLogout();
            localStorage.removeItem("token");
          window.location.href = `/user/login?redirect=${window.location.href}`;
          return Promise.reject(refreshError);
        } finally {
          // 标记刷新token完成
          isRefreshing = false;
        }
      }
    }
    
    // 其他错误情况
    return Promise.reject(error);
  }
);

export default myAxios;
