import client from "./client";

export const getConversations = async () => {
  const { data } = await client.get("/conversation/all");
  return data.conversations;
};

export const createConversation = async (formData: FormData) => {
  const { data } = await client.post("/conversation/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.conversation;
};

export const getMessages = async (conversationId: string, limit = 20, offset = 0) => {
  const { data } = await client.get(`/message/${conversationId}?limit=${limit}&offset=${offset}`);
  return data.messages;
};

export const sendMessage = async (formData: FormData) => {
  const { data } = await client.post("/message/send", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.message;
};

export const markAsSeen = async (messageId: string) => {
  const { data } = await client.patch(`/message/seen/${messageId}`);
  return data;
};

export const addReaction = async (messageId: string, emoji: string) => {
  const { data } = await client.patch(`/message/react/${messageId}`, { emoji });
  return data;
};
