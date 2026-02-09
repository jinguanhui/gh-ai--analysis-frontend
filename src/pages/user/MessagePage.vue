<template>
    <div class="message-page">
        <div class="message-container">
            <!-- 消息类型标签页 -->
            <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
                <a-tab-pane key="comment" tab="评论互动" />
                <a-tab-pane key="like" tab="赞和收藏" />
                <a-tab-pane key="follow" tab="新增关注" />
                <a-tab-pane key="system" tab="系统通知" />
                <a-tab-pane key="private" tab="私信" />
                <a-tab-pane key="order" tab="订单消息">
                    <!-- 订单状态过滤标签 -->
                    <div class="order-status-filter">
                        <a-radio-group v-model:value="orderStatus" button-style="solid" @change="handleStatusChange">
                            <a-radio-button :value="null">全部</a-radio-button>
                            <a-radio-button :value="0">待支付</a-radio-button>
                            <a-radio-button :value="1">支付成功</a-radio-button>
                            <a-radio-button :value="2">已退款</a-radio-button>
                            <a-radio-button :value="3">已取消</a-radio-button>
                            <a-radio-button :value="4">已完成</a-radio-button>
                        </a-radio-group>
                        <div class="mark-all-read">
                            <a-button type="text">全部已读</a-button>
                        </div>
                    </div>

                    <!-- 订单列表 -->
                    <div class="order-list-container">
                        <a-empty v-if="orderList.length === 0" description="暂无订单" />
                        <a-list v-else :data-source="orderList" :loading="loading" :pagination="pagination"
                            @change="handlePageChange">
                            <template #renderItem="{ item: order }">
                                <a-list-item>
                                    <a-list-item-meta>
                                        <template #title>
                                            <div class="order-title">
                                                <span class="order-id">订单ID: {{ order.id }}</span>
                                                <span :class="getStatusClass(order.status)">{{
                                                    getStatusText(order.status) }}</span>
                                            </div>
                                        </template>
                                        <template #description>
                                            <div class="order-description">
                                                <p>商品名称: 10元续费100次AI分析</p>
                                                <p>下单时间: {{ formatDate(order.createTime) }}</p>
                                                <p>金额: ¥{{ order.money?.toFixed(2) }}</p>
                                            </div>
                                        </template>
                                    </a-list-item-meta>
                                    <!-- 订单操作按钮 -->
                                    <div class="order-actions">
                                        <a-button v-if="order.status === 0" type="primary" @click="handlePay(order)">
                                            立即支付
                                        </a-button>
                                        <a-button v-if="order.status === 0" type="text" @click="handleCancel(order)">
                                            取消订单
                                        </a-button>
                                        <a-button type="text" @click="handleDetail(order)">
                                            查看详情
                                        </a-button>
                                    </div>
                                </a-list-item>
                            </template>
                        </a-list>
                    </div>
                </a-tab-pane>
            </a-tabs>
        </div>
        <!-- 支付模态框 -->
        <a-modal v-model:open="payModalVisible" title="订单详情" @cancel="handlePayCancel" :footer="null"
            :maskClosable="false" :keyboard="false">
            <div class="order-detail-container">
                <div class="order-success">
                    <h3>订单提交成功，请尽快完成支付！</h3>
                    <p>请在 <span style="color: #ff4d4f;">15分钟</span> 内完成支付，超时后将取消订单</p>
                </div>
                <div class="order-info">
                    <div class="order-item">
                        <span class="label">商品名称：</span>
                        <span class="value">10元续费100次AI分析</span>
                    </div>
                    <div class="order-item">
                        <span class="label">下单时间：</span>
                        <span class="value">{{ formatDate(selectedOrder.createTime) }}</span>
                    </div>
                </div>
                <div class="order-amount">
                    <span class="label">待支付总金额：</span>
                    <span class="value">{{ selectedOrder.money?.toFixed(2) }} 元</span>
                </div>
                <div class="payment-methods">
                    <h4>支付方式：</h4>
                    <div class="payment-buttons">
                        <a-button @click="handleWechatPay">
                            <img src="@/assets/wechat.png" />微信支付</a-button>
                        <a-button @click="handleAlipay">
                            <img src="@/assets/alipay.png" />
                            支付宝
                        </a-button>
                    </div>
                </div>
            </div>
        </a-modal>

        <!-- 订单详情模态框 -->
        <a-modal v-model:open="detailModalVisible" title="订单详情" @cancel="handleDetailCancel" :footer="null"
            :loading="detailLoading">
            <div class="order-detail-container">
                <div class="order-info">
                    <div class="order-item">
                        <span class="label">订单ID：</span>
                        <span class="value">{{ detailOrder.id }}</span>
                    </div>
                    <div class="order-item">
                        <span class="label">商品名称：</span>
                        <span class="value">10元续费100次AI分析</span>
                    </div>
                    <div class="order-item">
                        <span class="label">订单状态：</span>
                        <span :class="getStatusClass(detailOrder.status)">{{ getStatusText(detailOrder.status) }}</span>
                    </div>
                    <div class="order-item">
                        <span class="label">支付金额：</span>
                        <span class="value">¥{{ detailOrder.money?.toFixed(2) }}</span>
                    </div>
                    <div class="order-item">
                        <span class="label">支付方式：</span>
                        <span class="value">{{ formatPaymentMethod(detailOrder.paymentMethod) || '未支付' }}</span>
                    </div>
                    <div class="order-item">
                        <span class="label">下单时间：</span>
                        <span class="value">{{ formatDate(detailOrder.createTime) || '未下单' }}</span>
                    </div>
                    <div class="order-item">
                        <span class="label">支付时间：</span>
                        <span class="value">{{ formatDate(detailOrder.payTime) || '未支付' }}</span>
                    </div>
                    <div class="order-item" v-if="detailOrder.description">
                        <span class="label">订单描述：</span>
                        <span class="value">{{ detailOrder.description }}</span>
                    </div>
                </div>
            </div>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { getOrderList, alipay, getOrderDetail } from '@/api/order';

