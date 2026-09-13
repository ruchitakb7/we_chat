import api from "../lib/axios";


export const removeChatMember = async (
  chatId: number,
  userId: string
) => {
  const response = await api.delete(`/chat/members/${chatId}/${userId}`);

  return response.data;
};


export const leaveGroup = async (chatId: number) => {
  const response = await api.delete(`/chat/members/${chatId}/leave`);

  return response.data;
};

export const addChatMember = async (chatId: number, userId: string | number) => {
  const response = await api.post(`/chat/members/${chatId}/`, { userId });
  return response.data;
};

export const promoteChatMember = async (chatId: number, userId: string) => {
  const response = await api.patch(`/chat/members/${chatId}/${userId}/role`, { role: "admin" });
  return response.data;
};