import { defineStore } from "pinia";
import { ref } from "vue";
import { message } from "ant-design-vue";
import router from "@/router";
import { userLogout } from "@/api/user";

export const useLoginUserStore = defineStore("loginUser", () => {
  const loginUser = ref<any>(
    JSON.parse(localStorage.getItem("loginUser") || '{"username": "未登录"}')
  );

  // 登出
  async function doLogout() {
    try {
      // 调用后端登出接口，将refreshToken从cookie中清除
      await userLogout(loginUser.value.id);
      // 清除本地登录状态
      loginUser.value = { username: "未登录" };
      // 清除 localStorage 中的用户信息
      localStorage.removeItem("loginUser");
      // 清除 localStorage 中的 token
      localStorage.removeItem("token");
      // 跳转到登录页面
      router.push("/user/login");
    } catch (error) {
      console.error('登出失败', error);
      // 即使后端登出失败，也要清除本地状态
      loginUser.value = { username: "未登录" };
      localStorage.removeItem("loginUser");
      localStorage.removeItem("token");
      // 跳转到登录页面
      router.push("/user/login");
    }
  }

  // 单独设置信息
  function setLoginUser(newLoginUser: any) {
    loginUser.value = newLoginUser;
    localStorage.setItem("userId", newLoginUser.id);
    // 保存到 localStorage
    localStorage.setItem("loginUser", JSON.stringify(newLoginUser));
    if (newLoginUser.token) {
      localStorage.setItem("token", newLoginUser.token);
    }
  }

  return { loginUser, setLoginUser, doLogout };
});
