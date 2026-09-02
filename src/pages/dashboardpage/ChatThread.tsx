import {
  ArrowLeft,
  CheckCheck,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Users,
  Video,
  Mic,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatItem, Message } from "./types";

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
            src={chat.avatar}
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

function MessageBubble({ message, chat }: { message: Message; chat: ChatItem }) {
  const mine = message.sender === "me";

  return (
    <div className={cn("flex items-end gap-2.5", mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
          {chat.group ? (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center text-white",
                chat.groupColor,
              )}
            >
              <Users className="h-4 w-4" />
            </div>
          ) : (
            <img
              src={chat.avatar}
              alt={chat.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] px-4 py-3 sm:max-w-[60%]",
          mine
            ? "rounded-2xl rounded-br-md bg-indigo-600 text-white"
            : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-700",
        )}
      >
        {message.text.split("\n").map((line, i) => (
          <p key={i} className="text-sm leading-relaxed">
            {line}
          </p>
        ))}
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1 text-[10px]",
            mine ? "justify-end text-indigo-200" : "text-slate-400",
          )}
        >
          <span>{message.time}</span>
          {mine && <CheckCheck className="h-3.5 w-3.5" />}
        </div>
      </div>
    </div>
  );
}

export function ChatThread({
  selectedChat,
  messages,
  draft,
  onDraftChange,
  onSend,
  onBack,
  scrollRef,
}: {
  selectedChat: ChatItem;
  messages: Message[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onBack?: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <ChatAvatar chat={selectedChat} size="lg" />
          <div>
            <p className="text-sm font-semibold text-slate-900">{selectedChat.name}</p>
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs",
                selectedChat.online ? "text-slate-500" : "text-slate-400",
              )}
            >
              {selectedChat.online && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
              {selectedChat.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[
            { icon: Search, label: "Search in chat" },
            { icon: Phone, label: "Voice call" },
            { icon: Video, label: "Video call" },
            { icon: MoreVertical, label: "More options" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto mb-6 w-fit rounded-full border border-slate-200 px-4 py-1 text-[11px] font-medium text-slate-500">
          Today
        </div>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} chat={selectedChat} />
          ))}
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
          <div className="flex items-center gap-2 px-3 pt-2.5">
            <button
              aria-label="Attach file"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder={`Message ${selectedChat.name.split(" ")[0]}...`}
              rows={1}
              className="max-h-32 w-full resize-none bg-transparent py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button
              aria-label="Voice message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              onClick={onSend}
              disabled={!draft.trim()}
              className={cn(
                "flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-medium transition",
                draft.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "cursor-not-allowed bg-indigo-600/50 text-white",
              )}
            >
              Send
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between px-4 pb-2.5 pt-1">
            <p className="text-[11px] text-slate-400">
              Press Enter to send, Shift + Enter for a new line
            </p>
            {selectedChat.online && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                {selectedChat.name.split(" ")[0]} is typing...
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
