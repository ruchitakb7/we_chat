import { ArrowLeft, Check, Crown, LogOut, Pencil, Search, Trash2, Upload, UserPlus, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getChatDetails , updateGroupDetails} from "@/service/chatService";
import { searchUsers, type SearchUser } from "@/service/authservice";
import { getUploadedFileUrl, uploadFile } from "@/service/uploadfile";
import { addChatMember, leaveGroup, removeChatMember, promoteChatMember } from "@/service/chatmemberService";
import { cn } from "@/lib/utils";
import type { ChatDetails, ChatItem } from "./types";

export function ChatDetailsPanel({
  chat,
  currentUserId,
  onBack,
}: {
  chat: ChatItem;
  currentUserId?: string;
  onBack: () => void;
}) {
  const [details, setDetails] = useState<ChatDetails | null>(null);
  const [error, setError] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<SearchUser[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupProfileFile, setGroupProfileFile] = useState<File | null>(null);
  const [groupProfilePreview, setGroupProfilePreview] = useState<string | null>(null);
  const groupProfileInputRef = useRef<HTMLInputElement>(null);
  const isGroupChat = details?.type === "group";
  const isAdmin = Boolean(
    details &&
    (details.createdBy === currentUserId ||
      details.members?.some((member) => member.id === currentUserId && member.role === "admin")),
  );

  useEffect(() => {
    let active = true;
    setDetails(null);
    setError(false);

    void getChatDetails(Number(chat.id))
      .then((response) => {
        if (active) {
          const nextDetails = (response?.data ?? response?.chat ?? response) as ChatDetails;
          setDetails(nextDetails);
          setGroupName(nextDetails.name ?? "");
        }
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [chat.id]);

  const members = details?.members ?? (details?.member ? [details.member] : []);
  const title = isGroupChat ? details?.name ?? chat.name : details?.member?.username ?? chat.name;

  useEffect(() => {
    if (!showAddMembers || !memberQuery.trim()) {
      setMemberResults([]);
      return;
    }

    let active = true;
    void searchUsers(memberQuery.trim()).then((users) => {
      if (active) setMemberResults(users);
    }).catch(() => {
      if (active) setMemberResults([]);
    });

    return () => {
      active = false;
    };
  }, [memberQuery, showAddMembers]);

  const refreshDetails = async () => {
    const response = await getChatDetails(Number(chat.id));
    const nextDetails = (response?.data ?? response?.chat ?? response) as ChatDetails;
    setDetails(nextDetails);
    setGroupName(nextDetails.name ?? "");
  };

  const handleGroupProfileChange = (file: File | null) => {
    setGroupProfileFile(file);
    setGroupProfilePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleUpdateGroup = async () => {
    if (!isAdmin || !groupName.trim()) return;

    setMemberActionId("group-update");
    try {
      const uploadedFile = groupProfileFile ? await uploadFile(groupProfileFile) : null;
      await updateGroupDetails(Number(chat.id), {
        name: groupName.trim(),
        ...(uploadedFile ? { grpprofile: uploadedFile.path } : {}),
      });
      await refreshDetails();
      setGroupProfileFile(null);
      setGroupProfilePreview(null);
      setIsEditingGroup(false);
    } finally {
      setMemberActionId(null);
    }
  };

  const handleAddMember = async (user: SearchUser) => {
    setMemberActionId(String(user.id));
    try {
      await addChatMember(Number(chat.id), user.id);
      setMemberQuery("");
      await refreshDetails();
    } finally {
      setMemberActionId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setMemberActionId(memberId);
    try {
      await removeChatMember(Number(chat.id), memberId);
      await refreshDetails();
    } finally {
      setMemberActionId(null);
    }
  };

  const handlePromoteMember = async (memberId: string) => {
    setMemberActionId(memberId);
    try {
      await promoteChatMember(Number(chat.id), memberId);
      await refreshDetails();
    } finally {
      setMemberActionId(null);
    }
  };

  const handleLeaveGroup = async () => {
    setMemberActionId("leave");
    try {
      await leaveGroup(Number(chat.id));
      window.location.reload()
    } finally {
      setMemberActionId(null);
    }
  };

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to chat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-slate-800">Chat details</h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {error && <p className="text-sm text-rose-500">Unable to load chat details.</p>}
        {!error && !details && <p className="text-sm text-slate-500">Loading details...</p>}
        {details && (
          <div className="mx-auto max-w-lg">
            <div className="flex flex-col items-center border-b border-slate-200 pb-6 text-center">
              {isGroupChat ? (
                <>
                  <input
                    ref={groupProfileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleGroupProfileChange(event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    disabled={!isEditingGroup}
                    onClick={() => groupProfileInputRef.current?.click()}
                    className={cn(
                      "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-indigo-600",
                      isEditingGroup && "cursor-pointer ring-2 ring-indigo-300",
                    )}
                    aria-label="Change group profile picture"
                  >
                    {groupProfilePreview || details.grpprofile ? (
                      <img
                        src={groupProfilePreview ?? getUploadedFileUrl(details.grpprofile!)}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Users className="h-9 w-9" />
                    )}
                    {isEditingGroup && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                        <Upload className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <img
                  src={details.grpprofile ? getUploadedFileUrl(details.grpprofile) : chat.avatar}
                  alt={title}
                  className="h-20 w-20 rounded-full object-cover"
                />
              )}
              {isEditingGroup ? (
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="mt-3 w-full max-w-xs rounded-lg border border-indigo-300 px-3 py-2 text-center text-lg font-semibold text-slate-900 outline-none"
                  aria-label="Group name"
                />
              ) : (
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
              )}
              {isGroupChat && isAdmin && (
                <div className="mt-3 flex items-center gap-2">
                  {isEditingGroup ? (
                    <>
                      <button
                        type="button"
                        disabled={memberActionId === "group-update" || !groupName.trim()}
                        onClick={() => void handleUpdateGroup()}
                        className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={memberActionId === "group-update"}
                        onClick={() => {
                          setGroupName(details.name ?? "");
                          setGroupProfileFile(null);
                          setGroupProfilePreview(null);
                          setIsEditingGroup(false);
                        }}
                        className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingGroup(true)}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit profile
                    </button>
                  )}
                </div>
              )}
              <p className="mt-1 text-sm text-slate-500">
                {isGroupChat ? `${members.length} members` : "Private chat"}
              </p>
            </div>

            {isGroupChat ? (
              <div className="pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Members</h4>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowAddMembers((open) => !open)}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600"
                    >
                      {showAddMembers ? <X className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {showAddMembers ? "Close" : "Add members"}
                    </button>
                  )}
                </div>
                {showAddMembers && isAdmin && (
                  <div className="mb-4 rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        value={memberQuery}
                        onChange={(event) => setMemberQuery(event.target.value)}
                        placeholder="Search users to add"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                    </div>
                    <div className="mt-2 space-y-1">
                      {memberResults
                        .filter((user) => !members.some((member) => member.id === String(user.id)))
                        .map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                          >
                            <span className="text-sm text-slate-700">{user.fullName || user.username}</span>
                            <span className="ml-auto text-xs text-slate-400">@{user.username}</span>
                            <button
                              type="button"
                              disabled={memberActionId === String(user.id)}
                              onClick={() => void handleAddMember(user)}
                              className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Add member
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
                      {member.profileimg ? (
                        <img src={getUploadedFileUrl(member.profileimg)} alt={member.username} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{member.fullName || member.username}</p>
                        <p className="truncate text-xs text-slate-400">@{member.username}</p>
                      </div>
                      {member.role && (
                        <span className={cn("flex items-center gap-1 text-xs capitalize", member.role === "admin" ? "text-indigo-600" : "text-slate-400")}>
                          {member.role === "admin" && <Crown className="h-3.5 w-3.5" />}
                          {member.role}
                        </span>
                      )}
                      {isAdmin && member.id !== currentUserId && member.role !== "admin" && (
                        <button
                          type="button"
                          aria-label={`Make ${member.username} an admin`}
                          title="Make admin"
                          disabled={memberActionId === member.id}
                          onClick={() => void handlePromoteMember(member.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                      )}
                      {isAdmin && member.id !== currentUserId && (
                        <button
                          type="button"
                          aria-label={`Remove ${member.username}`}
                          disabled={memberActionId === member.id}
                          onClick={() => void handleRemoveMember(member.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={memberActionId === "leave"}
                  onClick={() => void handleLeaveGroup()}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Leave group
                </button>
              </div>
            ) : (
              <div className="pt-6 space-y-6">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">
                    Conversation
                  </h4>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">

                    {/* Mute */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="text-lg">🔕</span>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Mute notifications
                        </p>

                        <p className="text-xs text-slate-400">
                          Turn off notifications for this chat
                        </p>
                      </div>
                    </button>

                    <div className="border-t border-slate-100" />

                  </div>
                </div>

                {/* Danger Zone */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">
                    Actions
                  </h4>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">

                    {/* Block */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-rose-50"
                    >
                      <span className="text-lg">🚫</span>

                      <div>
                        <p className="text-sm font-medium text-rose-600">
                          Block user
                        </p>

                        <p className="text-xs text-slate-400">
                          Prevent this user from contacting you
                        </p>
                      </div>
                    </button>

                    <div className="border-t border-slate-100" />

                    {/* Delete */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />

                      <div>
                        <p className="text-sm font-medium text-rose-600">
                          Delete conversation
                        </p>

                        <p className="text-xs text-slate-400">
                          Remove this conversation from your chats
                        </p>
                      </div>
                    </button>

                  </div>
                </div>

              </div>


            )}
          </div>
        )}
      </div>
    </section>
  );
}
