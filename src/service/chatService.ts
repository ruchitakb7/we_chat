import api from "../lib/axios";

export type PrivateChatResponse = {
  chat: {
    id: number;
    type: "private";
    createdAt: string;
    user: {
      id: number;
      username: string;
      fullName: string;
    };
  };
};

export const createPrivateChat = async (userId: number): Promise<PrivateChatResponse> => {
  const response = await api.post("/chat/private", {
    userId,
  });

  return response.data;
};


export interface UserChat {
  id: number;
  type: "private" | "group";
  name?: string | null;
  user?: {
    id: string;
    username: string;
    fullName: string | null;
  };
  userId?: string | null;
  createdAt: string;
  lastMessage: string | null;
}

export const getUserChats = async (): Promise<UserChat[]> => {
  const response = await api.get("/chat");

  return response.data.chats;
};



export const createGroupChat = async (
    groupName: string,
    memberUsernames: string[]
) => {
    const response = await api.post("/chat/group", {
        groupName,
        memberUsernames,
    });

    return response.data;
};