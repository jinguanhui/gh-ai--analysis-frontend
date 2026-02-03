<template>
  <div class="ai-chat-container">
    <!-- AI对话按钮 -->
    <div class="ai-chat-button">
      <div class="ai-button-container" @click="toggleChatWindow">
        <div class="ai-icon-container">
        </div>
        <div class="ai-button-text">AI<br>光<br>吾</div>
      </div>
      <!-- 悬浮提示框 -->
      <div class="ai-chat-tooltip" v-if="!isChatWindowOpen">
        你好，我是AI助理，可以回答问题、提供解决方案等
      </div>
    </div>

    <!-- AI对话窗口 -->
    <div class="ai-chat-window" v-if="isChatWindowOpen">
      <div @mousedown="handleDragStart" @touchstart="handleTouchStart">
        <div class="ai-chat-header">
          <div class="header-content">
            <RobotOutlined theme="twoTone" two-tone-color="white" />
            <span class="assistant-name">光吾AI助理</span>
            <CloseOutlined class="exit-button" theme="twoTone" two-tone-color="white" @click="toggleChatWindow" />
          </div>
        </div>
      </div>

      <!-- 登录检查 -->
      <div v-if="loginUserStore.loginUser.username === '未登录' || !loginUserStore.loginUser">
        <div class="login-prompt">
          <div class="prompt-content">
            <h3>你好，我是光吾AI助理</h3>
            <div class="prompt-icon">
              <span class="icon-cross"></span>
            </div>
            <div class="prompt-buttons">
              <a-button type="primary" href="/user/login">前往登录</a-button>
              <a-button href="/user/register">快速注册</a-button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="ai-chat-messages" ref="chatMessagesContainer">
        <div class="message" v-for="(msg, index) in chatMessages" :key="index" :class="msg.type">
          <div class="message-container">
            <!-- AI消息显示机器人图标 -->
            <div v-if="msg.type === 'ai'" class="robot-avatar">
              <RobotOutlined theme="twoTone" two-tone-color="#1890ff" />
            </div>
            <div class="message-content">
              <a-card v-html="msg.content">
              </a-card>
            </div>
          </div>
        </div>
        <div class="loading" v-if="isLoading">
          <div class="message-avatar">
            <RobotOutlined theme="twoTone" two-tone-color="#1890ff" />
          </div>
          <div class="loading-icon">
            <LoadingOutlined />
          </div>
        </div>
      </div>
      <div class="ai-chat-input">
        <a-input v-model:value="inputMessage" placeholder="请输入您的问题..." @keyup.enter="sendMessage"
          :disabled="isLoading" />
        <a-button type="primary" @click="sendMessage" :disabled="isLoading || !inputMessage">
          发送
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  RobotOutlined, CloseOutlined, LoadingOutlined,
} from '@ant-design/icons-vue';
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import myAxios from '@/request';
import { useAiChatStore } from '@/store/useAiChatStore';
import router from '@/router';
import { useLoginUserStore } from '@/store/useLoginUserStore';

// 获取AI聊天状态管理
const aiChatStore = useAiChatStore();
const loginUserStore = useLoginUserStore();

// 聊天状态
const isChatWindowOpen = ref(false);
const chatMessages = ref<{ type: 'user' | 'ai'; content: string; isComplete?: boolean }[]>([]);
const inputMessage = ref('');
const isLoading = ref(false);

// 窗口拖拽相关
const windowPosition = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

// 按钮拖拽相关
const buttonPosition = ref({ x: 0, y: 0 });
const isButtonDragging = ref(false);
const buttonDragStart = ref({ x: 0, y: 0 });

// SSE连接实例
let eventSource: EventSource | null = null;
// 聊天ID，用于保持对话上下文
let chatId = '';
// 当前正在输入的AI消息索引
let currentAiMessageIndex: number | null = null;
// 当前AI消息的完整内容
let currentAiMessageContent = '';
// 打字机计时器
let typewriterTimer: number | null = null;

// // 窗口位置样式
// const windowStyle = computed(() => {
//   return {
//     transform: `translate(${windowPosition.value.x}px, ${windowPosition.value.y}px)`
//   };
// });
// 聊天消息容器引用
const chatMessagesContainer = ref<HTMLElement | null>(null);
// 滚动到底部函数
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
    }
  });
};
// 切换聊天窗口显示状态
const toggleChatWindow = () => {
  isChatWindowOpen.value = !isChatWindowOpen.value;
  // 如果是第一次打开聊天窗口，初始化对话
  if (isChatWindowOpen.value && chatMessages.value.length === 0) {
    initChat();
  }
  // 初始化窗口位置
  if (isChatWindowOpen.value) {
    windowPosition.value = {
      x: buttonPosition.value.x - 520, // 使窗口在按钮左侧，保持20px间距
      y: buttonPosition.value.y + 120 - 600 // 使窗口在按钮上方，保持20px间距
    };
    // 添加鼠标和触摸事件监听器
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
  } else {
    // 移除鼠标和触摸事件监听器
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchend', handleDragEnd);
    // 重置拖拽状态
    isDragging.value = false;
    isButtonDragging.value = false;
  }
};

