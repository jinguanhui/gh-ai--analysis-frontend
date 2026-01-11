<template>
  <div id="userRegisterPage">
    
    <div class="login-container">
      <!-- 左侧插图区域 -->
      <div class="left-section">
        <img src="@/assets/register.jpg" alt="注册插图" class="login-illustration" />
      </div>
      
      <!-- 右侧表单区域 -->
      <div class="right-section">
        <h2 class="login-title">注册</h2>
        <a-form
          :model="formState"
          name="basic"
          label-align="left"
          :label-col="{ span: 0 }"
          :wrapper-col="{ span: 24 }"
          autocomplete="off"
          @finish="handleSubmit"
        >
          <a-form-item
            name="userAccount"
            :rules="[{ required: true, message: '请输入用户名' }, { min: 4, message: '用户名不能小于 4 位' }]"
            class="form-item"
          >
            <a-input
              v-model:value="formState.userAccount"
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
              v-model:value="formState.userPassword"
              placeholder="密码"
              class="form-input"
            />
          </a-form-item>
          
          <a-form-item
            name="checkPassword"
            :rules="[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('userPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]"
            class="form-item"
          >
            <a-input-password
              v-model:value="formState.checkPassword"
              placeholder="确认密码"
              class="form-input"
            />
          </a-form-item>
          
          <!-- 登录链接 -->
          <p><a href="/user/login">已有账号？去登录</a></p>
          
          <div class="form-actions">
            <a-button type="primary" html-type="submit" class="login-btn">注册</a-button>
            <a-button html-type="reset" class="reset-btn" @click="reset">重置</a-button>
          </div>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { userRegister } from "@/api/user";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";

interface FormState {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

const formState = reactive<FormState>({
  userAccount: "",
  userPassword: "",
  checkPassword: "",
});

const router = useRouter();

/**
 * 重置表单
 */
function reset() {
  formState.userAccount = "";
  formState.userPassword = "";
  formState.checkPassword = "";
}

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  
  try {
    const res = await userRegister(values);
    // 注册成功
    if (res.data.code === 200 && res.data.data) {
      message.success("注册成功");
      // 跳转到登录页
      router.push({
        path: "/user/login",
        replace: true,
      });
    } else {
      message.error("注册失败");
    }
  } catch (error) {
    message.error("注册失败，请稍后重试");
  }
};
</script>

<style scoped>
/* 确保整个页面充满视口 */
#userRegisterPage {
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
  animation: slideLeft 0.8s ease forwards;
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
  animation: slideRight 0.8s ease 0.2s forwards; 
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

/* 登录链接 */
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
