import { ArrowLeft, Check, MessageCircle, Search, Users, X } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

import { ChatSidebarFooter } from "./chatSidebarfooter";
import type { User } from "./types";
import { searchUsers, type SearchUser } from "@/service/authservice";
import { createGroupChat, createPrivateChat } from "@/service/chatService";
const contacts = [
  {
    id: "amit",
    name: "Amit Sharma",
    status: "Online",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "priya",
    name: "Priya Patel",
    status: "Available to chat",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "rahul",
    name: "Rahul Verma",
    status: "Last seen 2h ago",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "neha",
    name: "Neha Singh",
    status: "Last seen yesterday",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80",
  },
];

function NewChatPage() {
  const navigate = useNavigate();
  const { user: currentUser, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupStep, setGroupStep] = useState<"name" | "members">("name");
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(false);
      return;
    }

    let active = true;
    setSearchLoading(true);
    setSearchError(false);

    searchUsers(trimmedQuery)
      .then((users) => {
        if (active) {
          setSearchResults(users);
        }
      })
      .catch(() => {
        if (active) {
          setSearchResults([]);
          setSearchError(true);
        }
      })
      .finally(() => {
        if (active) {
          setSearchLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Loading new chat...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const safeUser: User = currentUser;
  const isSearching = query.trim().length > 0;
  //const visibleContacts = isSearching ? searchResults : contacts;

  const startGroupCreation = () => {
    setGroupMode(true);
    setGroupStep("name");
    setGroupName("");
    setQuery("");
    setSelectedMembers([]);
    setCreateError(false);
  };

  const continueToMemberSelection = () => {
    if (!groupName.trim()) return;
    setGroupStep("members");
  };

  const toggleMember = (user: SearchUser) => {
    setSelectedMembers((members) =>
      members.some((member) => member.id === user.id)
        ? members.filter((member) => member.id !== user.id)
        : [...members, user],
    );
  };

  const openPrivateChat = async (user: SearchUser) => {
    setSelectedUser(user);
    setCreatingChat(true);
    setCreateError(false);

    try {
      const response = await createPrivateChat(user.id);
      navigate("/dashboard", { state: { privateChat: response.chat } });
    } catch {
      setCreateError(true);
    } finally {
      setCreatingChat(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setCreatingChat(true);
    setCreateError(false);

    try {
      const response = await createGroupChat(
        groupName.trim(),
        selectedMembers.map((member) => member.username),
      );

      navigate("/dashboard", { state: { groupChat: response.chat ?? response } });
    } catch {
      setCreateError(true);
    } finally {
      setCreatingChat(false);
    }
  };

  return (
    <div className="min-h-dvh overflow-y-auto bg-slate-100 text-slate-800 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto min-h-dvh max-w-[1440px] p-4 lg:h-full">
        <div className="flex min-h-dvh flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-full lg:flex-row">
          <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-[360px] lg:border-r lg:border-b-0">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <button
                type="button"
                aria-label="Back to dashboard"
                onClick={() => navigate("/dashboard")}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                {groupMode ? "New group" : "New chat"}
              </h1>
              {groupMode && (
                <button
                  type="button"
                  aria-label="Leave group creation"
                  onClick={() => setGroupMode(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </header>

            {groupMode && groupStep === "name" ? (
              <div className="border-b border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900">Enter group name</p>
                <p className="mt-1 text-xs text-slate-500">Choose a name for your new group.</p>
                <input
                  autoFocus
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") continueToMemberSelection();
                  }}
                  placeholder="Group name"
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={continueToMemberSelection}
                  disabled={!groupName.trim()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-b border-slate-200 p-4">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="sr-only">{groupMode ? "Search group members" : "Search new users"}</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={groupMode ? "Search users to add..." : "Search new users..."}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              </div>
            )}

            {!groupMode && <div className="grid grid-cols-2 gap-2 p-4">
              <button type="button" onClick={startGroupCreation} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
                <Users className="h-4 w-4" />
                New group
              </button>
            </div>
            }

            <div className="min-h-0 flex-1 px-2.5 pb-2 lg:overflow-y-auto">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {groupMode ? "Add members" : "Your contacts"}
              </p>
              {groupMode && selectedMembers.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2 px-2">
                  {selectedMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member)}
                      className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {member.fullName || member.username}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
              {searchLoading && <p className="px-3 py-8 text-center text-sm text-slate-400">Searching users...</p>}
              {!searchLoading && searchError && <p className="px-3 py-8 text-center text-sm text-rose-500">Unable to search users.</p>}
              {!searchLoading && !searchError && isSearching && searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => groupMode ? toggleMember(user) : openPrivateChat(user)}
                  disabled={creatingChat}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${selectedUser?.id === user.id ? "bg-indigo-50" : "hover:bg-slate-50"} disabled:cursor-wait disabled:opacity-60`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {user.fullName?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{user.fullName}</span>
                    <span className="block truncate text-xs text-slate-500">@{user.username}</span>
                  </span>
                  {groupMode && selectedMembers.some((member) => member.id === user.id) && <Check className="h-5 w-5 shrink-0 text-indigo-600" />}
                </button>
              ))}
              {!groupMode && !isSearching && contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                >
                  <img src={contact.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{contact.name}</span>
                    <span className="block truncate text-xs text-slate-500">{contact.status}</span>
                  </span>
                  {contact.status === "Online" && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
              {createError && <p className="px-3 py-4 text-center text-sm text-rose-500">Unable to create chat.</p>}
              {!searchLoading && !searchError && isSearching && searchResults.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-400">No users found.</p>}
              {groupMode && groupStep === "members" && (
                <button
                  type="button"
                  onClick={createGroup}
                  disabled={selectedMembers.length === 0}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingChat ? "Creating group..." : "Create group"}
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>

            <ChatSidebarFooter user={safeUser} />
          </aside>

          <main className="flex min-h-[430px] min-w-0 flex-1 flex-col bg-slate-50 lg:min-h-0">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
              <div>
                {/* <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Current chat</p> */}
                <h2 className="mt-2 text-xl font-bold text-slate-900">Start a conversation</h2>
              </div>
              <MessageCircle className="h-6 w-6 text-indigo-500" />
            </header>
            {/* <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
              <div className="w-full max-w-md text-center">
                <img src={selectedContact.avatar} alt={selectedContact.name} className="mx-auto h-24 w-24 rounded-full object-cover ring-8 ring-white shadow-sm" />
                <h3 className="mt-6 text-2xl font-bold text-slate-900">{selectedContact.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{selectedContact.status}. Send a message to begin your conversation.</p>
                <button type="button" onClick={() => navigate("/dashboard")} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                  <MessageCircle className="h-4 w-4" />
                  Open chat
                </button>
              </div>
            </div> */}
          </main>
        </div>
      </div>
    </div>
  );
}

export default NewChatPage;