// 窗口拖拽开始 - 鼠标事件
const handleDragStart = (e: MouseEvent) => {
  isDragging.value = true;
  dragStart.value = {
    x: e.clientX - windowPosition.value.x,
    y: e.clientY - windowPosition.value.y
  };
  e.preventDefault();
};

// 窗口拖拽开始 - 触摸事件
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    isDragging.value = true;
    dragStart.value = {
      x: e.touches[0].clientX - windowPosition.value.x,
      y: e.touches[0].clientY - windowPosition.value.y
    };
    e.preventDefault();
  }
};


// 窗口拖拽移动 - 支持鼠标和触摸事件
const handleDragMove = (e: MouseEvent | TouchEvent) => {
  if (isDragging.value) {
    let clientX: number;
    let clientY: number;

    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      return;
    }

    windowPosition.value = {
      x: clientX - dragStart.value.x,
      y: clientY - dragStart.value.y
    };
  } else if (isButtonDragging.value) {
    let clientX: number;
    let clientY: number;

    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      return;
    }

    buttonPosition.value = {
      x: clientX - buttonDragStart.value.x,
      y: clientY - buttonDragStart.value.y
    };
  }
};

// 窗口拖拽结束
const handleDragEnd = () => {
  isDragging.value = false;
  isButtonDragging.value = false;
};

// 初始化对话
const initChat = async () => {
  // 显示加载状态
  isLoading.value = true;
  // 生成聊天ID

  try {
    // 检查store中是否已有chatId，如果没有则生成新的
    if (!aiChatStore.chatId) {
      chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      aiChatStore.setChatId(chatId);
    } else {
      chatId = aiChatStore.chatId;
    }
    // 这里可以添加初始化数据请求逻辑（如果需要）
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 添加欢迎消息
    chatMessages.value.push({
      type: 'ai',
      content: '您好！我是AI助手，有什么可以帮助您的吗？',
      isComplete: true
    });

    // 滚动到底部
    scrollToBottom();
  } finally {
    // 隐藏加载状态
    isLoading.value = false;
  }
};

