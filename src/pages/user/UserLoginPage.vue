<template>
  <div id="userLoginPage">
    <!-- 右上角用户状态 -->
    <!-- <div class="user-status">
      <span>未登录</span>
    </div> -->
    
    <div class="login-container">
      <!-- 左侧插图区域 -->
      <div class="left-section">
        <img src="@/assets/login.jpg" alt="登录插图" class="login-illustration" />
      </div>
      
      <!-- 右侧表单区域 -->
      <div class="right-section">
        <h2 class="login-title">登录</h2>
        
        <!-- 添加选项卡 -->
        <a-tabs v-model:activeKey="activeTab" class="login-tabs">
          <!-- 用户名密码登录 -->
          <a-tab-pane tab="用户名密码登录" key="account">
            <a-form
              :model="accountForm"
              name="accountLogin"
              label-align="left"
              :label-col="{ span: 0 }"
              :wrapper-col="{ span: 24 }"
              autocomplete="off"
              @finish="handleAccountLogin"
            >
              <a-form-item
                name="userAccount"
                :rules="[{ required: true, message: '请输入用户名' }]"
                class="form-item"
              >
                <a-input
                  v-model:value="accountForm.userAccount"
                  placeholder="用户名"
                  class="form-input"
                />
              </a-form-item>
              
              <a-form-item
                name="userPassword"
                :rules="[
                  { required: true, message: '请输入密码' },
                  { min: 8, message: '密码不能小于 8 位' },
                ]"
                class="form-item"
              >
                <a-input-password
                  v-model:value="accountForm.userPassword"
                  placeholder="密码"
                  class="form-input"
                />
              </a-form-item>
              
              <p><a href="/user/register">没有账号？去注册</a></p>
              <div class="form-actions">
                <a-button type="primary" html-type="submit" class="login-btn">登录</a-button>
                <a-button html-type="reset" class="reset-btn" @click="resetAccountForm">重置</a-button>
              </div>
            </a-form>
          </a-tab-pane>
          
          <!-- 短信登录 -->
          <a-tab-pane tab="短信验证码登录" key="sms">
            <a-form
              :model="smsForm"
              name="smsLogin"
              label-align="left"
              :label-col="{ span: 0 }"
              :wrapper-col="{ span: 24 }"
              autocomplete="off"
              @finish="handleSmsLogin"
            >
              <a-form-item
                name="phone"
                :rules="[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                ]"
                class="form-item"
              >
                <a-input
                  v-model:value="smsForm.phone"
                  placeholder="手机号"
                  class="form-input"
                />
              </a-form-item>
              
              <a-form-item
                name="code"
                :rules="[
                  { required: true, message: '请输入验证码' },
                  { min: 4, max: 6, message: '验证码长度不正确' }
                ]"
                class="form-item"
              >
                <a-input
                  v-model:value="smsForm.code"
                  placeholder="验证码"
                  class="form-input"
                  style="width: '60%'"
                >
                  <template #addonAfter>
                    <a-button 
                      type="link" 
                      @click="sendSmsCode"
                      :disabled="countdown > 0"
                      class="send-code-btn"
                    >
                      {{ countdown > 0 ? `${countdown}s后重新发送` : '发送验证码' }}
                    </a-button>
                  </template>
                </a-input>
              </a-form-item>
              
              <div class="form-actions">
                <a-button type="primary" html-type="submit" class="login-btn">登录</a-button>
                <a-button html-type="reset" class="reset-btn" @click="resetSmsForm">重置</a-button>
              </div>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { userLogin } from "@/api/user";
import { sendCode, verifyCodeAndLogin } from "@/api/sms";
import { useLoginUserStore } from "@/store/useLoginUserStore";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";

// 选项卡状态
const activeTab = ref('account');

// 用户名密码登录表单
interface AccountFormState {
  userAccount: string;
  userPassword: string;
}

const accountForm = reactive<AccountFormState>({
  userAccount: "",
  userPassword: "",
});

// 短信登录表单
interface SmsFormState {
  phone: string;
  code: string;
}

const smsForm = reactive<SmsFormState>({
  phone: "",
  code: "",
});

