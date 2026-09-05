import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, MessageSquareText, Phone, Settings, SquarePen, UserRound } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import { ChatSidebar, ChatSidebarHeader } from "./ChatSidebar";
import { ChatSidebarFooter } from "./chatSidebarfooter";
import { ChatThread } from "./ChatThread";
import type { ChatItem, Message, User } from "./types";
import { useChats } from "./useChats";

/*
  {
    id: "amit",
    name: "Amit Sharma",
    preview: "Yes — let’s tighten that first step.",
    time: "2m",
    unread: 2,
    online: true,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "project",
    name: "Project Team",
    preview: "Rahul: Can we move it to Thursday?",
    time: "10m",
    unread: 5,
    group: true,
    groupColor: "bg-indigo-600",
    avatar: "",
  },
  {
    id: "priya",
    name: "Priya Patel",
    preview: "Sure! Will share the design.",
    time: "1h",
    unread: 1,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "rahul",
    name: "Rahul Verma",
    preview: "The spacing looks better now.",
    time: "2h",
    unread: 0,
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "design",
    name: "Design Squad",
    preview: "Neha: Added some comments",
    time: "Yesterday",
    unread: 0,
    group: true,
    groupColor: "bg-emerald-500",
    avatar: "",
  },
  {
    id: "neha",
    name: "Neha Singh",
    preview: "Let’s catch up tomorrow.",
    time: "Yesterday",
    unread: 0,
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "siddharth",
    name: "Siddharth",
    preview: "Thanks!",
    time: "2d",
    unread: 0,
    avatar:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "marketing",
    name: "Marketing Team",
    preview: "Karan: Campaign analytics ready",
    time: "3d",
    unread: 0,
    group: true,
    groupColor: "bg-amber-400",
    avatar: "",
  },
]; */

const initialThread: Message[] = [
  {
    id: 1,
    sender: "me",
    text: "How should we handle the empty state on the dashboard?\nNot sure what to show before a project exists.",
    time: "10:42 AM",
  },
  {
    id: 2,
    sender: "them",
    text: "Lead with a friendly prompt plus one clear action.\nA short line of copy, a single primary button, and a subtle illustration keeps it calm instead of empty.",
    time: "10:42 AM",
  },
  {
    id: 3,
    sender: "me",
    text: "Love that. Can you draft the empty-state copy for me?",
    time: "10:44 AM",
  },
];

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
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialThread);
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
      unread: 0,
      online: true,
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

  if (!selectedChat) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">No chats yet. Create a new chat to get started.</div>;
  }

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    setMessages((prev) => [...prev, { id: Date.now(), sender: "me", text, time }]);
    setDraft("");

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

          <ChatThread
            selectedChat={selectedChat}
            messages={messages}
            draft={draft}
            onDraftChange={setDraft}
            onSend={sendMessage}
            scrollRef={scrollRef}
          />
        </div>
      </div>

      <div className="flex h-dvh flex-col bg-white lg:hidden">
        {mobileThreadOpen ? (
          <div className="min-h-0 flex-1">
            <ChatThread
              selectedChat={selectedChat}
              messages={messages}
              draft={draft}
              onDraftChange={setDraft}
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
                { label: "Chats", active: true,path: "/chats", icon: MessageSquareText },
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
