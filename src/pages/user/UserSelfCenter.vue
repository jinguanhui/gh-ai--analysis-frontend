<template>
  <div class="user-self-center">
    <div class="main-content">
      <!-- 左侧内容区 -->
      <div class="left-content">
        <!-- 我的账号卡片 -->
        <a-card title="我的账号" :bordered="false" class="account-card">
          <!-- 用户基本信息 -->
          <div class="user-basic-info">
            <div class="avatar-section">
              <a-avatar :size="80" :src="userInfo.avatarUrl" @click="handleAvatarClick">
                <UserOutlined />
              </a-avatar>
            </div>
            <div class="info-section">
              <div class="login-info">
                <div class="login-name">
                  用户名: {{ userInfo.username || '未设置' }}
                  <a-button type="text" size="small" @click="handleEditField('username')" class="edit-btn">
                    <EditOutlined />
                  </a-button>
                </div>
                <div class="account-id">
                  账号ID: {{ userInfo.id || '无' }}
                  <a-button type="text" size="small" class="copy-btn" @click="handleCopyId">
                    <CopyOutlined />
                  </a-button>
                </div>
                <div class="user-account">
                  用户账号: {{ userInfo.userAccount || '未设置' }}
                </div>
                <div class="user-account">
                  调用次数: {{ userInfo.invokeCount || '0' }}
                  <a-popover title="充值续费">
                    <template #content>
                      <p>点击充值,增加调用次数</p>
                    </template>
                    <a-button type="primary" @click="handleRenewal">
                      点击续费
                    </a-button>
                  </a-popover>
                </div>
              </div>
            </div>
          </div>

          <!-- 个人信息 -->
          <div class="personal-info">
            <a-row :gutter="16" class="personal-row">
              <a-col :span="12">
                <div class="info-item">
                  <div class="item-label">性别</div>
                  <div class="item-value">
                    <span class="value">{{ getGenderText(userInfo.gender) }}</span>
                    <a-button type="text" size="small" @click="handleEditField('gender')" class="action-btn">
                      <EditOutlined />
                    </a-button>
                  </div>
                </div>
              </a-col>
              <a-col :span="12">
                <div class="info-item">
                  <div class="item-label">邮箱</div>
                  <div class="item-value">
                    <span class="value">{{ userInfo.email || '未设置' }}</span>
                    <a-button type="text" size="small" @click="handleEditField('email')" class="action-btn">
                      <EditOutlined />
                    </a-button>
                  </div>
                </div>
              </a-col>
              <a-col :span="12">
                <div class="info-item">
                  <div class="item-label">手机号</div>
                  <div class="item-value">
                    <span class="value">{{ userInfo.phone || '未设置' }}</span>
                    <a-button type="text" size="small" @click="handleEditField('phone')" class="action-btn">
                      <EditOutlined />
                    </a-button>
                  </div>
                </div>
              </a-col>
              <a-col :span="12">
                <div class="info-item">
                  <div class="item-label">注册时间</div>
                  <div class="item-value">
                    <span class="value">{{ formatDate(userInfo.createTime) }}</span>
                  </div>
                </div>
              </a-col>
              <a-col :span="12">
                <div class="info-item">
                  <div class="item-label">上次登录IP</div>
                  <div class="item-value">
                    <span class="value">{{ userInfo.loginPath || '' }}</span>
                  </div>
                </div>
              </a-col>
              <a-col :span="12">
                <div class="info-item">
                  <div class="item-label">上次登录时间</div>
                  <div class="item-value">
                    <span class="value">{{ formatDate(userInfo.lastLoginTime) }}</span>
                  </div>
                </div>
              </a-col>
              <a-col :span="12">
                <div class="info-item">
                  <div class="item-label">上次登录IP所属地</div>
                  <div class="item-value">
                    <span class="value">{{ userInfo.region || '' }}</span>
                  </div>
                </div>
              </a-col>
              <a-col :span="12">
                <!-- 更改密码 -->
                <div v-if="userInfo.isThirdUser === 0">
                  <a-button style="margin-top: 10px;" type="primary" @click="handleChangePassword">
                    更改密码
                  </a-button>
                </div>
              </a-col>
            </a-row>
          </div>
        </a-card>

      </div>

    </div>

    <!-- 编辑模态框 -->
    <a-modal v-model:open="editModalVisible" title="编辑信息" @ok="handleModalOk" @cancel="handleModalCancel" ok-text="确认"
      cancel-text="取消">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="用户名" v-if="currentEditField === 'username'">
          <a-input v-model:value="editForm.username" />
        </a-form-item>
        <a-form-item label="性别" v-if="currentEditField === 'gender'">
          <a-select v-model:value="editForm.gender">
            <a-select-option value="">请选择性别</a-select-option>
            <a-select-option :value="0">女</a-select-option>
            <a-select-option :value="1">男</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="邮箱" v-if="currentEditField === 'email'">
          <a-input v-model:value="editForm.email" />
        </a-form-item>
        <a-form-item label="手机号" v-if="currentEditField === 'phone'">
          <a-input v-model:value="editForm.phone" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 验证码模态框 -->
    <a-modal v-model:open="codeModalVisible" title="验证手机号" @ok="handleCodeModalOk" @cancel="handleCodeModalCancel"
      ok-text="确认" cancel-text="取消">
      <a-form :model="phoneCodeForm" layout="vertical">
        <a-form-item label="手机号">
          <a-input v-model:value="phoneCodeForm.phone" placeholder="请输入新手机号" disabled />
        </a-form-item>
        <a-form-item label="验证码">
          <a-row :gutter="16">
            <a-col :span="16">
              <a-input v-model:value="phoneCodeForm.code" placeholder="请输入验证码" />
            </a-col>
            <a-col :span="8">
              <a-button type="primary" @click="handleSendCode" :disabled="countdown > 0" block>
                {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
              </a-button>
            </a-col>
          </a-row>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改密码模态框 -->
    <a-modal v-model:open="changePasswordModalVisible" title="修改密码" @ok="handleChangePasswordOk"
      @cancel="handleChangePasswordCancel" ok-text="确认" cancel-text="取消">
      <a-form :model="changePasswordForm" layout="vertical">
        <a-form-item label="新密码">
          <a-input-password v-model:value="changePasswordForm.password" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="changePasswordForm.phone" placeholder="请输入手机号" disabled />
        </a-form-item>
        <a-form-item label="验证码">
          <a-row :gutter="16">
            <a-col :span="16">
              <a-input v-model:value="changePasswordForm.code" placeholder="请输入验证码" />
            </a-col>
            <a-col :span="8">
              <a-button type="primary" @click="handleSendChangePasswordCode" :disabled="countdown > 0" block>
                {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
              </a-button>
            </a-col>
          </a-row>
        </a-form-item>

      </a-form>
    </a-modal>

    <!-- 头像上传模态框 -->
    <a-modal v-model:open="avatarModalVisible" title="更换头像" @ok="handleAvatarOk" @cancel="handleAvatarCancel"
      ok-text="确认" cancel-text="取消">
      <div class="avatar-upload-container">
        <div class="avatar-preview">
          <a-avatar :size="120" :src="avatarPreviewUrl">
            <UserOutlined />
          </a-avatar>
        </div>
        <div class="avatar-upload-btn">
          <a-upload name="avatar" :before-upload="handleBeforeUpload" :show-upload-list="false" accept="image/*">
            <a-button>
              <UploadOutlined /> 选择头像
            </a-button>
          </a-upload>
        </div>
      </div>
    </a-modal>

    <!-- 订单详情模态框 -->
    <a-modal v-model:open="orderModalVisible" title="订单详情" @cancel="handleOrderCancel" :footer="null" :maskClosable="false" :keyboard="false">
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
            <span class="value">{{ formatDate(orderDetail.createTime) }}</span>
          </div>
        </div>
        <div class="order-amount">
          <span class="label">待支付总金额：</span>
          <span class="value">{{ orderDetail.money?.toFixed(2) }} 元</span>
        </div>
        <div class="payment-methods">
          <h4>支付方式：</h4>
          <div class="payment-buttons">
            <a-button @click="handleWechatPay">
              <img src="@/assets/wechat.png"/>微信支付</a-button>
            <a-button @click="handleAlipay">
              <img src="@/assets/alipay.png"/>
              支付宝
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { searchUserOne, updateUser, userLogout } from '@/api/user';
import { sendChangePhoneCode, verifyChangePhoneCode, sendChangePsdCode, verifyChangePsdCode } from '@/api/sms';
import { useLoginUserStore } from '@/store/useLoginUserStore';
import {
  CopyOutlined,
  EditOutlined,
  UploadOutlined,
  UserOutlined,
  AlipayOutlined,
  WechatOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { onMounted, reactive, ref } from 'vue';
import router from '@/router';
import { createOrder, getOrderDetail, alipay } from '@/api/order';


const loginUserStore = useLoginUserStore(); // 创建loginUserStore实例
// 订单接口定义
interface Order {
  id?: number;
  userId?: number;
  money?: number;
  paymentMethod?: string;
  status?: string;
  description?: string;
  createTime?: Date;
  updateTime?: Date;
}

interface UserInfo {
  id?: number;
  username: string;
  userAccount: string;
  avatarUrl?: string;
  gender?: number;
  userPassword?: string;
  email?: string;
  userStatus?: number;
  phone?: string;
  createTime?: Date;
  updateTime?: Date;
  isDelete?: number;
  userRole?: number;
  salt?: string;
  invokeCount?: number;
  token?: string;
  isThirdUser?: number;
  lastLoginTime?: Date;
  loginPath?: string;
  region?: string;
}

// 订单相关
const orderModalVisible = ref(false);
const orderDetail = reactive<Order>({});

// 用户信息
const userInfo = reactive<UserInfo>({
  username: '',
  userAccount: '',
});

// 编辑模态框相关
const editModalVisible = ref(false);
const currentEditField = ref<string>('');
const editForm = reactive<Partial<UserInfo>>({
});

// 头像上传相关
const avatarModalVisible = ref(false);
const avatarPreviewUrl = ref<string | undefined>(undefined);
const selectedAvatarFile = ref<File | null>(null);

// 验证码模态框相关
const codeModalVisible = ref(false);
const phoneCodeForm = reactive({
  phone: '',
  code: ''
});
const countdown = ref(0);
const timer = ref<number | null>(null);


// 修改密码相关
const changePasswordModalVisible = ref(false);
const changePasswordForm = reactive({
  phone: '',
  code: '',
  password: ''
});

// 处理续费按钮点击
const handleRenewal = async () => {
  const renewalMessageKey = 'renewalMessage';
  message.loading({ content: '创建订单中...', key: renewalMessageKey });

  try {
    // 创建订单
    // 创建订单 - 生成12位无规则纯数字id
    const generateRandom12DigitId = () => {
      let id = '';
      // 第一位不能为0，确保是12位数字
      id += Math.floor(Math.random() * 9) + 1;
      // 生成剩下的11位数字
      for (let i = 0; i < 11; i++) {
        id += Math.floor(Math.random() * 10);
      }
      return id;
    };

    const orderId = generateRandom12DigitId();
    const createResponse = await createOrder({
      id: orderId,
      money: 10.0,
      paymentMethod: 'ALIPAY',
    });

    if (createResponse.data.code === 200 && createResponse.data.data) {
      // 获取订单详情
      const detailResponse = await getOrderDetail({ id: orderId });

      if (detailResponse.data.code === 200 && detailResponse.data.data) {
        // 填充订单详情
        Object.assign(orderDetail, detailResponse.data.data);
        // 显示订单详情模态框
        orderModalVisible.value = true;
        message.success({ content: '订单创建成功', key: renewalMessageKey });
      } else {
        message.error({ content: '获取订单详情失败', key: renewalMessageKey });
      }
    } else {
      message.error({ content: '创建订单失败', key: renewalMessageKey });
    }
  } catch (error) {
    console.error('续费失败:', error);
    message.error({ content: '续费失败', key: renewalMessageKey });
  }
};
// 处理订单模态框取消
const handleOrderCancel = () => {
  orderModalVisible.value = false;
};
// 处理微信支付
const handleWechatPay = () => {
  message.info('微信支付功能开发中');
};

// 处理支付宝支付
const handleAlipay = async () => {
  orderModalVisible.value = false;
  const payMessageKey = 'alipayMessage';
  message.loading({ content: '正在跳转到支付宝支付页面...', key: payMessageKey });
  
  try {
    // 调用后端支付宝支付API
    const response = await alipay({
      id: orderDetail.id,
      money: orderDetail.money
    });
    
    if (response.data.code === 200 && response.data.data) {
       const payHtml = response.data.data;
      
      // 创建一个新窗口
      const payWindow = window.open('', '_blank');
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

// 处理修改密码
const handleChangePassword = () => {
  if (!userInfo.phone) {
    message.error('请先绑定手机号');
    return;
  }
  changePasswordForm.phone = userInfo.phone;
  changePasswordModalVisible.value = true;
};
// 发送修改密码验证码
const handleSendChangePasswordCode = async () => {
  if (!changePasswordForm.phone) {
    message.error('请输入手机号');
    return;
  }
  try {
    const response = await sendChangePsdCode({ phone: changePasswordForm.phone });
    if (response.data.code === 200) {
      message.success('验证码发送成功');
      startCountdown();
    } else {
      message.error(response.data.message || '验证码发送失败');
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    message.error('验证码发送失败');
  }
};
// 处理修改密码确定
const handleChangePasswordOk = async () => {
  if (!changePasswordForm.phone || !changePasswordForm.code || !changePasswordForm.password) {
    message.error('请填写完整信息');
    return;
  }
  // 验证密码强度
  if (changePasswordForm.password.length < 6) {
    message.error('密码长度不能少于6位');
    return;
  }
  const updateMessageKey = 'updatePasswordMessage';
  message.loading({ content: '修改密码中...', key: updateMessageKey });
  try {
    // 验证验证码并修改密码
    const response = await verifyChangePsdCode(changePasswordForm);
    if (response.data.code === 200) {
      message.success({ content: '密码修改成功，请重新登录', key: updateMessageKey });
      changePasswordModalVisible.value = false;

      // 清空表单
      changePasswordForm.code = '';
      changePasswordForm.password = '';

      await userLogout(loginUserStore.loginUser.id);
      localStorage.removeItem('token');
      loginUserStore.loginUser = {};


      // 跳转到登录页
      setTimeout(() => {
        router.push('/user/login');
      }, 1500);
    } else {
      message.error({ content: response.data.message || '密码修改失败', key: updateMessageKey });
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    message.error({ content: '密码修改失败', key: updateMessageKey });
  }
};
// 处理修改密码取消
const handleChangePasswordCancel = () => {
  changePasswordModalVisible.value = false;
  // 清空表单
  changePasswordForm.code = '';
  changePasswordForm.password = '';
  // 清除倒计时
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
    countdown.value = 0;
  }
};

// 复制账号ID
const handleCopyId = () => {
  if (userInfo.id) {
    navigator.clipboard.writeText(userInfo.id.toString())
      .then(() => {
        message.success('账号ID已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        message.error('复制失败，请手动复制');
      });
  }
};

// 处理头像点击
const handleAvatarClick = () => {
  avatarModalVisible.value = true;
  avatarPreviewUrl.value = userInfo.avatarUrl;
};

// 处理头像上传前的验证
const handleBeforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('请选择JPG或PNG格式的图片');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过2MB');
    return false;
  }
  // 预览图片
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreviewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
  selectedAvatarFile.value = file;
  return false; // 阻止自动上传，我们将在点击确定按钮时手动上传
};

// 处理头像上传确定
const handleAvatarOk = async () => {
  if (!selectedAvatarFile.value) {
    message.error('请选择头像');
    return;
  }

  const updateMessageKey = 'updateAvatarMessage';
  message.loading({ content: '更新头像中...', key: updateMessageKey });

  try {
    // 更新用户信息，包含文件和用户数据
    const response = await updateUser({
      file: selectedAvatarFile.value,
      user: { ...userInfo }
    });

    if (response.data.code === 200) {
      // 更新本地用户信息 - 实际项目中应该根据后端返回的头像URL更新
      // 这里简单使用预览URL作为头像URL
      userInfo.avatarUrl = avatarPreviewUrl.value;

      // 更新loginUserStore中的头像信息
      loginUserStore.setLoginUser({
        ...loginUserStore.loginUser,
        avatarUrl: avatarPreviewUrl.value
      });

      message.success({ content: '头像更新成功', key: updateMessageKey });
      avatarModalVisible.value = false;
    } else {
      message.error({ content: '头像更新失败', key: updateMessageKey });
    }
  } catch (error) {
    console.error('更新头像失败:', error);
    message.error({ content: '头像更新失败', key: updateMessageKey });
  }
};


// 处理头像上传取消
const handleAvatarCancel = () => {
  avatarModalVisible.value = false;
  selectedAvatarFile.value = null;
};

// 加载用户信息
const loadUserInfo = async () => {
  const loadMessageKey = 'loadUserInfoMessage';
  message.loading({ content: '加载用户信息中...', key: loadMessageKey });

  try {
    const response = await searchUserOne();
    if (response.data.code === 200 && response.data.data) {
      // 确保所有字段都被正确赋值
      const data = response.data.data;
      userInfo.id = data.id;
      userInfo.username = data.username || '';
      userInfo.userAccount = data.userAccount || '';
      userInfo.avatarUrl = data.avatarUrl;
      userInfo.gender = data.gender;
      userInfo.email = data.email;
      userInfo.userStatus = data.userStatus;
      userInfo.phone = data.phone;
      userInfo.createTime = data.createTime;
      userInfo.userRole = data.userRole;
      userInfo.invokeCount = data.invokeCount;
      userInfo.isThirdUser = data.isThirdUser;
      userInfo.lastLoginTime = data.lastLoginTime;
      userInfo.loginPath = data.loginPath;
      userInfo.region = data.region;

      message.success({ content: '加载用户信息成功', key: loadMessageKey });
    } else {
      message.error({ content: '获取用户信息失败', key: loadMessageKey });
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    message.error({ content: '获取用户信息失败', key: loadMessageKey });
  }
};

// 处理编辑字段
const handleEditField = (field: string) => {
  if (field === 'phone') {
    // 如果是修改手机号，先打开编辑模态框
    currentEditField.value = field;
    if (userInfo[field as keyof UserInfo] !== undefined) {
      editForm[field as keyof UserInfo] = userInfo[field as keyof UserInfo];
    }
    editModalVisible.value = true;
  } else {
    // 其他字段直接打开编辑模态框
    currentEditField.value = field;
    if (userInfo[field as keyof UserInfo] !== undefined) {
      editForm[field as keyof UserInfo] = userInfo[field as keyof UserInfo];
    }
    editModalVisible.value = true;
  }
};

// 发送验证码
const handleSendCode = async () => {
  if (!phoneCodeForm.phone) {
    message.error('请输入手机号');
    return;
  }

  try {
    const response = await sendChangePhoneCode({ phone: phoneCodeForm.phone });
    if (response.data.code === 200) {
      message.success('验证码发送成功');
      startCountdown();
    } else {
      message.error(response.data.message || '验证码发送失败');
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    message.error('验证码发送失败');
  }
};

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60;
  timer.value = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer.value as number);
      timer.value = null;
    }
  }, 1000);
};

// 验证验证码并更新手机号
const handleCodeModalOk = async () => {
  if (!phoneCodeForm.phone || !phoneCodeForm.code) {
    message.error('请输入手机号和验证码');
    return;
  }

  const updateMessageKey = 'updatePhoneMessage';
  message.loading({ content: '更新手机号中...', key: updateMessageKey });

  try {
    // 先验证验证码
    const verifyResponse = await verifyChangePhoneCode({
      phone: phoneCodeForm.phone,
      code: phoneCodeForm.code
    });

    if (verifyResponse.data.code === 200) {
      message.success({ content: '更新手机号完成', key: updateMessageKey });
      codeModalVisible.value = false;
      loadUserInfo();

    } else {
      message.error({ content: '验证码错误', key: updateMessageKey });
    }
  } catch (error) {
    console.error('更新手机号失败:', error);
    message.error({ content: '更新手机号失败', key: updateMessageKey });
  }
};

// 关闭验证码模态框
const handleCodeModalCancel = () => {
  codeModalVisible.value = false;
  // 重置表单
  phoneCodeForm.phone = '';
  phoneCodeForm.code = '';
  // 清除倒计时
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
    countdown.value = 0;
  }
};

// 处理模态框确定
const handleModalOk = async () => {
  if (currentEditField.value === 'phone') {
    // 如果是修改手机号，先验证手机号格式，然后打开验证码模态框
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(editForm.phone as string)) {
      message.error('请输入正确的手机号格式');
      return;
    }
    // 关闭编辑模态框，打开验证码模态框
    editModalVisible.value = false;
    phoneCodeForm.phone = editForm.phone as string;
    codeModalVisible.value = true;
  } else {
    // 其他字段直接更新
    const updateMessageKey = 'updateUserInfoMessage';
    message.loading({ content: '更新信息中...', key: updateMessageKey });

    try {
      // 更新用户信息
      const updateData = { [currentEditField.value]: editForm[currentEditField.value] };
      const response = await updateUser({ ...userInfo, ...updateData });

      if (response.data.code === 200) {
        // 更新本地数据
        Object.assign(userInfo, updateData);
        message.success({ content: '更新成功', key: updateMessageKey });
        editModalVisible.value = false;
      } else {
        message.error({ content: '更新失败', key: updateMessageKey });
      }
    } catch (error) {
      console.error('更新失败:', error);
      message.error({ content: '更新失败', key: updateMessageKey });
    }
  }
};

// 处理模态框取消
const handleModalCancel = () => {
  editModalVisible.value = false;
};

// 格式化日期
const formatDate = (date?: Date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString();
};

// 性别文本转换
const getGenderText = (gender?: number) => {
  if (gender === undefined) return '未设置';
  return gender === 0 ? '女' : gender === 1 ? '男' : '未知';
};

// 页面加载时获取用户信息
onMounted(() => {
  loadUserInfo();
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

.user-self-center {
  padding: 20px;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
}

.main-content {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 0;
}

.left-content {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 头像上传相关样式 */
.avatar-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.avatar-preview {
  margin-bottom: 20px;
}

.avatar-upload-btn {
  text-align: center;
}

/* 用户基本信息 */
.user-basic-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-section {
  margin-right: 20px;
  cursor: pointer;
}

.info-section {
  flex: 1;
}

.login-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-name,
.account-id,
.user-account {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.edit-btn,
.copy-btn {
  padding: 0;
  margin-left: 4px;
}

/* 个人信息 */
.personal-info {
  margin-bottom: 24px;
}

.personal-row {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.item-label {
  color: #666;
  font-size: 14px;
}

.item-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.value {
  font-weight: 500;
}

.status-0 {
  color: #ff4d4f;
}

.status-1 {
  color: #52c41a;
}

.action-btn {
  padding: 0;
  color: #1890ff;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .user-basic-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>