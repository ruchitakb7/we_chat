import { Plus, Search, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatItem } from "./types";

function ChatAvatar({
  chat,
  size = "md",
}: {
  chat: ChatItem;
  size?: "md" | "lg";
}) {
  const dim = size === "md" ? "h-12 w-12" : "h-11 w-11";

  return (
    <div className="relative shrink-0">
      {chat.group ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-full text-white",
            dim,
            chat.groupColor,
          )}
        >
          <Users className="h-5 w-5" />
        </div>
      ) : (
        <div className={cn("overflow-hidden rounded-full", dim)}>
          <img
            src={chat.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=4f46e5&color=fff` : chat.avatar}
            alt={chat.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      {chat.online && (
        <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}

function ChatListItem({
  chat,
  selected,
  onSelect,
}: {
  chat: ChatItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-150",
        selected ? "bg-indigo-50" : "hover:bg-slate-50",
      )}
    >
      <ChatAvatar chat={chat} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{chat.name}</p>
          <span
            className={cn(
              "shrink-0 text-[11px]",
              chat.unread > 0 ? "font-semibold text-indigo-600" : "text-slate-400",
            )}
          >
            {chat.time}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-slate-500">{chat.preview}</p>
          {chat.unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ChatSidebarHeader({
  logo,
  mobileMode = false,
  onBack,
  onNewChat,
}: {
  logo?: React.ReactNode;
  mobileMode?: boolean;
  onBack?: () => void;
  onNewChat?: () => void;
}) {
  if (mobileMode) {
    return (
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <button
          aria-label="Back"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
        >
          <Search className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold tracking-tight text-indigo-600">WeTalk</span>
        <button
          aria-label="New message"
          onClick={onNewChat}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      {logo}
      <button
        aria-label="New message"
        onClick={onNewChat}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ChatSidebarSearch({
  query,
  onQueryChange,
  mobileMode = false,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  mobileMode?: boolean;
}) {
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search users or chats..."
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
        {!mobileMode && (
          <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:block">
            Ctrl K
          </kbd>
        )}
      </div>
    </div>
  );
}

export function ChatSidebarList({
  chats,
  selectedChatId,
  query,
  onSelectChat,
  onNewChat,
}: {
  chats: ChatItem[];
  selectedChatId: string;
  query: string;
  onSelectChat: (id: string) => void;
  onNewChat?: () => void;
}) {
  const visibleChats = chats.filter((chat) => {
    if (!query.trim()) return true;
    const text = `${chat.name} ${chat.preview}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <h2 className="text-sm font-medium text-slate-500">Chats</h2>
        <button
          aria-label="New chat"
          onClick={onNewChat}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-2">
        {visibleChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            selected={chat.id === selectedChatId}
            onSelect={() => onSelectChat(chat.id)}
          />
        ))}
        {visibleChats.length === 0 && (
          <p className="px-3 pt-8 text-center text-sm text-slate-400">
            No chats match “{query}”.
          </p>
        )}
      </div>
    </>
  );
}

export function ChatSidebar({
  chats,
  selectedChatId,
  query,
  onQueryChange,
  onSelectChat,
  onNewChat,
  mobileMode = false,
}: {
  chats: ChatItem[];
  selectedChatId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectChat: (id: string) => void;
  onNewChat?: () => void;
  mobileMode?: boolean;
}) {
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-white">
      <ChatSidebarSearch query={query} onQueryChange={onQueryChange} mobileMode={mobileMode} />
      {!mobileMode && (
        <ChatSidebarList
          chats={chats}
          selectedChatId={selectedChatId}
          query={query}
          onSelectChat={onSelectChat}
          onNewChat={onNewChat}
        />
      )}
      {mobileMode && (
        <div className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-2">
          {chats
            .filter((chat) => {
              if (!query.trim()) return true;
              const text = `${chat.name} ${chat.preview}`.toLowerCase();
              return text.includes(query.trim().toLowerCase());
            })
            .map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                selected={chat.id === selectedChatId}
                onSelect={() => onSelectChat(chat.id)}
              />
            ))}
        </div>
      )}
    </aside>
  );
}

export { ChatAvatar, ChatListItem };