// 倒计时
const countdown = ref(0);
let timer: number | null = null;

const router = useRouter();
const loginUserStore = useLoginUserStore();

// 重置用户名密码表单
function resetAccountForm() {
  accountForm.userAccount = "";
  accountForm.userPassword = "";
}

// 重置短信登录表单
function resetSmsForm() {
  smsForm.phone = "";
  smsForm.code = "";
}

// 发送验证码
const sendSmsCode = async () => {
  if (!smsForm.phone) {
    message.warning("请先输入手机号");
    return;
  }
  
  try {
    await sendCode({ phone: smsForm.phone });
    message.success("验证码发送成功");
    
    // 开始倒计时
    countdown.value = 60;
    timer = window.setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }
    }, 1000);
  } catch (error) {
    message.error("验证码发送失败");
    console.error("发送验证码失败:", error);
  }
};

// 用户名密码登录
const handleAccountLogin = async (values: any) => {
  try {
    const res = await userLogin(values);
    // 登录成功，把登录态保存到全局状态中
    if (res.data.code === 200 && res.data.data) {
      loginUserStore.setLoginUser(res.data.data);
      message.success("登录成功");
      router.push({
        path: "/",
        replace: true,
      });
    } else {
      message.error("登录失败");
    }
  } catch (error) {
    message.error("登录失败");
    console.error("登录失败:", error);
  }
};

// 短信登录
const handleSmsLogin = async (values: any) => {
  try {
    const res = await verifyCodeAndLogin(values);
    // 登录成功，把登录态保存到全局状态中
    if (res.data.code === 200 && res.data.data) {
      loginUserStore.setLoginUser(res.data.data);
      message.success("登录成功");
      router.push({
        path: "/",
        replace: true,
      });
    } else {
      message.error("登录失败");
    }
  } catch (error) {
    message.error("登录失败");
    console.error("登录失败:", error);
  }
};
</script>

<style scoped>
/* 确保整个页面充满视口 */
#userLoginPage {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #edf0ff 0%, #6e94ec 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
}

/* 登录容器 */
.login-container {
  width: 800px;
  height: 500px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  overflow: hidden;
  /* 确保容器在小屏幕上也能适应 */
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

/* 左侧插图区域 */
.left-section {
  width: 50%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0;
  /* 确保图片容器充满整个区域 */
  height: 100%;
  opacity: 0;
  transform: translateX(100%);
  animation: slideRight 0.8s ease forwards;
}

/* 登录插图 */
.login-illustration {
  width: 100%;
  height: 100%;
  object-fit: cover;
  margin-bottom: 0;
}

/* 右侧表单区域 */
.right-section {
  width: 50%;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* 确保表单区域在容器中垂直居中 */
  height: 100%;
  box-sizing: border-box;
  opacity: 0;
  transform: translateX(100%);
  animation: slideLeft 0.8s ease 0.2s forwards; 
}

/* 选项卡样式 */
.login-tabs {
  margin-bottom: 20px;
}

/* 发送验证码按钮样式 */
.send-code-btn {
  padding: 0 12px;
}

/* 定义动画 */
@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 登录标题 */
.login-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 40px;
  text-align: center;
}

/* 表单项 */
.form-item {
  margin-bottom: 20px;
}

/* 表单输入框 */
.form-input {
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
}

/* 登录按钮和重置按钮 */
.login-btn, .reset-btn {
  width: 48%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
}

/* 登录按钮 */
.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a408f 100%);
}

/* 重置按钮 */
.reset-btn {
  border: 1px solid #d9d9d9;
  color: #666;
}

.reset-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

/* 注册链接 */
.right-section p {
  text-align: right;
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}

.right-section p a {
  color: #667eea;
  text-decoration: none;
}

.right-section p a:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  /* 在小屏幕上，左侧插图区域隐藏 */
  .left-section {
    display: none;
  }
  
  /* 右侧表单区域占满整个容器 */
  .right-section {
    width: 100%;
    padding: 40px 30px;
  }
  
  /* 调整容器大小 */
  .login-container {
    width: 90vw;
    max-width: 400px;
    height: auto;
    min-height: 500px;
  }
}
</style>