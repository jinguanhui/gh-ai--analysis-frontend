import router from "@/router";
import { useLoginUserStore } from "@/store/useLoginUserStore";
import { message } from "ant-design-vue";

/**
 * 全局权限校验
 */
router.beforeEach(async (to, from, next) => {
  const loginUserStore = useLoginUserStore();
  const updatedLoginUser = loginUserStore.loginUser;
  const toUrl = to.fullPath;

  // 检查是否需要登录才能访问的页面
  if (toUrl.startsWith("/admin") || toUrl.startsWith("/user") || toUrl.startsWith ("/chart")) {
    // 检查是否为登录页面
    if (to.path === "/user/login" || to.path === "/user/register" || to.path === "/user/center") {
      // 如果是登录页面，直接允许访问
      next();
      return;
    }
    
    // 检查用户是否已登录
    if (!updatedLoginUser || updatedLoginUser.username === "未登录") {
      message.error("请先登录");
      next(`/user/login?redirect=${to.fullPath}`);
      return;
    }
    
    // 如果是管理员页面，检查用户权限
    if (toUrl.startsWith("/admin")) {
      if (!updatedLoginUser || updatedLoginUser.userRole !== 1) {
        message.error("没有权限");
        // next(`/user/login?redirect=${to.fullPath}`);
        return;
      }
    }

    // 如果是管理员页面，检查用户权限
    if (toUrl.startsWith("/chart")) {
      if (!updatedLoginUser) {
        message.error("请先登录");
        // next(`/user/login?redirect=${to.fullPath}`);
        return;
      }
    }
  }
  next();
});
