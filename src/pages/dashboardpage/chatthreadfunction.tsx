import { CheckCheck, Users ,Check} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { ChatItem, Message } from "./types";

export function ChatAvatar({
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
			{chat.group && chat.profileimg ? (
				<div className={cn("overflow-hidden rounded-full", dim)}>
					<img src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" loading="lazy" />
				</div>
			) : chat.group ? (
				<div className={cn("flex items-center justify-center rounded-full text-white", dim, chat.groupColor)}>
					<Users className="h-5 w-5" />
				</div>
			) : (
				<div className={cn("overflow-hidden rounded-full", dim)}>
					<img src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" loading="lazy" />
				</div>
			)}
			{(online ?? chat.online) && (
				<span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
			)}
		</div>
	);
}

export function HighlightedText({ text, query }: { text: string; query: string }) {
	if (!query.trim()) return <>{text}</>;

	const normalizedText = text.toLocaleLowerCase();
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const parts: ReactNode[] = [];
	let start = 0;
	let matchIndex = normalizedText.indexOf(normalizedQuery, start);

	while (matchIndex !== -1) {
		if (matchIndex > start) {
			parts.push(<span key={`text-${start}`}>{text.slice(start, matchIndex)}</span>);
		}
		parts.push(
			<mark key={`match-${matchIndex}`} className="rounded bg-yellow-200 px-0.5 text-inherit">
				{text.slice(matchIndex, matchIndex + normalizedQuery.length)}
			</mark>,
		);
		start = matchIndex + normalizedQuery.length;
		matchIndex = normalizedText.indexOf(normalizedQuery, start);
	}

	if (start < text.length) {
		parts.push(<span key={`text-${start}`}>{text.slice(start)}</span>);
	}

	return <>{parts}</>;
}

export function MessageBubble({
	message,
	chat,
	searchQuery,
}: {
	message: Message;
	chat: ChatItem;
	searchQuery: string;
}) {

	if (message.type === "system") {
		return (
			<div className="flex justify-center my-3">
				<div className="rounded-full bg-slate-100 px-4 py-1.5 text-xs text-slate-500">
					{message.text}
				</div>
			</div>
		);
	}
	const mine = message.sender === "me";

	return (
		<div className={cn("flex items-end gap-2.5", mine ? "justify-end" : "justify-start")}>
			{!mine && (
				<div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
					{chat.group ? (
						message.senderProfileImage ? (
							<img src={message.senderProfileImage} alt="" className="h-full w-full object-cover" loading="lazy" />
						) : (
							<div className={cn("flex h-full w-full items-center justify-center text-sm font-semibold text-white", chat.groupColor)}>
								{(message.senderUsername || message.senderName || "?").charAt(0).toUpperCase()}
							</div>
						)
					) : (
						<img src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" loading="lazy" />
					)}
				</div>
			)}

			<div
				title={chat.group ? message.senderUsername : undefined}
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
				{message.mediaUrl && message.type === "video" && <video src={message.mediaUrl} controls className="max-h-64 rounded-lg" />}
				{message.mediaUrl && message.type === "audio" && <audio src={message.mediaUrl} controls className="max-w-full" />}
				{message.caption ? (
					<p className="mt-2 text-sm leading-relaxed"><HighlightedText text={message.caption} query={searchQuery} /></p>
				) : !message.mediaUrl ? (
					message.text.split("\n").map((line, i) => (
						<p key={i} className="text-sm leading-relaxed"><HighlightedText text={line} query={searchQuery} /></p>
					))
				) : null}
				{message.mediaUrl && message.type === "file" && (
					<a href={message.mediaUrl} target="_blank" rel="noreferrer" className="text-sm underline">
						<HighlightedText text={message.text} query={searchQuery} />
					</a>
				)}
				<div
					className={cn(
						"mt-1.5 flex items-center gap-1 text-[10px]",
						mine
							? "justify-end text-indigo-200"
							: "text-slate-400"
					)}
				>
					<span>{message.time}</span>

					{mine && message.status === "sent" && (
						<Check className="h-3.5 w-3.5" />
					)}

					{mine &&
						(message.status === "delivered" ||
							message.status === "read") && (
							<CheckCheck
								className={cn(
									"h-3.5 w-3.5",
									message.status === "read"
										? "text-blue-500"
										: "text-slate-400"
								)}
							/>
						)}
				</div>
			</div>
		</div>
	);
}

export function getMessageDayKey(message: Message) {
	if (!message.createdAt) return null;
	const date = new Date(message.createdAt);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Kolkata",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export function formatMessageDay(dayKey: string) {
	const todayKey = getMessageDayKey({ createdAt: new Date().toISOString() } as Message);
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayKey = getMessageDayKey({ createdAt: yesterday.toISOString() } as Message);

	if (dayKey === todayKey) return "Today";
	if (dayKey === yesterdayKey) return "Yesterday";

	const [year, month, day] = dayKey.split("-").map(Number);
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "Asia/Kolkata",
	}).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatLastSeen(last_seen: string | Date | null | undefined) {
	if (!last_seen) return "Last seen unavailable";

	const elapsedMinutes = Math.floor((Date.now() - new Date(last_seen).getTime()) / 60000);
	if (Number.isNaN(elapsedMinutes)) return "Last seen unavailable";
	if (elapsedMinutes < 1) return "Last seen just now";
	if (elapsedMinutes < 60) return `Last seen ${elapsedMinutes} min ago`;

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) return `Last seen ${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;

	const elapsedDays = Math.floor(elapsedHours / 24);
	return `Last seen ${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} ago`;
}
