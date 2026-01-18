<template>
  <div id="globalHeader">
    <a-row :wrap="false">
      <a-col flex="200px">
        <div class="title-bar" @click="goToHome">
          <img class="logo" src="../assets/logo.jpg" alt="logo" />
          <div class="title">GH智能分析</div>
        </div>
      </a-col>
      <a-col flex="auto">
        <a-menu 
          v-model:selectedKeys="current" 
          mode="horizontal" 
          :items="items" 
          @click="doMenuClick"
          :forceSubMenuRender="true"
        />
      </a-col>
      <a-col flex="auto">
        <div class="user-login-status">
          <template v-if="loginUserStore.loginUser.id">
            <!-- 用户已登录，显示下拉菜单 -->
            <a-dropdown placement="bottom">
                <div class="user-info">
                  <img v-if="loginUserStore.loginUser.avatarUrl" :src="loginUserStore.loginUser.avatarUrl" alt="avatar"
                    class="avatar" />
                  <a-spin v-else />
                  <span class="username">{{ loginUserStore.loginUser.username ?? "无名" }}</span>
                </div>
              <template #overlay>
                <a-menu>
                  <a-menu-item v-if="loginUserStore.loginUser.id" @click="doMenuClick({ key: '/user/center' })">
                    <a>个人中心</a>
                  </a-menu-item>
                  <a-menu-item v-if="loginUserStore.loginUser.id" @click="doMenuClick({ key: '/user/accesskey' })">
                    <a>AccessKey密钥</a>
                  </a-menu-item>
                  <a-menu-item v-if="loginUserStore.loginUser.id" @click="doLogout">
                    <a>退出</a>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
          <template v-else>
            <!-- 用户未登录，只显示登录按钮 -->
            <a-button type="primary" href="/user/login">登录</a-button>
          </template>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { h, ref, computed, onMounted, onUnmounted } from "vue";
import { CrownOutlined, HomeOutlined, DownOutlined, BarChartOutlined, PieChartOutlined } from "@ant-design/icons-vue";
import { MenuProps, message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { useLoginUserStore } from "@/store/useLoginUserStore";

const loginUserStore = useLoginUserStore();

const router = useRouter();

// 使用响应式数据存储路由路径
const current = ref<string[]>(["/"]);

// 点击logo和标题跳转到首页
const goToHome = () => {
  router.push('/');
  current.value = ['/'];
};

// 退出登录处理函数
const doLogout = async () => {
  try {
    // 调用登出方法
    await loginUserStore.doLogout();
    // 重定向到登录页面
    router.push('/user/login');
    message.success("退出登录成功");
  } catch (error) {
    console.error('退出登录失败', error);
    message.error("退出登录失败");
  }
};

// 点击菜单后的路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  // 检查是否为需要登录的页面
  // if (key.startsWith('/admin')) {
  //   if (!loginUserStore.loginUser.id || loginUserStore.loginUser.userRole !== 1) {
  //     message.error("没有权限");
  //     router.push('/user/login');
  //     return;
  //   }
  // }
  
  router.push({
    path: key,
  });
};

// 监听路由变化，更新当前菜单选中状态
const handleRouteChange = (to: any) => {
  current.value = [to.path];
};

onMounted(() => {
  // 初始化当前路径
  current.value = [router.currentRoute.value.path];
  
  // 监听路由变化
  router.afterEach((to) => {
    handleRouteChange(to);
  });
});

// 根据用户登录状态和角色动态生成菜单项
const items = computed<MenuProps["items"]>(() => {
  const baseItems = [
    {
      key: "/",
      icon: () => h(HomeOutlined),
      label: "主页",
      title: "主页",
    },
    {
      key: "/chart/analysis",
      icon: () => h(BarChartOutlined),
      label: "AI分析",
      title: "AI分析",
    },
    {
      key: "/chart/chartManage",
      icon: () => h(PieChartOutlined),
      label: "图表管理",
      title: "图表管理",
    }
  ];

  // 如果用户已登录，添加用户相关菜单
  if (loginUserStore.loginUser.id) {
    // 如果用户是管理员，添加管理菜单
    if (loginUserStore.loginUser.userRole === 1) {
      baseItems.push({
        key: "/admin/userManage",
        icon: () => h(CrownOutlined),
        label: "用户管理",
        title: "用户管理",
      });
    }
  }
  return baseItems;
});
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  cursor: pointer; /* 添加手型光标表示可点击 */
}

.title {
  color: black;
  font-size: 18px;
  margin-left: 16px;
}

.logo {
  height: 60px;
}

.user-login-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding-right: 40px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  margin-right: 4px;
  white-space: nowrap; /* 确保用户名不换行 */
  overflow: hidden; /* 防止内容溢出 */
  text-overflow: ellipsis; /* 长文本显示省略号 */
  max-width: 100px; /* 可选：设置最大宽度 */
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

/* 防止ResizeObserver错误的样式优化 */
:deep(.ant-menu) {
  min-width: 0;
}

:deep(.ant-menu-item) {
  min-width: 0;
}

/* 添加下拉菜单项居中对齐样式 */
:deep(.ant-dropdown-menu) {
  text-align: center;
}

:deep(.ant-dropdown-menu-item) {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>