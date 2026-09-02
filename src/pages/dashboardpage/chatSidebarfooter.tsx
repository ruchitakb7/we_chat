import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { User } from "./types";

export function ChatSidebarFooter({ user }: { user: User }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-4">
      <div className="relative">
        <div className="h-10 w-10 overflow-hidden rounded-full">
          {user.profileimg ? (
            <img
              src={user.profileimg}
              alt={user.username || "User"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-sm font-semibold text-indigo-600">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
        <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {user.username || "User"}
        </p>
      </div>

      <button
        type="button"
        aria-label="Settings"
        onClick={() => navigate("/settings")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