// 用于标记是否正在刷新token（与request.ts保持一致）
let isRefreshing = false;
// 用于存储等待刷新token的SSE请求队列
let sseRequests: Array<{ msgContent: string }> = [];

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value || isLoading.value) return;

  const msgContent = inputMessage.value;
  // 添加用户消息到对话列表
  chatMessages.value.push({
    type: 'user',
    content: msgContent
  });
  // 滚动到底部
  scrollToBottom();
  // 清空输入框
  inputMessage.value = '';
  // 显示加载状态
  isLoading.value = true;

  try {
    // 关闭已有SSE连接
    closeSSE();

    // 建立SSE连接
    let sseUrl = `/ai/chat?message=${encodeURIComponent(msgContent)}&chatId=${chatId}`;
    if (myAxios.defaults.baseURL && !myAxios.defaults.baseURL.includes(window.location.host)) {
      sseUrl = `${myAxios.defaults.baseURL}${sseUrl}`;
    }
    // 添加token
    const token = localStorage.getItem("token");
    if (token) {
      sseUrl += `&token=${token}`;
    }

    const response = await fetch(sseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream'
      },
      cache: 'no-cache'
    });

    // 检查状态码
    if (response.status !== 200) {
      console.error('AI聊天SSE连接失败，状态码:', response.status);

      // 处理401状态码（token失效）
      if (response.status === 401) {
        // 如果正在刷新token，将当前请求加入队列
        if (isRefreshing) {
          return new Promise((resolve) => {
            sseRequests.push({ msgContent: msgContent });
            resolve(null);
          });
        }
        // 标记开始刷新token
        isRefreshing = true;
        try {
          // 调用刷新token接口（使用myAxios实例）
          const refreshResponse = await myAxios.post('/user/refreshToken');

          if (refreshResponse.data.code === 200 && refreshResponse.data.data) {
            // 存储新的token
            const newToken = refreshResponse.data.data;
            localStorage.setItem('token', newToken);
            console.log('token已刷新成功，新token:', newToken);

            // 处理队列中的SSE请求
            sseRequests.forEach(req => {
              sendMessage();
            });
            sseRequests = [];

            // 重新尝试建立SSE连接
            sendMessage();
            return;
          } else {
            // 刷新token失败，跳转到登录页面
            message.error('登录已过期，请重新登录');
            localStorage.removeItem('token');
            await myAxios.post('/user/logout');
            router.push('/user/login');
          }

        } catch (refreshError) {
          // 刷新token失败，跳转到登录页面
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          await myAxios.post('/user/logout');
          router.push('/user/login');
        } finally {
          // 标记刷新token完成
          isRefreshing = false;
        }

        isLoading.value = false;
        return;
      } else {
        // 其他错误状态码
        message.error(`AI聊天连接失败: ${response.statusText}`);
        isLoading.value = false;
        return;
      }
    }


    eventSource = new EventSource(sseUrl);
    console.log('AI聊天SSE连接已建立：', sseUrl);

    // 接收消息
    eventSource.onmessage = (event) => {
      try {
        let data = event.data;
        if (data) {
          // 尝试解析JSON数据，如果失败则直接使用原始数据
          // try {
          //   const parsedData = JSON.parse(data);
          //   data = parsedData;
          // } catch (jsonError) {
          //   // 如果解析失败，可能是HTML格式或特殊格式，直接使用原始数据
          //   console.log('JSON解析失败，使用原始数据:', data);
          // }
          // 如果是新的AI消息开始，创建空消息并开始打字机效果
          if (currentAiMessageIndex === null) {
            currentAiMessageIndex = chatMessages.value.length;
            chatMessages.value.push({
              type: 'ai',
              content: '',
              isComplete: false
            });
            currentAiMessageContent = '';
          }

          // 累积完整消息内容
          currentAiMessageContent += data;

          // 如果已经有打字机计时器在运行，清除它
          if (typewriterTimer !== null) {
            clearInterval(typewriterTimer);
          }

          // 开始打字机效果
          startTypewriterEffect();
        }
      } catch (e) {
        console.error('解析AI消息失败:', e);
        message.error('AI消息解析失败');
      }
    };

    // 连接错误处理
    eventSource.onerror = (error) => {
      console.error('AI聊天SSE连接错误:', error);
      // message.error('AI聊天连接失败');
      closeSSE();
      isLoading.value = false;
    };

    // 连接关闭处理
    eventSource.addEventListener('close', () => {
      console.log('AI聊天SSE连接已关闭');

      // 如果还有未完成的AI消息，立即显示完整内容
      if (currentAiMessageIndex !== null) {
        if (typewriterTimer !== null) {
          clearInterval(typewriterTimer);
          typewriterTimer = null;
        }

        // 显示完整内容
        if (chatMessages.value[currentAiMessageIndex]) {
          chatMessages.value[currentAiMessageIndex].content = currentAiMessageContent;
          chatMessages.value[currentAiMessageIndex].isComplete = true;
        }

        // 重置状态
        currentAiMessageIndex = null;
        currentAiMessageContent = '';
      }

      isLoading.value = false;
    });

  } catch (error) {
    console.error('发送消息失败:', error);
    message.error('发送消息失败');
    isLoading.value = false;
  }
};

// 将router实例挂载到window对象，以便在HTML中访问
if (typeof window !== 'undefined') {
  (window as any).aiRouter = router;
}

// 关闭SSE连接
const closeSSE = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    console.log('AI聊天SSE连接已主动关闭');
  }
};

// 开始打字机效果
const startTypewriterEffect = () => {
  if (currentAiMessageIndex === null) return;

  let charIndex = 0;

  // 如果当前消息已经有部分内容，从已有内容之后继续
  if (chatMessages.value[currentAiMessageIndex]) {
    charIndex = chatMessages.value[currentAiMessageIndex].content.length;
  }

  // 设置打字速度（ms/字符）
  const typeSpeed = 30;

  // 清除之前的计时器
  if (typewriterTimer !== null) {
    clearInterval(typewriterTimer);
  }

  // 开始打字机效果
  typewriterTimer = window.setInterval(() => {
    if (charIndex < currentAiMessageContent.length) {
      // 更新当前显示的内容
      if (chatMessages.value[currentAiMessageIndex]) {
        chatMessages.value[currentAiMessageIndex].content = currentAiMessageContent.substring(0, charIndex + 1);
        // 滚动到底部
          scrollToBottom();
      }
      charIndex++;
    } else {
      // 打字完成
      if (typewriterTimer !== null) {
        clearInterval(typewriterTimer);
        typewriterTimer = null;
      }

      // 标记消息为已完成
      if (chatMessages.value[currentAiMessageIndex]) {
        chatMessages.value[currentAiMessageIndex].isComplete = true;
      }

      // 重置状态
      currentAiMessageIndex = null;
      currentAiMessageContent = '';
    }
  }, typeSpeed);
};

