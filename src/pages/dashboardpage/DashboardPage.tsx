import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, MessageSquareText, Phone, Settings, SquarePen, UserRound } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import { ChatSidebar, ChatSidebarHeader } from "./ChatSidebar";
import { ChatSidebarFooter } from "./chatSidebarfooter";
import { ChatThread } from "./ChatThread";
import type { ChatItem, Message, User } from "./types";
import { useChats } from "./useChats";
import { createMessage, getMessages } from "@/service/messageservice";
import { getUploadedFileUrl, uploadFile } from "@/service/uploadfile";
import socket from "@/lib/socket";

type RawMessage = Record<string, unknown>;

function getMessageList(response: unknown): RawMessage[] {
  if (Array.isArray(response)) {
    return response.filter((message): message is RawMessage => Boolean(message && typeof message === "object"));
  }

  if (!response || typeof response !== "object") return [];

  const payload = response as RawMessage;
  const nested = payload.data ?? payload.messages;
  return Array.isArray(nested)
    ? nested.filter((message): message is RawMessage => Boolean(message && typeof message === "object"))
    : [];
}

function mapApiMessage(rawMessage: RawMessage, currentUserId?: string): Message | null {
  const id = Number(rawMessage.id);
  const messageText = typeof rawMessage.message === "string" ? rawMessage.message : "";
  const caption = typeof rawMessage.caption === "string" ? rawMessage.caption : undefined;
  const type = ["text", "image", "video", "file", "audio"].includes(String(rawMessage.type))
    ? (rawMessage.type as Message["type"])
    : "text";
  const createdAt = rawMessage.createdAt ?? rawMessage.created_at;
  const senderId = String(rawMessage.senderId ?? rawMessage.sender_id ?? "");
  const mediaPath = type === "text" ? undefined : messageText;
  const mediaName = messageText.split("/").pop();

  if (!Number.isFinite(id)) return null;

  return {
    id,
    sender: senderId === currentUserId ? "me" : "them",
    text: type === "text" ? messageText : mediaName ?? type ?? "file",
    time: createdAt
      ? new Date(String(createdAt)).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
      })
      : "",
    type,
    mediaUrl: mediaPath ? getUploadedFileUrl(mediaPath) : undefined,
    caption,
  };
}

const logo = (
  <div className="flex items-center gap-2.5">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
      <MessageSquareText className="h-4.5 w-4.5" />
    </div>
    <span className="text-xl font-bold tracking-tight text-indigo-600">WeTalk</span>
  </div>
);

