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
  profileimg?: string | null;
};

export type ChatMember = {
  id: string;
  fullName?: string | null;
  username: string;
  profileimg?: string | null;
  role?: string;
  joinedAt?: string;
};

export type ChatDetails = {
  id: string | number;
  type: "group" | "private";
  name?: string;
  grpprofile?: string | null;
  createdBy?: string;
  member?: ChatMember;
  members?: ChatMember[];
};

export type Message = {
  id: number;
  sender: "me" | "them";
  senderName?: string;
  senderUsername?: string;
  senderProfileImage?: string;
  text: string;
  time: string;
  createdAt?: string;
  type?: "text" | "image" | "video" | "file" | "audio" | "system";
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