import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import UserLoginPage from "@/pages/user/UserLoginPage.vue";
import UserRegisterPage from "@/pages/user/UserRegisterPage.vue";
import UserManagePage from "@/pages/admin/UserManagePage.vue";
import AIAnalysis from "@/pages/chart/AIAnalysis.vue";
import AccessKeyPage from "@/pages/user/AccessKeyPage.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/chart/analysis",
    name: "aiAnalysis",
    component: AIAnalysis,
  },
  {
    path: "/user/login",
    name: "userLogin",
    component: UserLoginPage,
  },
  {
    path: "/user/register",
    name: "userRegister",
    component: UserRegisterPage,
  },
  {
    path: "/admin/userManage",
    name: "adminUserManage",
    component: UserManagePage,
  },
  // 添加AccessKey页面路由
  {
    path: "/user/accesskey",
    name: "userAccessKey",
    component: AccessKeyPage,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
