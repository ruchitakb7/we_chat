import {ArrowLeft,FileText,MoreVertical,Paperclip,Plus,Search,Send,Smile,Users,Video,Mic,X,} from "lucide-react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import socket from "../../lib/socket";
import { cn } from "@/lib/utils";
import type { ChatItem, Message } from "./types";
import {ChatAvatar,formatLastSeen,formatMessageDay,getMessageDayKey,MessageBubble,} from "./chatthreadfunction";

export function ChatThread({selectedChat,messages,draft,selectedFile,onDraftChange,onSend,onFileChange,onBack,onOpenDetails,
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
  onOpenDetails?: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [isOnline, setIsOnline] = useState(false);
  const [last_seen, setlast_seen] = useState<string | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const peerTypingTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = () => {
    if (!isTypingRef.current) return;

    isTypingRef.current = false;
    console.log("User stopped typing", { chatId: selectedChat.id });
    socket.emit("stop-typing", { chatId: selectedChat.id });
  };

  const handleTyping = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onDraftChange(event.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      console.log("User started typing", { chatId: selectedChat.id });
      socket.emit("typing", { chatId: selectedChat.id });
    }

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = window.setTimeout(() => {
      stopTyping();
      typingTimerRef.current = null;
    }, 1500);
  };

  useEffect(() => {
    const chatId = String(selectedChat.id);
    const getTypingChatId = (payload: unknown) => {
      if (typeof payload === "string" || typeof payload === "number") {
        return String(payload);
      }

      if (payload && typeof payload === "object") {
        const data = payload as { chatId?: string | number; chat_id?: string | number };
        return String(data.chatId ?? data.chat_id ?? "");
      }

      return "";
    };

    const handleUserTyping = (payload: unknown) => {
      console.log("Received user:typing event", payload);
      if (getTypingChatId(payload) === chatId) {
        console.log("Other user is typing", payload);
        setIsPeerTyping(true);

        if (peerTypingTimerRef.current) {
          window.clearTimeout(peerTypingTimerRef.current);
        }

        peerTypingTimerRef.current = window.setTimeout(() => {
          setIsPeerTyping(false);
          peerTypingTimerRef.current = null;
        }, 2000);
      }
    };

    const handleUserStopTyping = (payload: unknown) => {
      console.log("Received user:stop-typing event", payload);
      if (getTypingChatId(payload) === chatId) {
        console.log("Other user stopped typing", payload);
        setIsPeerTyping(false);
        if (peerTypingTimerRef.current) {
          window.clearTimeout(peerTypingTimerRef.current);
          peerTypingTimerRef.current = null;
        }
      }
    };

    const handleAnySocketEvent = (eventName: string, ...args: unknown[]) => {
      if (eventName.toLowerCase().includes("typ")) {
        console.log("Received typing-related socket event", eventName, args);
      }
    };

    socket.on("typing", handleUserTyping);
    socket.on("stop-typing", handleUserStopTyping);
    socket.onAny(handleAnySocketEvent);

    return () => {
      socket.off("typing", handleUserTyping);
      socket.off("stop-typing", handleUserStopTyping);
      socket.offAny(handleAnySocketEvent);
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (peerTypingTimerRef.current) {
        window.clearTimeout(peerTypingTimerRef.current);
        peerTypingTimerRef.current = null;
      }
      stopTyping();
      setIsPeerTyping(false);
    };
  }, [selectedChat.id]);

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
      last_seen?: Date | null;
    }) => {
      if (userId === targetUserId) {
        // console.log(
        //   `User ${userId} is ${isOnline ? "online" : "offline"}`,
        //   isOnline ? "" : `Last seen: ${last_seen ?? "unavailable"}`,
        // );
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

      socket.emit("chat:opened", {
        chatId,
      });


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
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleMessages = normalizedSearchQuery
    ? messages.filter((message) =>
      `${message.text} ${message.caption ?? ""}`.toLocaleLowerCase().includes(normalizedSearchQuery),
    )
    : messages;

  const handleBackClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onBack?.();
  };


  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <div
          onClick={onOpenDetails}
          className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
          aria-label="Open chat details"
        >
          <button
            type="button"
            onClick={handleBackClick}
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
                {isPeerTyping ? "Typing..." : isOnline ? "Online" : formatLastSeen(last_seen)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {searchOpen && (
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search messages"
                aria-label="Search messages"
                className="w-32 bg-transparent py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear message search"
                  onClick={() => setSearchQuery("")}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {[
            { icon: Search, label: "Search in chat" },
            // { icon: Phone, label: "Voice call" },
            { icon: Video, label: "Video call" },
            { icon: MoreVertical, label: "More options" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              onClick={label === "Search in chat"
                ? () => setSearchOpen((open) => !open)
                : label === "More options"
                  ? onOpenDetails
                  : undefined}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
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
        ) : visibleMessages.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center px-6 text-center text-sm text-slate-500">
            No messages match “{searchQuery}”.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleMessages.map((message, index) => {
              const dayKey = getMessageDayKey(message);
              const previousDayKey = index > 0 ? getMessageDayKey(visibleMessages[index - 1]) : null;
              const showDay = dayKey && dayKey !== previousDayKey;

              return (
                <div key={message.id}>
                  {showDay && (
                    <div className="mx-auto mb-4 w-fit rounded-full border border-slate-200 px-4 py-1 text-[11px] font-medium text-slate-500">
                      {formatMessageDay(dayKey)}
                    </div>
                  )}
                  <MessageBubble message={message} chat={selectedChat} searchQuery={searchQuery} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 px-5 pb-5">
        {isPeerTyping && (
          <p className="mb-2 px-1 text-sm font-medium text-indigo-600" aria-live="polite">
            Typing...
          </p>
        )}
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
                  onChange={handleTyping}
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
                onChange={handleTyping}
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
