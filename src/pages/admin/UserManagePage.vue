<template>
  <div id="userManagePage">
    <!-- 使用a-config-provider包裹整个组件，确保所有Ant Design组件都使用中文 -->
    <a-config-provider :locale="antdLocale">
      <!-- 查询表单 -->
      <a-card title="用户查询" :bordered="false" style="margin-bottom: 20px;">
        <a-form :model="searchForm" layout="vertical" @finish="onSearch">
          <a-row :gutter="24">
            <a-col :span="4">
              <a-form-item label="用户名">
                <a-input v-model:value="searchForm.username" placeholder="请输入用户名" />
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item label="账号">
                <a-input v-model:value="searchForm.userAccount" placeholder="请输入账号" />
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item label="性别">
                <a-select v-model:value="searchForm.gender" placeholder="请选择性别">
                  <a-select-option value="">全部</a-select-option>
                  <a-select-option :value="0">男</a-select-option>
                  <a-select-option :value="1">女</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item label="邮箱">
                <a-input v-model:value="searchForm.email" placeholder="请输入邮箱" />
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item label="手机号">
                <a-input v-model:value="searchForm.phone" placeholder="请输入手机号" />
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item label="用户状态">
                <a-select v-model:value="searchForm.userStatus" placeholder="请选择用户状态">
                  <a-select-option value="">全部</a-select-option>
                  <a-select-option :value="0">正常</a-select-option>
                  <a-select-option :value="1">禁用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item label="用户角色">
                <a-select v-model:value="searchForm.userRole" placeholder="请选择用户角色">
                  <a-select-option value="">全部</a-select-option>
                  <a-select-option :value="0">普通用户</a-select-option>
                  <a-select-option :value="1">管理员</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="16">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="时间范围">
                    <a-range-picker v-model:value="createTimeRange" format="YYYY-MM-DD HH:mm:ss" show-time
                      style="width: 100%;" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-col>
          </a-row>
          <a-row>
            <a-col :span="24" style="text-align: right;">
              <a-button type="primary" html-type="submit" style="margin-right: 8px;">查询</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <a-table :columns="columns" :data-source="data" :scroll="{ x: 2000 }">
        <template #bodyCell="{ column, record, index }">
          <!-- 确保只渲染头像，不显示链接 -->
          <template v-if="column.dataIndex === 'avatarUrl'">
            <div style="display: flex; justify-content: center; align-items: center;">
              <a-avatar :size="80" :src="record.avatarUrl">
                <UserOutlined />
              </a-avatar>
            </div>
          </template>
          <!-- 其他列的渲染保持不变 -->
          <template v-else-if="column.dataIndex === 'id'">
            <!-- id从1开始增加 -->
            {{ index + 1 }}
          </template>
          <template v-else-if="column.dataIndex === 'gender'">
            <span v-if="record.gender === 0">男</span>
            <span v-else-if="record.gender === 1">女</span>
            <span v-else>未设置</span>
          </template>
          <template v-else-if="column.dataIndex === 'userStatus'">
            <a-tag color="green" v-if="record.userStatus === 0">正常</a-tag>
            <a-tag color="red" v-else-if="record.userStatus === 1">禁用</a-tag>
            <span v-else>未设置</span>
          </template>
          <template v-else-if="column.dataIndex === 'userRole'">
            <div v-if="record.userRole === 1">
              <a-tag color="green">管理员</a-tag>
            </div>
            <div v-else>
              <a-tag color="blue">普通用户</a-tag>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ record.createTime ? dayjs(record.createTime).format("YYYY-MM-DD HH:mm:ss") : '无' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="primary" @click="showEditModal(record)">编辑</a-button>
            <a-button danger style="margin-left: 8px;" @click="doDelete(record.id)">删除</a-button>
          </template>
          <template v-else>
            {{ record[column.dataIndex] !== null && record[column.dataIndex] !== undefined ? record[column.dataIndex] :
            '未设置' }}
          </template>
        </template>
      </a-table>

      <!-- 编辑用户对话框 -->
      <a-modal v-model:open="editModalVisible" title="编辑用户" @ok="handleEditSubmit" @cancel="handleEditCancel">
        <a-form :model="editForm" layout="vertical">
          <a-form-item label="用户名">
            <a-input v-model:value="editForm.username" placeholder="请输入用户名" />
          </a-form-item>
          <a-form-item label="账号">
            <a-input v-model:value="editForm.userAccount" placeholder="请输入账号" disabled />
          </a-form-item>
          <a-form-item label="性别">
            <a-select v-model:value="editForm.gender" placeholder="请选择性别">
              <a-select-option :value="0">男</a-select-option>
              <a-select-option :value="1">女</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="邮箱">
            <a-input v-model:value="editForm.email" placeholder="请输入邮箱" />
          </a-form-item>
          <a-form-item label="手机号">
            <a-input v-model:value="editForm.phone" placeholder="请输入手机号" />
          </a-form-item>
          <a-form-item label="用户状态">
            <a-select v-model:value="editForm.userStatus" placeholder="请选择用户状态">
              <a-select-option :value="0">正常</a-select-option>
              <a-select-option :value="1">禁用</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="用户角色">
            <a-select v-model:value="editForm.userRole" placeholder="请选择用户角色">
              <a-select-option :value="0">普通用户</a-select-option>
              <a-select-option :value="1">管理员</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>
    </a-config-provider>
  </div>
</template>

<script lang="ts" setup>
import { deleteUser, searchUsers, updateUser } from "@/api/user";
import { ref, reactive } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
// 导入完整的Ant Design Vue中文本地化配置
import antdLocale from 'ant-design-vue/es/locale/zh_CN';
import 'dayjs/locale/zh-cn';
// 导入用户图标组件
import { UserOutlined } from '@ant-design/icons-vue';

