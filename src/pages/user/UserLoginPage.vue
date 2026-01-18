<template>
  <div id="userLoginPage">
    <div class="login-container">
      <div class="left-section">
        <img src="@/assets/login.jpg" alt="登录插图" class="login-illustration" />
      </div>
      
      <div class="right-section">
        <h2 class="login-title">登录</h2>
        
        <a-tabs v-model:activeKey="activeTab" class="login-tabs">
          <!-- 用户名密码登录 -->
          <a-tab-pane tab="账号登录" key="account">
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
          <a-tab-pane tab="短信登录" key="sms">
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
                      :disabled="smsCountdown > 0"
                      class="send-code-btn"
                    >
                      {{ smsCountdown > 0 ? `${smsCountdown}s后重新发送` : '发送验证码' }}
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
           
          <!-- 邮箱登录 -->
          <a-tab-pane tab="邮箱登录" key="mail">
            <a-form
              :model="mailForm"
              name="mailLogin"
              label-align="left"
              :label-col="{ span: 0 }"
              :wrapper-col="{ span: 24 }"
              autocomplete="off"
              @finish="handleMailLogin"
            >
              <a-form-item
                name="email"
                :rules="[
                  { required: true, message: '请输入邮箱' },
                  { pattern: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/, message: '邮箱格式不正确' }
                ]"
                class="form-item"
              >
                <a-input
                  v-model:value="mailForm.email"
                  placeholder="邮箱"
                  class="form-input"
                />
              </a-form-item>
              
              <a-form-item
                name="code"
                :rules="[
                  { required: true, message: '请输入验证码' },
                  { min: 6, max: 6, message: '验证码长度不正确' }
                ]"
                class="form-item"
              >
                <a-input
                  v-model:value="mailForm.code"
                  placeholder="验证码"
                  class="form-input"
                >
                  <template #addonAfter>
                    <a-button 
                      type="link" 
                      @click="sendMailCode"
                      :disabled="mailCountdown > 0"
                      class="send-code-btn"
                    >
                      {{ mailCountdown > 0 ? `${mailCountdown}s后重新发送` : '发送验证码' }}
                    </a-button>
                  </template>
                </a-input>
              </a-form-item>
              
              <div class="form-actions">
                <a-button type="primary" html-type="submit" class="login-btn">登录</a-button>
                <a-button html-type="reset" class="reset-btn" @click="resetMailForm">重置</a-button>
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
import { 
  sendCode, 
  verifyCodeAndLogin,
  sendMailCode as sendMailCodeApi,
  verifyMailCodeAndLogin } from "@/api/sms";
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

// 邮箱登录表单
interface MailFormState {
  email: string;
  code: string;
}

const mailForm = reactive<MailFormState>({
  email: "",
  code: "",
});

// 倒计时
const smsCountdown = ref(0);
const mailCountdown = ref(0);
let smsTimer: number | null = null;
let mailTimer: number | null = null;

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

// 重置邮箱登录表单
function resetMailForm() {
  mailForm.email = "";
  mailForm.code = "";
}

// 发送短信验证码
const sendSmsCode = async () => {
  if (!smsForm.phone) {
    message.warning("请先输入手机号");
    return;
  }
  
  try {
    await sendCode({ phone: smsForm.phone });
    message.success("验证码发送成功");
    
    // 开始倒计时
    smsCountdown.value = 60;
    smsTimer = window.setInterval(() => {
      smsCountdown.value--;
      if (smsCountdown.value <= 0) {
        if (smsTimer) {
          clearInterval(smsTimer);
          smsTimer = null;
        }
      }
    }, 1000);
  } catch (error) {
    message.error("验证码发送失败");
    console.error("发送验证码失败:", error);
  }
};

// 发送邮件验证码
const sendMailCode = async () => {
  if (!mailForm.email) {
    message.warning("请先输入邮箱");
    return;
  }
  
  try {
    await sendMailCodeApi({ email: mailForm.email });
    message.success("验证码发送成功");
    
    // 开始倒计时
    mailCountdown.value = 60;
    mailTimer = window.setInterval(() => {
      mailCountdown.value--;
      if (mailCountdown.value <= 0) {
        if (mailTimer) {
          clearInterval(mailTimer);
          mailTimer = null;
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
    if (res.data.code === 200 && res.data.data) {
      loginUserStore.setLoginUser(res.data.data);
      message.success("登录成功");
      router.push({
        path: "/",
        replace: true,
      });
    } else {
      message.error("登录失败"+res.data.message);
    }
  } catch (error) {
    message.error("登录失败");
    console.error("登录失败:", error);
  }
};

// 邮箱登录
const handleMailLogin = async (values: any) => {
  try {
    const res = await verifyMailCodeAndLogin(values);
    if (res.data.code === 200 && res.data.data) {
      loginUserStore.setLoginUser(res.data.data);
      message.success("登录成功");
      router.push({
        path: "/",
        replace: true,
      });
    } else {
      message.error("登录失败"+res.data.message);
    }
  } catch (error) {
    message.error("登录失败");
    console.error("登录失败:", error);
  }
};
</script>

<style scoped>
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

.login-container {
  width: 800px;
  height: 500px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  overflow: hidden;
  max-width: 90vw;
  max-height: 90vh;
}

.left-section {
  width: 50%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0;
  height: 100%;
  opacity: 0;
  transform: translateX(100%);
  animation: slideRight 0.8s ease forwards;
}

.login-illustration {
  width: 100%;
  height: 100%;
  object-fit: cover;
  margin-bottom: 0;
}

.right-section {
  width: 50%;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
  opacity: 0;
  transform: translateX(100%);
  animation: slideLeft 0.8s ease 0.2s forwards; 
}

.login-tabs {
  margin-bottom: 20px;
}

.send-code-btn {
  padding: 0 12px;
}

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

.login-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 40px;
  text-align: center;
}

.form-item {
  margin-bottom: 20px;
}

.form-input {
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
}

.login-btn, .reset-btn {
  width: 48%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a408f 100%);
}

.reset-btn {
  border: 1px solid #d9d9d9;
  color: #666;
}

.reset-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

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

@media (max-width: 768px) {
  .left-section {
    display: none;
  }
  
  .right-section {
    width: 100%;
    padding: 40px 30px;
  }
  
  .login-container {
    width: 90vw;
    max-width: 400px;
    height: auto;
    min-height: 500px;
  }
}
</style>