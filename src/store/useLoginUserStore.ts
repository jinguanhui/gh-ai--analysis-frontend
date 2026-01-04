import { defineStore } from "pinia";
import { ref } from "vue";
import { getCurrentUser, userLogout } from "@/api/user";
import { message } from "ant-design-vue";
import router from "@/router";

export const useLoginUserStore = defineStore("loginUser", () => {
  const loginUser = ref<any>(
    JSON.parse(localStorage.getItem("loginUser") || '{"username": "未登录"}')
  );

  // 远程获取登录用户信息
  async function fetchLoginUser() {
    try {
      const res = await getCurrentUser();
      if (res.data.code === 200 && res.data.data) {
        loginUser.value = res.data.data;
        // 保存到 localStorage
        localStorage.setItem("loginUser", JSON.stringify(res.data.data));
      } else {
        // 用户没有登录，跳转到登录页面
        message.error("请登录！");
        // 跳转到登录页面，并保存当前页面的路径，以便登录后返回
        router.push({
          path: "/user/login",
          query: { redirect: window.location.href }
        });
      }
    } catch (error) {
      console.error("获取用户信息失败", error);
      message.error("获取用户信息失败，请登录！");
      // 发生错误时也跳转到登录页面
      router.push({
        path: "/user/login",
        query: { redirect: window.location.href }
      });
    }
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
      // 跳转到登录页面
      router.push("/user/login");
    } catch (error) {
      console.error('登出失败', error);
      // 即使后端登出失败，也要清除本地状态
      loginUser.value = { username: "未登录" };
      localStorage.removeItem("loginUser");
      // 跳转到登录页面
      router.push("/user/login");
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
