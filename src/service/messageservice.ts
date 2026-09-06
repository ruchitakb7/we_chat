import  api  from "../lib/axios";

export interface CreateMessagePayload {
  chatId: number;
  type: "text" | "image" | "video" | "file" | "audio";
  message: string;
  caption?: string;
}

export const createMessage = async (
  data: CreateMessagePayload
) => {
  const response = await api.post("/messages/send", data);

  return response.data;
};


export const getMessages = async (chatId: number) => {
  const response = await api.get(`/messages/${chatId}`);

  return response.data;
};