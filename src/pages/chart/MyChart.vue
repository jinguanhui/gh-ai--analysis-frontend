d:/code/gh-ai-analysis/gh-ai-analysis-frontend-vue/src/pages/user/AiChart.vue
<template>
  <div class="ai-chat-container">
    <!-- AI对话按钮 -->
    <div class="ai-chat-button" @click="toggleChatWindow">
      <a-icon type="robot" theme="twoTone" two-tone-color="#1890ff" />
    </div>

    <!-- AI对话窗口 -->
    <div class="ai-chat-window" v-if="isChatWindowOpen">
      <div class="ai-chat-header">
        <div class="header-content">
          <a-icon type="robot" theme="twoTone" two-tone-color="#1890ff" />
          <span>AI助手</span>
        </div>
        <a-icon type="close" @click="toggleChatWindow" />
      </div>

      <div class="ai-chat-messages">
        <div class="message" v-for="(msg, index) in chatMessages" :key="index" :class="msg.type">
          <div class="message-content">
            {{ msg.content }}
          </div>
        </div>
        <div class="loading" v-if="isLoading">
          <a-icon type="loading" />
        </div>
      </div>

      <div class="ai-chat-input">
        <a-input
          v-model:value="inputMessage"
          placeholder="请输入您的问题..."
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        />
        <a-button type="primary" @click="sendMessage" :disabled="isLoading || !inputMessage">
          发送
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';
import { message } from 'ant-design-vue';

// 聊天状态
const isChatWindowOpen = ref(false);
const chatMessages = ref<{ type: 'user' | 'ai'; content: string; isComplete?: boolean }[]>([]);
const inputMessage = ref('');
const isLoading = ref(false);

// SSE连接实例
let eventSource: EventSource | null = null;
// 聊天ID，用于保持对话上下文
let chatId: string = '';

// 当前正在输入的AI消息索引
let currentAiMessageIndex: number | null = null;
// 当前AI消息的完整内容
let currentAiMessageContent: string = '';
// 打字机计时器
let typewriterTimer: number | null = null;

// 切换聊天窗口显示状态
const toggleChatWindow = () => {
  isChatWindowOpen.value = !isChatWindowOpen.value;
  // 如果是第一次打开聊天窗口，初始化对话
  if (isChatWindowOpen.value && chatMessages.value.length === 0) {
    initChat();
  }
};

// 初始化对话
const initChat = async () => {
  // 显示加载状态
  isLoading.value = true;
  // 生成聊天ID
  chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  
  try {
    // 这里可以添加初始化数据请求逻辑（如果需要）
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 添加欢迎消息
    chatMessages.value.push({
      type: 'ai',
      content: '您好！我是AI助手，有什么可以帮助您的吗？',
      isComplete: true
    });
  } finally {
    isLoading.value = false;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value || isLoading.value) return;

  const msgContent = inputMessage.value;
  // 添加用户消息到对话列表
  chatMessages.value.push({
    type: 'user',
    content: msgContent
  });
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

    eventSource = new EventSource(sseUrl);
    console.log('AI聊天SSE连接已建立：', sseUrl);

    // 接收消息
    eventSource.onmessage = (event) => {
      try {
        const data = event.data;
        if (data) {
          // 如果是新的AI消息开始，创建空消息并开始打字机效果
          if (currentAiMessageIndex === null) {
            currentAiMessageIndex = chatMessages.value.length;
            chatMessages.value.push({
              type: 'ai',
              content: '',
              isComplete: false
            });
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
      message.error('AI聊天连接失败');
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
      }
      charIndex++;
    } else {
      // 打字完成
      if (typewriterTimer !== null) {
        clearInterval(typewriterTimer);
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

// 组件激活时的处理（进入KeepAlive缓存）
onActivated(() => {
  console.log('AI聊天组件已激活');
  // 组件激活时不需要重新建立连接，保持现有的聊天上下文
});

// 组件停用前的处理（离开KeepAlive缓存）
onDeactivated(() => {
  console.log('AI聊天组件将被停用');
  // 关闭SSE连接以避免资源泄漏
  closeSSE();
  
  // 清除打字机计时器
  if (typewriterTimer !== null) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
});

// 组件卸载时清理
onUnmounted(() => {
  closeSSE();
  
  // 清除打字机计时器
  if (typewriterTimer !== null) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
});
</script>

<style scoped>
.ai-chat-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
}

.ai-chat-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  transition: all 0.3s ease;
  font-size: 24px;
}

.ai-chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.6);
}

.ai-chat-window {
  width: 380px;
  max-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e8e8e8;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #333;
}

.ai-chat-header .anticon-close {
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.ai-chat-header .anticon-close:hover {
  color: #666;
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

.message-content {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 8px;
  line-height: 1.5;
}

.message.user .message-content {
  background-color: #1890ff;
  color: white;
  border-bottom-right-radius: 2px;
}

.message.ai .message-content {
  background-color: white;
  color: #333;
  border: 1px solid #e8e8e8;
  border-bottom-left-radius: 2px;
}

.loading {
  display: flex;
  justify-content: flex-start;
  padding: 10px 14px;
  margin-bottom: 16px;
}

.loading .anticon-loading {
  font-size: 20px;
  color: #1890ff;
  animation: spin 1s linear infinite;
  background-color: white;
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  border-radius: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

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
</style>