function DashboardPage() {
  const { user: currentUser, loading } = useAuth();
  const location = useLocation();
  const { chats: chatList, loading: chatsLoading, error: chatsError, reloadChats } = useChats();
  const [selectedChatId, setSelectedChatId] = useState("");
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const privateChat = location.state?.privateChat;
    const groupChat = location.state?.groupChat;

    if (!privateChat && !groupChat) return;

    if (groupChat) {
      const groupId = groupChat.id ?? groupChat.chat?.id;

      void reloadChats().then(() => {
        if (groupId !== undefined) {
          setSelectedChatId(String(groupId));
        }
        setMobileThreadOpen(true);
      });
      navigate("/dashboard", { replace: true, state: null });
      return;
    }

    const chat: ChatItem = {
      id: String(privateChat.id),
      name: privateChat.name,
      preview: "Start a conversation",
      time: "Now",
      userId: privateChat.userId,
      type: privateChat.type,
      unread: 0,
      online: false,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(privateChat.name)}&background=4f46e5&color=fff`,
    };

    setSelectedChatId(chat.id);
    setMobileThreadOpen(true);
    void reloadChats();
    navigate("/dashboard", { replace: true, state: null });
  }, [location.state, navigate, reloadChats]);

  const selectedChat = useMemo(
    () => chatList.find((chat) => chat.id === selectedChatId) ?? chatList[0],
    [chatList, selectedChatId],
  );

  useEffect(() => {
    const chatId = selectedChat ? Number(selectedChat.id) : NaN;
    if (!Number.isInteger(chatId)) {
      setMessages([]);
      return;
    }

    let active = true;
    setMessages([]);

    const handleNewMessage = (rawMessage: RawMessage) => {
      const nestedChat = rawMessage.chat;
      const nestedChatId = nestedChat && typeof nestedChat === "object"
        ? (nestedChat as Record<string, unknown>).id
        : undefined;
      const incomingChatId = Number(rawMessage.chatId ?? rawMessage.chat_id ?? nestedChatId);
      if (!active || incomingChatId !== chatId) return;

      const newMessage = mapApiMessage(rawMessage, currentUser?.id);
      if (!newMessage) return;

      setMessages((previousMessages) => {
        if (previousMessages.some((message) => message.id === newMessage.id)) {
          return previousMessages;
        }

        return [...previousMessages, newMessage];
      });
    };

    socket.on("new:message", handleNewMessage);

    void getMessages(chatId)
      .then((response) => {
        if (!active) return;

        const loadedMessages = getMessageList(response)
          .map((message) => mapApiMessage(message, currentUser?.id))
          .filter((message): message is Message => message !== null);
        setMessages((previousMessages) => {
          const loadedIds = new Set(loadedMessages.map((message) => message.id));
          const liveMessages = previousMessages.filter((message) => !loadedIds.has(message.id));
          return [...loadedMessages, ...liveMessages];
        });
      })
      .catch((error) => {
        if (active) {
          console.error("Failed to load messages", error);
          setMessages([]);
        }
      });

    return () => {
      active = false;
      socket.off("new:message", handleNewMessage);
    };
  }, [currentUser?.id, selectedChat]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (chatsLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Loading chats...</div>;
  }

  if (chatsError) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-rose-500">Unable to load chats.</div>;
  }

  const sendMessage = async () => {
    const text = draft.trim();
    const chatId = selectedChat ? Number(selectedChat.id) : NaN;
    if ((!text && !selectedFile) || !Number.isInteger(chatId)) return;

    const file = selectedFile;

    try {
      let type: "text" | "image" | "video" | "file" | "audio" = "text";
      let message = text;

      if (file) {
        const uploadedFile = await uploadFile(file);
        type = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("audio/")
              ? "audio"
              : "file";
        message = uploadedFile.path;
      }

      await createMessage({
        chatId,
        type,
        message,
        ...(file && text ? { caption: text } : {}),
      });
    } catch (error) {
      console.error("Failed to send message", error);
      return;
    }

    setDraft("");
    setSelectedFile(null);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const openChat = (id: string) => {
    setSelectedChatId(id);
    setMobileThreadOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const safeUser: User = currentUser ?? {
    id: "",
    username: "Loading...",
    email: "",
    profileimg: null,
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto hidden h-screen max-w-[1440px] flex-col p-4 lg:flex">
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex w-[360px] shrink-0 flex-col border-r border-slate-200 bg-white">
            <ChatSidebarHeader logo={logo} onNewChat={() => navigate("/new-chat")} />
            <div className="min-h-0 flex-1">
              <ChatSidebar
                chats={chatList}
                selectedChatId={selectedChatId}
                query={query}
                onQueryChange={setQuery}
                onSelectChat={setSelectedChatId}
                onNewChat={() => navigate("/new-chat")}
              />
            </div>
            <ChatSidebarFooter user={safeUser} />
          </div>

          {selectedChat ? (
            <ChatThread
              selectedChat={selectedChat}
              messages={messages}
              draft={draft}
              selectedFile={selectedFile}
              onDraftChange={setDraft}
              onSend={sendMessage}
              onFileChange={setSelectedFile}
              scrollRef={scrollRef}
            />
          ) : (
            <section className="flex min-w-0 flex-1 items-center justify-center bg-slate-50 px-6 text-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">No chats yet</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Create a new chat to get started.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="flex h-dvh flex-col bg-white lg:hidden">
        {mobileThreadOpen && selectedChat ? (
          <div className="h-full min-h-0 flex-1">
            <ChatThread
              selectedChat={selectedChat}
              messages={messages}
              draft={draft}
              selectedFile={selectedFile}
              onDraftChange={setDraft}
              onFileChange={setSelectedFile}
              onSend={sendMessage}
              onBack={() => setMobileThreadOpen(false)}
              scrollRef={scrollRef}
            />
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <button
                aria-label="Menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-lg font-bold tracking-tight text-indigo-600">WeTalkkk</span>
              <button
                aria-label="New message"
                onClick={() => navigate("/new-chat")}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
              >
                <SquarePen className="h-5 w-5" />
              </button>
            </header>



            <div className="min-h-0 flex-1">
              {/* <ChatSidebarHeader mobileMode onBack={() => setMobileThreadOpen(false)} /> */}
              <ChatSidebar
                chats={chatList}
                selectedChatId={selectedChatId}
                query={query}
                onQueryChange={setQuery}
                onSelectChat={openChat}
                mobileMode
              />
            </div>

            <nav className="flex items-center justify-around border-t border-slate-200 px-4 py-2">
              {[
                { label: "Chats", active: true, path: "/chats", icon: MessageSquareText },
                { label: "Calls", active: false, path: "/calls", icon: Phone },
                { label: "People", active: false, path: "/people", icon: UserRound },
                { label: "Settings", active: false, path: "/settings", icon: Settings },
              ].map(({ label, active, path, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={
                    active
                      ? "flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-medium text-indigo-600 transition"
                      : "flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-medium text-slate-400 transition hover:text-slate-600"
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
