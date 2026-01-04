import { defineStore } from "pinia";
import { ref } from "vue";
import { getCurrentUser, userLogout } from "@/api/user";
import { message } from "ant-design-vue";

export const useLoginUserStore = defineStore("loginUser", () => {
  const loginUser = ref<any>(
    JSON.parse(localStorage.getItem("loginUser") || '{"username": "未登录"}')
  );

  // 远程获取登录用户信息
  async function fetchLoginUser() {
    const res = await getCurrentUser();
    if (res.data.code === 200 && res.data.data) {
      loginUser.value = res.data.data;
      // 保存到 localStorage
      localStorage.setItem("loginUser", JSON.stringify(res.data.data));
    }else{
      message.error("请登录！");
    }
    // else {
    //   setTimeout(() => {
    //     loginUser.value = { username: "小黑子", id: 1 };
    //   }, 3000);
    // }
  }

  // 登出
  async function doLogout() {
    try {
      // 调用后端登出接口
      await userLogout({});
      // 清除本地登录状态
      loginUser.value = { username: "未登录" };
      // 清除 localStorage 中的用户信息
      localStorage.removeItem("loginUser");
    } catch (error) {
      console.error('登出失败', error);
      // 即使后端登出失败，也要清除本地状态
      loginUser.value = { username: "未登录" };
      localStorage.removeItem("loginUser");
    }
  }

  // 单独设置信息
  function setLoginUser(newLoginUser: any) {
    loginUser.value = newLoginUser;
    // 保存到 localStorage
    localStorage.setItem("loginUser", JSON.stringify(newLoginUser));
  }

  return { loginUser, fetchLoginUser, setLoginUser, doLogout };
});