// 消息标签页
const activeTab = ref('order'); // 默认显示订单消息

// 订单状态过滤
const orderStatus = ref<number | null>(null);

// 支付模态框相关
const payModalVisible = ref(false);
const selectedOrder = reactive<Order>({});

// 订单详情模态框相关
const detailModalVisible = ref(false);
const detailOrder = reactive<Order>({});
const detailLoading = ref(false);

// 订单列表数据
interface Order {
    id?: number;
    userId?: number;
    money?: number;
    paymentMethod?: string;
    status?: number;
    description?: string;
    createTime?: Date;
    updateTime?: Date;
    payTime?: Date;

}

const orderList = ref<Order[]>([]);
const loading = ref(false);

// 分页配置
const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total) => `总数 ${total}`
});

// 处理支付方式文本
const formatPaymentMethod = (method: string) => {
    switch (method) {
        case 'WECHAT':
            return '微信支付';
        case 'ALIPAY':
            return '支付宝';
        default:
            return '未支付';
    }
};

// 处理标签页切换
const handleTabChange = (key: string) => {
    activeTab.value = key;
    if (key === 'order') {
        // 切换到订单标签时重新加载数据
        loadOrderList();
    }
};

// 处理订单状态变化
const handleStatusChange = () => {
    // 状态变化时重置页码并重新加载数据
    pagination.value.current = 1;
    loadOrderList();
};

// 处理分页变化
const handlePageChange = (pageConfig: any) => {
    pagination.value.current = pageConfig.current;
    pagination.value.pageSize = pageConfig.pageSize;
    loadOrderList();
};

// 加载订单列表
const loadOrderList = async () => {
    loading.value = true;
    try {
        const response = await getOrderList({
            current: pagination.value.current,
            pageSize: pagination.value.pageSize,
            status: orderStatus.value
        });

        if (response.data.code === 200 && response.data.data) {
            orderList.value = response.data.data.records || [];
            pagination.value.total = response.data.data.total || 0;
        } else {
            message.error('获取订单列表失败');
        }
    } catch (error) {
        console.error('获取订单列表失败:', error);
        message.error('获取订单列表失败');
    } finally {
        loading.value = false;
    }
};

// 获取订单状态文本
const getStatusText = (status?: number) => {
    const statusMap: Record<number, string> = {
        0: '待支付',
        1: '支付成功',
        2: '已退款',
        3: '已取消',
        4: '已完成'
    };
    return statusMap[status || 0] || '未知状态';
};

// 获取订单状态样式类
const getStatusClass = (status?: number) => {
    return `status-${status}`;
};

// 格式化日期
const formatDate = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString();
};