// 组件卸载时清理
onUnmounted(() => {
  closeSSE();

  // 清除打字机计时器
  if (typewriterTimer !== null) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }

  // 移除鼠标和触摸事件监听器
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('touchmove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('touchend', handleDragEnd);

  // 重置所有拖拽状态
  isDragging.value = false;
  isButtonDragging.value = false;
});
</script>

<style scoped>
.robot-avatar {
  width: 25px;
  height: 25px;
}

.exit-button {
  cursor: pointer;
  color: rgb(0, 0, 0);
  transition: color 0.3s, transform 0.3s;
  font-size: 16px;
  padding: 5px;
  border-radius: 50%;
}

.exit-button:hover {
  color: rgba(255, 255, 255, 0.8);
  animation: bounce 0.6s ease;
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.3);
  }

  60% {
    transform: scale(1.1);
  }
}

.ai-chat-container {
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 9999;
}

.ai-chat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  z-index: 10000;
}

.ai-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 120px;
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  padding: 10px;
}

.ai-button-container:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.ai-icon-container {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(75deg, rgb(114, 161, 237) 10%, #84c1fb 30%, #9c65ea 70%, #f9ad5c 90%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 8px;
}

.ai-button-text {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

/* 悬浮提示框样式 */
.ai-chat-tooltip {
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 10px;
  padding: 10px 15px;
  background-color: white;
  color: #000000;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  width: 250px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e8e8e8;
}

/* 提示框箭头 */
.ai-chat-tooltip::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent transparent white;
}

/* 鼠标悬浮时显示提示框 */
.ai-chat-button:hover .ai-chat-tooltip {
  opacity: 1;
  visibility: visible;
  right: calc(100% + 15px);
  /* 调整位置，使提示框与按钮保持适当距离 */
}

.ai-chat-window {
  width: 500px;
  height: 600px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  position: absolute;
  right: 200%;
  top: -400%;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.ai-chat-header {
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: linear-gradient(90deg, rgb(114, 161, 237) 10%, #84c1fb 30%, #9c65ea 70%, #e6dbf6 100%);
  border-bottom: none;
  cursor: move;
  width: 100%;
  position: relative;
  color: white;
}

.header-content .anticon-robot {
  font-size: 20px;
  margin-right: 10px;
}

.assistant-name {
  flex: 1;
  font-weight: bolder;
  font-size: 16px;
  cursor: move;
}

.header-content .exit-button {
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.3s;
}

.header-content .exit-button:hover {
  transform: rotate(90deg);
}

.ai-chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #fafafa;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-container {
  display: flex;
  align-items: flex-start;
}


.message-content {
  /* max-width: calc(100% - 40px); */
  flex: 1;
  word-break: break-word;
  white-space: normal;

}

.message-content .ant-card {
  margin: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  white-space: normal;
  padding: 10px 10px;
}

.message.user .message-content .ant-card {
  background-color: rgb(0, 149, 255);
  border-bottom-right-radius: 2px;
  word-break: break-word;
  white-space: normal;
}

.message.ai .message-content .ant-card {
  background-color: white;
  color: #333;
  border: 1px solid #e8e8e8;
  border-bottom-left-radius: 2px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 14px;
  margin-bottom: 16px;
}

/* .loading-icon {
  font-size: 20px;
  color: #1890ff;
  animation: spin 1s linear infinite;
  background-color: white;
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  border-radius: 8px;
  border-bottom-left-radius: 2px;
} */

/* @keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
} */

.ai-chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e8e8e8;
  background-color: white;
}

.ai-chat-input .ant-input {
  flex: 1;

}

/* 登录提示样式 */
.login-prompt {
  display: flex;
  /* justify-content: center; */
  /* align-items: center; */
  justify-content: center;
  align-items: center;
  height: 400px;
  background-color: #f5f5f5;
}

.prompt-content {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 90%;
}

.prompt-content h3 {
  margin-bottom: 24px;
  color: #333;
  font-size: 20px;
}

.prompt-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.prompt-buttons .ant-btn {
  padding: 8px 24px;
  font-size: 16px;
}

.prompt-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  background: linear-gradient(75deg, rgb(114, 161, 237) 10%, #84c1fb 30%, #9c65ea 70%, #f9ad5c 90%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
}
.icon-cross {
  display: inline-block;
  width: 24px;
  height: 24px;
  position: relative;
}
.icon-cross::before,
.icon-cross::after {
  content: '';
  position: absolute;
  background-color: white;
  border-radius: 2px;
}
.icon-cross::before {
  width: 4px;
  height: 24px;
  left: 10px;
  top: 0;
}
.icon-cross::after {
  width: 24px;
  height: 4px;
  left: 0;
  top: 10px;
}

</style>