dayjs.locale('zh-cn');

// 数据
const data = ref([]);

// 查询表单
const searchForm = reactive({
  username: "",
  userAccount: "",
  gender: "",
  email: "",
  phone: "",
  userStatus: "",
  userRole: ""
});

// 创建时间范围
const createTimeRange = ref([null, null]);

// 编辑对话框相关
const editModalVisible = ref(false);
const editForm = reactive({
  id: undefined,
  username: "",
  userAccount: "",
  gender: undefined,
  email: "",
  phone: "",
  userStatus: undefined,
  userRole: undefined,
});

// 搜索功能
const onSearch = () => {
  fetchData();
};

// 删除数据
const doDelete = async (id: string) => {
  if (!id) {
    return;
  }
  const deleteMessageKey = 'deleteUserMessage';
  message.loading({ content: '删除用户中...', key: deleteMessageKey });
  try {
    const res = await deleteUser(id);
    if (res.data.code === 200) {
      message.success({ content: '删除成功', key: deleteMessageKey });
      fetchData();
    } else {
      message.error({ content: '删除失败', key: deleteMessageKey });
    }
  } catch (error) {
    message.error({ content: '删除失败', key: deleteMessageKey });
    console.error('删除用户失败:', error);
  }
};

// 显示编辑对话框
const showEditModal = (record: any) => {
  // 复制用户信息到编辑表单
  Object.assign(editForm, record);
  editModalVisible.value = true;
};

// 处理编辑提交
const handleEditSubmit = async () => {
  const updateMessageKey = 'updateUserMessage';
  message.loading({ content: '更新用户中...', key: updateMessageKey });
  try {
    const res = await updateUser(editForm);
    if (res.data.code === 200) {
      message.success({ content: '更新成功', key: updateMessageKey });
      editModalVisible.value = false;
      fetchData();
    } else {
      message.error({ content: '更新失败', key: updateMessageKey });
    }
  } catch (error) {
    message.error({ content: '更新失败', key: updateMessageKey });
    console.error('更新用户失败:', error);
  }
};

// 处理编辑取消
const handleEditCancel = () => {
  editModalVisible.value = false;
  // 重置表单
  Object.assign(editForm, {
    id: undefined,
    username: "",
    userAccount: "",
    gender: undefined,
    email: "",
    phone: "",
    userStatus: undefined,
    userRole: undefined,
  });
};

// 重置查询表单
const handleReset = () => {
  // 重置表单
  Object.assign(searchForm, {
    username: "",
    userAccount: "",
    gender: "",
    email: "",
    phone: "",
    userStatus: "",
    userRole: ""
  });
  // 重置时间范围
  createTimeRange.value = [null, null];
  fetchData();
};

// 表格列配置 - 添加align: 'center'使列名和内容居中
const columns = [
  {
    title: "id",
    dataIndex: "id",
    width: 40,
    align: 'center'
  },
  {
    title: "用户名",
    dataIndex: "username",
    width: 120,
    align: 'center'
  },
  {
    title: "账号",
    dataIndex: "userAccount",
    width: 120,
    align: 'center'
  },
  {
    title: "头像",
    dataIndex: "avatarUrl",
    width: 100,
    align: 'center',
  },
  {
    title: "性别",
    dataIndex: "gender",
    width: 80,
    align: 'center'
  },
  {
    title: "邮箱",
    dataIndex: "email",
    width: 180,
    align: 'center'
  },
  {
    title: "用户状态",
    dataIndex: "userStatus",
    width: 100,
    align: 'center'
  },
  {
    title: "手机号",
    dataIndex: "phone",
    width: 120,
    align: 'center'
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    width: 180,
    align: 'center'
  },
  {
    title: "用户角色",
    dataIndex: "userRole",
    width: 100,
    align: 'center'
  },
  {
    title: "调用次数",
    dataIndex: "invokeCount",
    width: 120,
    align: 'center'
  },
  {
    title: "操作",
    key: "action",
    width: 200,
    align: 'center'
  },
];

// 获取数据
const fetchData = async () => {
  const fetchMessageKey = 'fetchUserMessage';
  message.loading({ content: '加载用户列表中...', key: fetchMessageKey });
  try {
    // 构建查询条件对象，匹配后端UserQueryDto
    const userQueryDto = {
      username: searchForm.username,
      userAccount: searchForm.userAccount,
      gender: searchForm.gender !== "" ? Number(searchForm.gender) : undefined,
      email: searchForm.email,
      phone: searchForm.phone,
      userStatus: searchForm.userStatus !== "" ? Number(searchForm.userStatus) : undefined,
      userRole: searchForm.userRole !== "" ? Number(searchForm.userRole) : undefined,
      beginTime: createTimeRange.value[0] ? createTimeRange.value[0] : undefined,
      endTime: createTimeRange.value[1] ? createTimeRange.value[1] : undefined
    };

    const res = await searchUsers(userQueryDto);
    if (res.data.data) {
      data.value = res.data.data;
      message.success({ content: '加载用户列表成功', key: fetchMessageKey, duration: 1 });
    } else {
      message.error({ content: '获取数据失败', key: fetchMessageKey });
    }
  } catch (error) {
    message.error({ content: '获取数据失败', key: fetchMessageKey });
    console.error('获取用户列表失败:', error);
  }
};

// 初始加载数据
fetchData();
</script>

<style scoped>
/* 可以添加一些额外的样式来美化表格 */
:deep(.ant-table-thead > tr > th) {
  text-align: center !important;
}

:deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}
</style>