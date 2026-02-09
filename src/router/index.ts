import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import UserLoginPage from "@/pages/user/UserLoginPage.vue";
import UserRegisterPage from "@/pages/user/UserRegisterPage.vue";
import UserManagePage from "@/pages/admin/UserManagePage.vue";
import AIAnalysis from "@/pages/chart/AIAnalysis.vue";
import AccessKeyPage from "@/pages/user/AccessKeyPage.vue";
import MyChart from "@/pages/chart/MyChart.vue";
import UserSelfCenter from "@/pages/user/UserSelfCenter.vue";
import ChartDetail from "@/pages/chart/ChartDetail.vue";
import AIAnalysisAsync from "@/pages/chart/AIAnalysisAsync.vue";
import { KeepAlive } from "vue";
import AIAnalysisByMq from "@/pages/chart/AIAnalysisByMq.vue";
import MessagePage from "@/pages/user/MessagePage.vue";

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
    path: "/chart/analysis/mq",
    name: "aIAnalysisByMq",
    component: AIAnalysisByMq,
    
  },
  {
    path: "/chart/analysis/async",
    name: "aiAnalysisAsync",
    component: AIAnalysisAsync,
    
  },
  {
    path: "/chart/chartManage",
    name: "chartManage",
    component: MyChart,
    meta: {
      KeepAlive: true
    }
  },
  {
    path: "/chart/detail/:id",
    name: "chartDetail",
    component: ChartDetail,
  },
  {
    path: "/user/message",
    name: "userMessage",
    component: MessagePage,
  },
  {
    path: "/user/login",
    name: "userLogin",
    component: UserLoginPage,
  },
  {
    path: "/user/center",
    name: "userCenter",
    component: UserSelfCenter,
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
