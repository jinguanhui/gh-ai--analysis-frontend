<template>
    <div class="access-key-page">
        <h1 style="padding-bottom: 30px;">PublicKey管理</h1>
        <div class="alert-item">
            <a-alert message="PublicKey 是访问AI服务 API 的密钥，主账号 PublicKey 具有该账户的完全权限风险高，2025年8月18日起主账号 PublicKey
                数量配额将调整为 1 个。" type="info" show-icon />
        </div>
        <div class="alert-item">
            <a-alert message="PublicKey 在线时间越长，泄露风险越高。您应定期创建新 PublicKey 替代旧的，建议 PublicKey 的轮换周期为90天。现在立即检测和治理现有 PublicKey 的使用风险。"
                type="info" show-icon />
        </div>
        <h2 style="padding-top: 30px;">PublicKey</h2>
        <a-alert message="当前账号只能绑定 1 个 PublicKey" type="warning" show-icon />
        <!-- 头部按钮区域 -->
        <div class="access-key-header">
            <a-button type="primary" @click="handleCreateAccessKeyClick">创建PublicKey</a-button>
            <a-button @click="handleSetMaxIdleTime" style="margin-left: 12px;">设置最大闲置时间</a-button>
            <a-button @click="handleRefresh" style="margin-left: auto;">刷新</a-button>
        </div>

        <!-- 表格区域 -->
        <a-table :columns="columns" :data-source="accessKeys" :row-key="(record) => record.accessKey"
            :pagination="false">
            <!-- 状态列自定义渲染 -->
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                    <span v-if="record.status === 0" style="color: green;">启用</span>
                    <span v-else style="color: red;">禁用</span>
                </template>
                <template v-else-if="column.key === 'actions'">
                    <a-button size="small" :type="record.status === 0 ? 'default' : 'primary'" danger
                        @click="handleDisAble(record)" :disabled="record.status === 1">
                        {{ '禁用' }}
                    </a-button>
                </template>
                <template v-else-if="column.key === 'publicKey'">
                    <a-tooltip>
                        <span>{{ maskString(record.publicKey) }}</span>
                    </a-tooltip>
                </template>
                <template v-else-if="['lastUsedTime', 'expireTime', 'createTime'].includes(column.key)">
                    <span>{{ formatDateTime(record[column.key as keyof AccessKey] as string) }}</span>
                </template>
                <template v-else-if="['leftTime'].includes(column.key)">
                    <span>{{ record.leftTime }} 天 {{ record.leftTimeHour }} 小时</span>
                </template>
            </template>
        </a-table>

        <!-- 创建AccessKey弹窗 -->
        <a-modal v-model:open="createModalVisible" title="创建EncryptPublicKey" ok-text="确认" cancel-text="取消"
            :mask-closable="false" :closable="false" @ok="handleCreateAccessKey" @cancel="createModalVisible = false">
            <div class="key-item">
                <a-alert message="PublicKey:" type="info"
                    style="display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; margin-right: 8px; font-size: 14px;" />
                <span class="value">{{ newAccessKey.publicKey }}</span>
            </div>
            <a-alert message="警告" description="请妥善保存PublicKey，关闭后将无法查看！！！" type="warning" show-icon />
        </a-modal>

        <!-- 设置最大闲置时间弹窗 -->
        <a-modal v-model:open="idleTimeModalVisible" title="设置最大闲置时间（天）" ok-text="确认" cancel-text="取消"
            @cancel="handleCancelIdleTime" @ok="handleOkIdleTime">
            <a-form-model :model="idleTimeForm" layout="vertical">
                <a-alert message="你只能设置最大闲置时间为 30 天" type="warning" show-icon style="margin-bottom: 12px;" />
                <a-form-model-item label="最大闲置时间">
                    <a-input-number v-model:value="idleTimeForm.maxIdleTime" :min="1" :max="30" />
                </a-form-model-item>
            </a-form-model>
        </a-modal>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { listAccessKeys, createAccessKeys, disableAccessKeys, deleteAccessKeys, setAccessKeyIdleTime } from '@/api/accessKey';

// 定义AccessKey接口
interface AccessKey {
    publicKey: string;
    status: number;
    lastUsedTime: string;
    expireTime: string;
    createTime: string;
}

// 表格列定义 - 时间列格式已优化
const columns = [
    { title: 'PublicKey', dataIndex: 'publicKey', key: 'publicKey' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '最后使用服务时间', dataIndex: 'lastUsedTime', key: 'lastUsedTime' },
    { title: '过期时间', dataIndex: 'expireTime', key: 'expireTime' },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
    { title: '距离过期时间', dataIndex: 'leftTime', key: 'leftTime' },
    { title: '操作', key: 'actions', width: 150 }
];

// 数据
const accessKeys = ref<AccessKey[]>([]);
const createModalVisible = ref(false);
const idleTimeModalVisible = ref(false);
const newAccessKey = ref({ publicKey: '' });
const idleTimeForm = ref({ maxIdleTime: 30 });

// 定义消息更新的key
const loadAccessKeyKey = 'loadAccessKey';

