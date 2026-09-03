export type ChatItem = {
  id: string;
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
};


export type User = {
  id: string;
  fullName?: string | null;
  username: string | null;
  email: string;
  profileimg: string | null;
};