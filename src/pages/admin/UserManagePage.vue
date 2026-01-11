<template>
  <div id="userManagePage">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <a-input-search
        style="max-width: 320px;"
        v-model:value="searchValue"
        placeholder="输入用户名搜索"
        enter-button="搜索"
        size="large"
        @search="onSearch"
      />
      <a-button @click="handleRefresh">刷新</a-button>
    </div>
    <a-table :columns="columns" :data-source="data">
      <!-- 表格内容保持不变 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'avatarUrl'">
          <a-image :src="record.avatarUrl" :width="120" />
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
          {{ dayjs(record.createTime).format("YYYY-MM-DD HH:mm:ss") }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button danger @click="doDelete(record.id)">删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>
<script lang="ts" setup>
import { deleteUser, searchUsers } from "@/api/user";
import { ref } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";

const searchValue = ref("");
// 数据
const data = ref([]);

// 搜索功能
const onSearch = () => {
  fetchData(searchValue.value);
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

const columns = [
  {
    title: "id",
    dataIndex: "id",
  },
  {
    title: "用户名",
    dataIndex: "username",
  },
  {
    title: "账号",
    dataIndex: "userAccount",
  },
  {
    title: "头像",
    dataIndex: "avatarUrl",
  },
  {
    title: "性别",
    dataIndex: "gender",
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
  },
  {
    title: "用户角色",
    dataIndex: "userRole",
  },
  {
    title: "操作",
    key: "action",
  },
];

// 获取数据
const fetchData = async (username = "") => {
  const fetchMessageKey = 'fetchUserMessage';
  message.loading({ content: '加载用户列表中...', key: fetchMessageKey });
  try {
    const res = await searchUsers(username);
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

// 刷新数据
const handleRefresh = () => {
  fetchData(searchValue.value);
};

fetchData();
</script>