// 处理支付
const handlePay = (order: Order) => {
    // 复制订单信息到选中订单
    Object.assign(selectedOrder, order);
    // 打开支付模态框
    payModalVisible.value = true;
};
// 处理支付模态框取消
const handlePayCancel = () => {
    payModalVisible.value = false;
};
// 处理微信支付
const handleWechatPay = () => {
    message.info('微信支付功能开发中');
};
// 处理支付宝支付
const handleAlipay = async () => {
    payModalVisible.value = false;
    const payMessageKey = 'alipayMessage';
    message.loading({ content: '正在跳转到支付宝支付页面...', key: payMessageKey });

    try {
        // 调用后端支付宝支付API
        const response = await alipay({
            id: selectedOrder.id,
            money: selectedOrder.money
        });

        if (response.data.code === 200 && response.data.data) {
            const payHtml = response.data.data;

            // 创建一个新窗口
            const payWindow = window.open('', '_self');
            if (!payWindow) {
                message.error({ content: '无法打开支付窗口，请检查浏览器弹窗设置', key: payMessageKey });
                return;
            }

            // 在新窗口中写入支付HTML
            payWindow.document.write(payHtml);
            payWindow.document.close();

            message.success({ content: '正在跳转到支付宝支付页面...', key: payMessageKey });

        } else {
            message.error({ content: '获取支付页面失败', key: payMessageKey });
        }
    } catch (error) {
        console.error('支付宝支付失败:', error);
        message.error({ content: '支付宝支付失败', key: payMessageKey });
    }
};

// 处理取消订单
const handleCancel = (order: Order) => {
    message.info(`订单 ${order.id} 取消功能开发中`);
};

// 处理查看详情
const handleDetail = async (order: Order) => {
  detailLoading.value = true;
  try {
    const response = await getOrderDetail({
      id: order.id
    });
    
    if (response.data.code === 200 && response.data.data) {
      // 复制订单详情到详情订单对象
      Object.assign(detailOrder, response.data.data);
      // 打开详情模态框
      detailModalVisible.value = true;
    } else {
      message.error('获取订单详情失败');
    }
  } catch (error) {
    console.error('获取订单详情失败:', error);
    message.error('获取订单详情失败');
  } finally {
    detailLoading.value = false;
  }
};
// 处理详情模态框取消
const handleDetailCancel = () => {
  detailModalVisible.value = false;
  // 清空详情订单信息
  Object.keys(detailOrder).forEach(key => {
    delete detailOrder[key as keyof Order];
  });
};

// 页面加载时初始化数据
onMounted(() => {
    if (activeTab.value === 'order') {
        loadOrderList();
    }
});
</script>

<style scoped>
/* 订单详情模态框样式 */
.order-detail-container {
    padding: 20px 0;
}

.order-success {
    margin-bottom: 20px;
}

.order-success h3 {
    color: #52c41a;
    margin-bottom: 8px;
}

.order-success p {
    color: #666;
    font-size: 14px;
}

.order-info {
    margin-bottom: 20px;
}

.order-item {
    display: flex;
    margin-bottom: 12px;
    font-size: 16px;
}

.order-item .label {
    width: 100px;
    color: #666;
}

.order-item .value {
    color: #333;
    font-weight: 500;
}

.order-amount {
    margin-bottom: 30px;
    padding: 10px 0;
    border-top: 1px dashed #f0f0f0;
    border-bottom: 1px dashed #f0f0f0;
}

.order-amount .label {
    font-size: 18px;
    color: #666;
}

.order-amount .value {
    font-size: 24px;
    color: #ff4d4f;
    font-weight: bold;
}

.payment-methods h4 {
    margin-bottom: 16px;
    color: #333;
}

.payment-buttons {
    width: 100%;
    height: 100%;
    display: flex;
    gap: 16px;
}

.payment-buttons img {
    height: 1.5em;
    width: auto;
    vertical-align: middle;
    margin-right: 4px;
}

.message-page {
    padding: 20px;
    background-color: #f0f2f5;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.message-container {
    width: 100%;
    max-width: 1400px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 20px;
}

/* 订单消息样式 */
.order-status-filter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
}

.mark-all-read {
    text-align: right;
}

.order-list-container {
    margin-top: 20px;
}

.order-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.order-id {
    font-weight: 500;
}

.status-0 {
    color: #ff4d4f;
}

.status-1 {
    color: #52c41a;
}

.status-2 {
    color: #faad14;
}

.status-3 {
    color: #8c8c8c;
}

.status-4 {
    color: #1890ff;
}

.order-description p {
    margin: 8px 0;
    color: #666;
}

.order-actions {
    display: flex;
    gap: 10px;
}
</style>