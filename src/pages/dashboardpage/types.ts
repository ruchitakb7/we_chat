export type ChatItem = {
  id: string;
  type: "private" | "group";
  userId?: string;
  userName?: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online?: boolean;
  group?: boolean;
  groupColor?: string;
  avatar: string;
};

export type Message = {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  type?: "text" | "image" | "video" | "file" | "audio";
  mediaUrl?: string;
  caption?: string;
};


export type User = {
  id: string;
  fullName?: string | null;
  username: string | null;
  email: string;
  profileimg: string | null;
};