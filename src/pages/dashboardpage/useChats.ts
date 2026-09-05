import { useCallback, useEffect, useState } from "react";

import { getUserChats, type UserChat } from "@/service/chatService";

import type { ChatItem } from "./types";

function mapChatToChatItem(chat: UserChat): ChatItem {
  

  return {
    id: String(chat.id),
    type: chat.type,
    userId: chat.userId ?? undefined,
    userName: chat.user?.fullName || chat.user?.username || undefined,
    name: chat.name || chat.user?.fullName || chat.user?.username || "Chat",
    preview: chat.lastMessage || "Start a conversation",
    time: new Date(chat.createdAt).toLocaleDateString(),
    unread: 0,
    online: chat.type === "private",
    group: chat.type === "group",
    groupColor: chat.type === "group" ? "bg-indigo-600" : undefined,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || chat.user?.fullName || chat.user?.username || "Chat")}&background=4f46e5&color=fff`,
  };
}

export function useChats() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const userChats = await getUserChats();
      setChats(userChats.map(mapChatToChatItem));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  return { chats, loading, error, reloadChats: loadChats };
}