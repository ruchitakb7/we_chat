import {
    ArrowLeft,
    Bell,
    Lock,
    LogOut,
    Palette,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AccountSettings from "./AccountPage"
import {handleLogout} from "@/service/authservice";

import type { User } from "./types";

const settingsSections = [
    { label: "Account", description: "Personal details", icon: UserRound },
    { label: "Privacy", description: "Security and access", icon: Lock },
    { label: "Appearance", description: "Theme and layout", icon: Palette },
    { label: "Notifications", description: "Alerts and sounds", icon: Bell },
];

function SettingsPage() {
    const navigate = useNavigate();
    const { user: currentUser, loading, logout } = useAuth();
    const [activeSection, setActiveSection] = useState("Account");

    const onLogout = async () => {
        await handleLogout();
        logout();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
                Loading settings...
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
        <div className="min-h-dvh overflow-y-auto bg-slate-100 text-slate-800 lg:h-screen lg:overflow-hidden">
            <div className="mx-auto min-h-dvh max-w-[1440px] p-4 lg:h-full">
                <div className="flex min-h-dvh flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-full lg:overflow-hidden">
                    <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                            aria-label="Back to dashboard"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>

                        <div className="text-center">
                            {/* <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                                Workspace
                            </p> */}
                         <p className="text-xl font-bold tracking-tight text-indigo-600">WeTalk </p>
                            {/* <h1 className="text-xl font-bold tracking-tight text-slate-900">Settings</h1> */}
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </header>

                    <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
                        <aside className="w-full border-b border-slate-200 bg-slate-50 p-4 lg:w-[300px] lg:border-r lg:border-b-0">
                            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="relative">
                                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                                        {safeUser.profileimg ? (
                                            <img
                                                src={safeUser.profileimg}
                                                alt={safeUser.username || "User"}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span>{safeUser.username?.charAt(0).toUpperCase() || "U"}</span>
                                        )}
                                    </div>
                                    <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                        {safeUser.username || "User"}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">{safeUser.email}</p>
                                </div>
                            </div>

                            <nav className="space-y-2">
                                {settingsSections.map(({ label, description, icon: Icon }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => setActiveSection(label)}
                                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${activeSection === label
                                            ? "border-indigo-200 bg-indigo-50"
                                            : "border-transparent bg-white hover:border-slate-200 hover:bg-white"
                                            }`}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800">{label}</p>
                                            <p className="text-xs text-slate-500">{description}</p>
                                        </div>
                                    </button>
                                ))}
                            </nav>

                            <button
                                type="button"
                                onClick={onLogout}
                                className="mt-3 flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-left text-red-600 transition hover:bg-red-100"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">Log out</p>
                                    <p className="text-xs text-red-500">End this session</p>
                                </div>
                            </button>
                        </aside>

                        <main className="min-w-0 bg-white lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                            {activeSection === "Account" && (
                                <AccountSettings
                                    fullName={safeUser.fullName}
                                    username={safeUser.username||"User"}
                                    email={safeUser.email}
                                    profileimg={safeUser.profileimg}
                                />
                            )}

                            {activeSection !== "Account" && (
                                <div className="flex min-h-full items-center justify-center p-6">
                                    <div className="text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                            <ShieldCheck className="h-7 w-7 text-slate-400" />
                                        </div>

                                        <h2 className="text-xl font-bold text-slate-900">
                                            Coming soon
                                        </h2>

                                        <p className="mt-2 text-sm text-slate-500">
                                            {activeSection} settings will be available soon.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
