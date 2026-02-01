import { defineStore } from "pinia";
import { ref } from "vue";

export const useAiChatStore = defineStore("aiChat", () => {
  // 定义响应式数据，用于持久化存储AI聊天相关状态
  const chatId = ref<string>('');
  const chatMessages = ref<{ type: 'user' | 'ai'; content: string; isComplete?: boolean }[]>([]);

  // 设置聊天ID
  function setChatId(id: string) {
    chatId.value = id;
  }

  // 添加聊天消息
  function addChatMessage(message: { type: 'user' | 'ai'; content: string; isComplete?: boolean }) {
    chatMessages.value.push(message);
  }

  // 清空聊天消息
  function clearChatMessages() {
    chatMessages.value = [];
  }

  return {
    chatId,
    chatMessages,
    setChatId,
    addChatMessage,
    clearChatMessages
  };
});