import {
  ArrowLeft,
  CheckCheck,
  FileText,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Users,
  Video,
  Mic,
  X,
} from "lucide-react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import socket from "../../lib/socket";

import { cn } from "@/lib/utils";
import type { ChatItem, Message } from "./types";

function ChatAvatar({
  chat,
  size = "md",
  online,
}: {
  chat: ChatItem;
  size?: "md" | "lg";
  online?: boolean;
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
      {(online ?? chat.online) && (
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
            ? "rounded-2xl rounded-br-md border border-indigo-200 bg-transparent text-slate-700"
            : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-700",
        )}
      >
        {message.mediaUrl && message.type === "image" && (
          <img src={message.mediaUrl} alt={message.caption || message.text} className="max-h-64 rounded-lg object-contain" />
        )}
        {message.mediaUrl && message.type === "video" && (
          <video src={message.mediaUrl} controls className="max-h-64 rounded-lg" />
        )}
        {message.mediaUrl && message.type === "audio" && (
          <audio src={message.mediaUrl} controls className="max-w-full" />
        )}
        {message.caption ? (
          <p className="mt-2 text-sm leading-relaxed">{message.caption}</p>
        ) : !message.mediaUrl ? (
          message.text.split("\n").map((line, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {line}
            </p>
          ))
        ) : null}
        {message.mediaUrl && message.type === "file" && (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="text-sm underline">
            {message.text}
          </a>
        )}
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

function formatLastSeen(last_seen: string | Date | null | undefined) {
  if (!last_seen) {
    return "Last seen unavailable";
  }

  const elapsedMinutes = Math.floor(
    (Date.now() - new Date(last_seen).getTime()) / 60000,
  );

  if (Number.isNaN(elapsedMinutes)) {
    return "Last seen unavailable";
  }

  if (elapsedMinutes < 1) {
    return "Last seen just now";
  }

  if (elapsedMinutes < 60) {
    return `Last seen ${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `Last seen ${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Last seen ${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} ago`;
}

export function ChatThread({
  selectedChat,
  messages,
  draft,
  selectedFile,
  onDraftChange,
  onSend,
  onFileChange,
  onBack,
  scrollRef,
}: {
  selectedChat: ChatItem;
  messages: Message[];
  draft: string;
  selectedFile: File | null;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onFileChange: (file: File | null) => void;
  onBack?: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [isOnline, setIsOnline] = useState(false);
  const [last_seen, setlast_seen] = useState<string | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onDraftChange(`${draft}${emojiData.emoji}`);
    setEmojiPickerOpen(false);
  };

  const toggleVoiceRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      console.error("Voice recording is not supported by this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const extension = mimeType.includes("mp4") ? "m4a" : "webm";
        const audioFile = new File(
          [new Blob(recordingChunksRef.current, { type: mimeType })],
          `voice-${Date.now()}.${extension}`,
          { type: mimeType },
        );

        onFileChange(audioFile);
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingChunksRef.current = [];
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Unable to access microphone", error);
    }
  };

  useEffect(() => {
    if (!isRecording) return;

    const timer = window.setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFilePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setSelectedFilePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedFile]);



  useEffect(() => {
  if (
    selectedChat.type !== "private" ||
    !selectedChat.userId
  ) {
    setIsOnline(false);
    setlast_seen(null);
    return;
  }

  setIsOnline(false);
  setlast_seen(null);

  const targetUserId = selectedChat.userId;

  const checkOnlineStatus = () => {
    socket.emit("check:user:online", targetUserId);
  };

  const handleStatus = ({
    userId,
    isOnline,
    last_seen,
  }: {
    userId: string;
    isOnline: boolean;
    last_seen?:Date | null;
  }) => {
    if (userId === targetUserId) {
      console.log(
        `User ${userId} is ${isOnline ? "online" : "offline"}`,
        isOnline ? "" : `Last seen: ${last_seen ?? "unavailable"}`,
      );
      setIsOnline(isOnline);
      setlast_seen(isOnline ? null : last_seen ? String(last_seen) : null);
    }
  };

  const handleOnline = (userId: string) => {
    if (userId === targetUserId) {
      setIsOnline(true);
      setlast_seen(null);
    }
  };

  const handleOffline = ({
    userId,
    last_seen,
  }: {
    userId: string;
    last_seen?: string | Date | null;
  }) => {
    if (userId === targetUserId) {
      setIsOnline(false);
      setlast_seen(last_seen ? String(last_seen) : null);
    }
  };

  socket.on("connect", checkOnlineStatus);
  socket.on("user:online:status", handleStatus);
  socket.on("user:online", handleOnline);
  socket.on("user:offline", handleOffline);

  // If already connected, check immediately
  if (socket.connected) {
    checkOnlineStatus();
  }

  return () => {
    socket.off("connect", checkOnlineStatus);
    socket.off("user:online:status", handleStatus);
    socket.off("user:online", handleOnline);
    socket.off("user:offline", handleOffline);
  };
  }, [selectedChat]);

  useEffect(() => {
    const chatId = String(selectedChat.id);

    const joinChat = () => {
      socket.emit("join:chat", chatId);
    };

    socket.on("connect", joinChat);

    if (socket.connected) {
      joinChat();
    }

    return () => {
      socket.off("connect", joinChat);
    };
  }, [selectedChat.id]);

  const displayOnline = selectedChat.type === "private" ? isOnline : false;

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
          <ChatAvatar chat={selectedChat} size="lg" online={displayOnline} />
          <div>
            <h2 className="font-semibold">
              {selectedChat.type === "private"
                ? selectedChat.userName || selectedChat.name
                : selectedChat.name}
            </h2>

            {selectedChat.type === "private" && (
              <p className="text-xs text-slate-500">
                {isOnline ? "Online" : formatLastSeen(last_seen)}
              </p>
            )}
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

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto mb-6 w-fit rounded-full border border-slate-200 px-4 py-1 text-[11px] font-medium text-slate-500">
          Today
        </div>
        {messages.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center px-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Start a conversation
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                Send a message to {selectedChat.userName || selectedChat.name} and start chatting.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} chat={selectedChat} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-5 pb-5">
        {selectedFile ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-slate-700">
              <span className="truncate text-sm font-medium">Preview</span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => onFileChange(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-indigo-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-48 items-center justify-center bg-slate-100 p-4">
              {selectedFile.type.startsWith("image/") && selectedFilePreview && (
                <img
                  src={selectedFilePreview}
                  alt={selectedFile.name}
                  className="max-h-64 max-w-full rounded-lg object-contain"
                />
              )}
              {selectedFile.type.startsWith("video/") && selectedFilePreview && (
                <video
                  src={selectedFilePreview}
                  controls
                  className="max-h-64 max-w-full rounded-lg"
                />
              )}
              {selectedFile.type.startsWith("audio/") && selectedFilePreview && (
                <audio src={selectedFilePreview} controls className="w-full max-w-sm" />
              )}
              {!selectedFile.type.startsWith("image/") &&
                !selectedFile.type.startsWith("video/") &&
                !selectedFile.type.startsWith("audio/") && (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <FileText className="h-12 w-12" />
                  <span className="max-w-xs truncate text-sm">{selectedFile.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3">
              <input
                id="chat-file-input"
                type="file"
                className="hidden"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              />
              <button
                aria-label="Add another attachment"
                type="button"
                onClick={() => document.getElementById("chat-file-input")?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
              >
                <Plus className="h-5 w-5" />
              </button>
              <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
                <textarea
                  value={draft}
                  onChange={(event) => onDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      onSend();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="max-h-24 min-h-9 w-full resize-none bg-transparent py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <div className="relative shrink-0">
                  {emojiPickerOpen && (
                    <div className="absolute right-0 bottom-10 z-20">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.LIGHT}
                        width={300}
                        height={360}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label="Open emoji picker"
                    onClick={() => setEmojiPickerOpen((open) => !open)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                aria-label="Send media"
                onClick={onSend}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700"
              >
                <Send className="ml-0.5 h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
            <div className="flex items-end gap-2">
            <input
              id="chat-file-input"
              type="file"
              className="hidden"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            <button
              aria-label="Attach file"
              type="button"
              onClick={() => document.getElementById("chat-file-input")?.click()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  onSend();
                }
              }}
              rows={1}
              className="max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm leading-5 text-slate-700 outline-none placeholder:text-slate-400"
            />
            <div className="relative shrink-0">
              {emojiPickerOpen && (
                <div className="absolute right-0 bottom-10 z-20">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.LIGHT}
                    width={300}
                    height={360}
                  />
                </div>
              )}
              <button
                type="button"
                aria-label="Open emoji picker"
                onClick={() => setEmojiPickerOpen((open) => !open)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>
            <button
              aria-label="Voice message"
              type="button"
              onClick={toggleVoiceRecording}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                isRecording
                  ? "animate-pulse bg-rose-100 text-rose-600"
                  : "text-slate-400 hover:bg-slate-100 hover:text-indigo-600",
              )}
            >
              {isRecording ? (
                <span className="text-[10px] font-semibold">{recordingSeconds}s</span>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              aria-label="Send message"
              onClick={onSend}
              disabled={!draft.trim()}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition",
                draft.trim()
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "cursor-not-allowed bg-indigo-300",
              )}
            >
              <Send className="ml-0.5 h-4 w-4" />
            </button>
            </div>
            <div className="flex items-center justify-between px-1 pt-1">
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
