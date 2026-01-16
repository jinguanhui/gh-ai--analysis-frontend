<template>
  <div id="userSelfCenter">
    <a-card title="个人中心" class="user-center-card">
      <div v-if="isLoading" class="loading-container">
        <a-spin size="large" />
        <span class="loading-text">加载用户信息中...</span>
      </div>
      
      <div v-else-if="error" class="error-container">
        <a-alert type="error" message="加载失败" description="获取用户信息失败，请稍后重试" show-icon />
      </div>
      
      <div v-else>
        <!-- 用户头像和基本信息 -->
        <div class="user-basic-info">
          <div class="avatar-container">
            <a-avatar :size="120" :src="userInfo.avatarUrl || ''" icon="user" />
          </div>
          <div class="basic-info-content">
            <h2>{{ userInfo.username || userInfo.userAccount }}</h2>
            <p class="user-role">{{ userInfo.userRole === 1 ? '管理员' : '普通用户' }}</p>
            <p class="user-status">{{ userInfo.userStatus === 0 ? '正常' : '禁用' }}</p>
          </div>
        </div>
        
        <!-- 用户详细信息表格 -->
        <div class="user-details">
          <h3>用户详细信息</h3>
          <a-table 
            :columns="columns" 
            :data-source="userDetailsData" 
            :pagination="false" 
            bordered
            size="middle"
          />
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { searchUserOne } from '@/api/user';
import { useLoginUserStore } from '@/store/useLoginUserStore';

// 定义用户信息类型
interface UserInfo {
  id: number;
  username: string | null;
  userAccount: string;
  avatarUrl: string | null;
  gender: number | null;
  userPassword: string | null;
  email: string | null;
  userStatus: number;
  phone: string | null;
  createTime: string;
  updateTime: string | null;
  isDelete: number | null;
  userRole: number;
  salt: string | null;
  invokeCount: number | null;
  token: string | null;
}

// 状态管理
const loginUserStore = useLoginUserStore();
const userInfo = ref<UserInfo>({ ...loginUserStore.loginUser });
const isLoading = ref(true);
const error = ref(false);

// 表格列定义
const columns = [
  {
    title: '字段名称',
    dataIndex: 'field',
    key: 'field',
    width: 150,
    align: 'center'
  },
  {
    title: '字段值',
    dataIndex: 'value',
    key: 'value',
    ellipsis: true
  }
];

// 处理用户详细信息数据
const userDetailsData = ref([
  { field: '用户ID', value: userInfo.value.id, key: 'id' },
  { field: '用户名', value: userInfo.value.username || '未设置', key: 'username' },
  { field: '账号', value: userInfo.value.userAccount, key: 'userAccount' },
  { field: '性别', value: userInfo.value.gender === null ? '未设置' : (userInfo.value.gender === 1 ? '男' : '女'), key: 'gender' },
  { field: '邮箱', value: userInfo.value.email || '未设置', key: 'email' },
  { field: '手机号', value: userInfo.value.phone || '未设置', key: 'phone' },
  { field: '状态', value: userInfo.value.userStatus === 0 ? '正常' : '禁用', key: 'userStatus' },
  { field: '角色', value: userInfo.value.userRole === 1 ? '管理员' : '普通用户', key: 'userRole' },
  { field: '注册时间', value: userInfo.value.createTime ? new Date(userInfo.value.createTime).toLocaleString() : '未知', key: 'createTime' },
  { field: '更新时间', value: userInfo.value.updateTime ? new Date(userInfo.value.updateTime).toLocaleString() : '未知', key: 'updateTime' },
  { field: '调用次数', value: userInfo.value.invokeCount || 0, key: 'invokeCount' }
]);

// 加载用户信息
const loadUserInfo = async () => {
  isLoading.value = true;
  error.value = false;
  try {
    const response = await searchUserOne();
    if (response.code === 200) {
      // 更新用户信息，不包含敏感字段
      const { userPassword, salt, token, ...safeUserInfo } = response.data;
      userInfo.value = safeUserInfo;
      
      // 更新本地存储
      loginUserStore.setLoginUser(safeUserInfo);
      
      // 更新表格数据
      updateUserDetailsData();
      
      message.success('加载用户信息成功');
    } else {
      message.error(`加载失败: ${response.message}`);
      error.value = true;
    }
  } catch (err) {
    console.error('加载用户信息出错:', err);
    message.error('加载用户信息失败，请稍后重试');
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

// 更新表格数据
const updateUserDetailsData = () => {
  userDetailsData.value = [
    { field: '用户ID', value: userInfo.value.id, key: 'id' },
    { field: '用户名', value: userInfo.value.username || '未设置', key: 'username' },
    { field: '账号', value: userInfo.value.userAccount, key: 'userAccount' },
    { field: '性别', value: userInfo.value.gender === null ? '未设置' : (userInfo.value.gender === 1 ? '男' : '女'), key: 'gender' },
    { field: '邮箱', value: userInfo.value.email || '未设置', key: 'email' },
    { field: '手机号', value: userInfo.value.phone || '未设置', key: 'phone' },
    { field: '状态', value: userInfo.value.userStatus === 0 ? '正常' : '禁用', key: 'userStatus' },
    { field: '角色', value: userInfo.value.userRole === 1 ? '管理员' : '普通用户', key: 'userRole' },
    { field: '注册时间', value: userInfo.value.createTime ? new Date(userInfo.value.createTime).toLocaleString() : '未知', key: 'createTime' },
    { field: '更新时间', value: userInfo.value.updateTime ? new Date(userInfo.value.updateTime).toLocaleString() : '未知', key: 'updateTime' },
    { field: '调用次数', value: userInfo.value.invokeCount || 0, key: 'invokeCount' }
  ];
};

// 组件挂载时加载用户信息
onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped>
#userSelfCenter {
  padding: 20px 0;
}

.user-center-card {
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.loading-text {
  margin-top: 16px;
  color: #666;
}

.error-container {
  margin: 20px 0;
}

.user-basic-info {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-container {
  margin-right: 32px;
}

.basic-info-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.user-role, .user-status {
  margin: 4px 0;
  color: #666;
}

.user-details h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-center-card {
    margin: 0 16px;
  }
  
  .user-basic-info {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar-container {
    margin-right: 0;
    margin-bottom: 16px;
  }
}
</style>