// 加载AccessKey列表
const loadAccessKeys = async () => {
    // 显示加载中的message，使用key
    message.loading({ content: '正在加载PublicKey列表...', key: loadAccessKeyKey });

    try {
        const response = await listAccessKeys();
        
        if (response.data.code === 200) {
            // 确保返回的数据是数组格式
            const data = response.data.data;
            accessKeys.value = Array.isArray(data) ? data : [data];
            localStorage.setItem('publicKeys', JSON.stringify(accessKeys.value.map(item => item.publicKey)));
            // 使用相同的key更新消息为成功
            message.success({ content: '加载PublicKey列表成功', key: loadAccessKeyKey, duration: 2 });
        } else {
            // 使用相同的key更新消息为失败
            message.error({ content: '加载PublicKey列表失败', key: loadAccessKeyKey, duration: 2 });
            accessKeys.value = [];
        }
    } catch (error) {
        // 使用相同的key更新消息为失败
        message.error({ content: '加载PublicKey列表失败', key: loadAccessKeyKey, duration: 2 });
        console.error('加载PublicKey列表失败:', error);
        accessKeys.value = [];
    }
};

// 创建AccessKey - 点击按钮触发此方法
const handleCreateAccessKey = async () => {

    try {
        createModalVisible.value = false;
        if (!newAccessKey.value.publicKey) {
            message.error('PublicKey为空');
            return;
        } else {
            message.success('PublicKey创建成功');
        }
        loadAccessKeys();
    } catch (error) {
        message.error('创建PublicKey失败');
        console.error('创建PublicKey失败:', error);
    }
};

const handleCreateAccessKeyClick = async () => {
    // 定义消息更新的key
    const createKey = 'createAccessKey';
    
    // 显示加载中的message，使用key
    message.loading({ content: '正在创建PublicKey...', key: createKey });

    try {
        const response = await createAccessKeys();
        
        if (response.data.code === 200) {
            newAccessKey.value.publicKey = response.data.data.publicKey;
            createModalVisible.value = true; // 显示弹窗
            // 使用相同的key更新消息为成功
            localStorage.setItem('publicKey', response.data.data.publicKey);
            message.success({ content: '创建PublicKey成功', key: createKey, duration: 2 });
        } else {
            // 使用相同的key更新消息为失败
            message.error({ content: '创建PublicKey失败: ' + response.data.message, key: createKey, duration: 2 });
        }
    } catch (error) {
        // 使用相同的key更新消息为失败
        message.error({ content: '创建PublicKey失败', key: createKey, duration: 2 });
        console.error('创建PublicKey失败:', error);
    }
};


// 设置最大闲置时间
const handleSetMaxIdleTime = () => {
    idleTimeModalVisible.value = true;
};

const handleCancelIdleTime = () => {
    idleTimeModalVisible.value = false;
};

// 处理设置最大闲置时间的确认按钮
const handleOkIdleTime = async () => {
    // 定义消息更新的key
    const idleTimeKey = 'setIdleTime';
    
    // 显示加载中的message，使用key
    message.loading({ content: '正在设置最大闲置时间...', key: idleTimeKey });

    try {
        const response = await setAccessKeyIdleTime(idleTimeForm.value.maxIdleTime);
        
        if (response.data.code === 200) {
            // 使用相同的key更新消息为成功
            message.success({ content: '最大闲置时间设置成功', key: idleTimeKey, duration: 2 });
            idleTimeModalVisible.value = false;
            loadAccessKeys(); // 刷新列表以查看更新后的过期时间
        } else {
            // 使用相同的key更新消息为失败
            message.error({ content: '设置失败: ' + response.data.message, key: idleTimeKey, duration: 2 });
        }
    } catch (error) {
        // 使用相同的key更新消息为失败
        message.error({ content: '设置失败', key: idleTimeKey, duration: 2 });
        console.error('设置最大闲置时间失败:', error);
    }
};

// 刷新
const handleRefresh = () => {
    loadAccessKeys();
};


// 禁用
const handleDisAble = async (record: AccessKey) => {
    // 定义消息更新的key
    const disableKey = 'disableAccessKey';
    
    // 显示加载中的message，使用key
    message.loading({ content: '正在禁用PublicKey...', key: disableKey });

    try {
        const response = await disableAccessKeys();
        
        if (response.data.code === 200) {
            // 使用相同的key更新消息为成功
            message.success({ content: '操作成功', key: disableKey, duration: 2 });
            loadAccessKeys();
        } else {
            // 使用相同的key更新消息为失败
            message.error({ content: '操作失败' + response.data.message, key: disableKey, duration: 2 });
        }
    } catch (error) {
        // 使用相同的key更新消息为失败
        message.error({ content: '操作失败', key: disableKey, duration: 2 });
        console.error('操作失败:', error);
    }
};

// 页面加载时初始化数据
onMounted(() => {
    loadAccessKeys();
});

// 字符串部分隐藏显示函数
const maskString = (str: string): string => {
    if (!str || str.length <= 12) {
        return str;
    }
    const start = str.substring(0, 6);
    const end = str.substring(str.length - 4);
    return `${start}...${end}`;
};

// 时间格式化函数 - 转换为年月日时分秒格式
const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return '';

    // 检查是否为时间戳（数字字符串）
    const timestamp = /^\d+$/.test(dateStr) ? parseInt(dateStr) * 1000 : dateStr;

    const date = new Date(timestamp);

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${dateStr}`);
        return dateStr; // 返回原始值如果日期无效
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
</script>

<style scoped>
.key-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
}

.label {
    font-weight: 500;
    min-width: 80px;
    padding-right: 8px;
}

.value {
    flex: 1;
    word-break: break-all;
}

.alert-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: #333;
}

.alert-item a {
    text-decoration: underline;
}

.access-key-page {
    padding: 20px;
}

.access-key-header {
    display: flex;
    margin-bottom: 20px;
    align-items: center;
    padding-top: 12px;
}

.access-key-header a-button {
    margin-right: 10px;
}
</style>