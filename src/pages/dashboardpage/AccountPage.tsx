
import { Check, Pencil, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import {checkUsernameAvailability,updateUserProfile,} from "../../service/authservice";

interface AccountSettingsProps {
  fullName?: string | null;
  username: string;
  email: string;
  profileimg: string | null;
}

type EditingField = "username" | "password" | "profile" | null;

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "error";

function AccountSettings({
  fullName,
  username,
  email,
  profileimg,
}: AccountSettingsProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);

  const [currentFullName, setCurrentFullName] =
    useState(fullName || "");

  const [newFullName, setNewFullName] =
    useState(fullName || "");

  const [currentUsername, setCurrentUsername] =
    useState(username || "");

  const [newUsername, setNewUsername] =
    useState(username || "");

  const [usernameStatus, setUsernameStatus] =
    useState<UsernameStatus>("idle");

  const [usernameMessage, setUsernameMessage] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [updateError, setUpdateError] =
    useState("");

  const [updating, setUpdating] =
    useState(false);

  
  useEffect(() => {
    setCurrentFullName(fullName || "");
    setNewFullName(fullName || "");
    setCurrentUsername(username || "");
    setNewUsername(username || "");
  }, [fullName, username]);

   const isEditing = editingField !== null;

 
  useEffect(() => {
    if (editingField !== "username") {
      return;
    }

    const trimmedUsername = newUsername.trim();

   
    if (
      trimmedUsername.toLowerCase() ===
      currentUsername.trim().toLowerCase()
    ) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

   
    if (!trimmedUsername) {
      setUsernameStatus("error");
      setUsernameMessage("Username cannot be empty.");
      return;
    }

   
    if (trimmedUsername.length < 3) {
      setUsernameStatus("error");
      setUsernameMessage(
        "Username must contain at least 3 characters."
      );
      return;
    }

   
    const timer = setTimeout(async () => {
      try {
        setUsernameStatus("checking");
        setUsernameMessage("Checking username...");

        const result =
          await checkUsernameAvailability(
            trimmedUsername
          );

        if (result.available) {
          setUsernameStatus("available");
          setUsernameMessage("Username available");
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(
            result.message ||
              "Username already taken"
          );
        }
      } catch (error) {
        console.error(
          "Username availability check failed:",
          error
        );

        setUsernameStatus("error");
        setUsernameMessage(
          "Unable to check username."
        );
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    newUsername,
    editingField,
    currentUsername,
  ]);

  const startEditing = (
    field: EditingField
  ) => {
    setUpdateError("");

    if (field === "username") {
      setNewUsername(currentUsername);
      setUsernameStatus("idle");
      setUsernameMessage("");
    }

    if (field === "password") {
      setNewPassword("");
      setConfirmPassword("");
    }

    setEditingField(field);
  };

  const cancelEditing = () => {
    setEditingField(null);

    setNewFullName(currentFullName);
    setNewUsername(currentUsername);

    setNewPassword("");
    setConfirmPassword("");

    setUsernameStatus("idle");
    setUsernameMessage("");

    setUpdateError("");
  };

  const handleUpdate = async () => {
    if (!editingField) {
      return;
    }

    setUpdateError("");

    if (editingField === "fullName") {
      const trimmedFullName = newFullName.trim();

      if (!trimmedFullName || !/\p{L}/u.test(trimmedFullName)) {
        setUpdateError("Full name must contain at least one letter.");
        return;
      }

      try {
        setUpdating(true);

        const result = await updateUserProfile({
          fullName: trimmedFullName,
        });

        const updatedFullName = result.user?.fullName || trimmedFullName;
        setCurrentFullName(updatedFullName);
        setNewFullName(updatedFullName);
        setEditingField(null);
      } catch (error) {
        console.error("Full name update failed:", error);
        setUpdateError("Unable to update full name. Please try again.");
      } finally {
        setUpdating(false);
      }

      return;
    }

   
    if (editingField === "username") {
      const trimmedUsername =
        newUsername.trim().toLowerCase();

      if (!trimmedUsername) {
        setUpdateError(
          "Username cannot be empty."
        );
        return;
      }

      if (usernameStatus !== "available") {
        setUpdateError(
          "Please enter an available username."
        );
        return;
      }

      try {
        setUpdating(true);

        const result =
          await updateUserProfile({
            username: trimmedUsername,
          });

      
        const updatedUsername =
          result.user?.username ||
          trimmedUsername;

        setCurrentUsername(updatedUsername);
        setNewUsername(updatedUsername);

        setEditingField(null);
        setUsernameStatus("idle");
        setUsernameMessage("");
      } catch (error: any) {
        console.error(
          "Username update failed:",
          error
        );

        if (
          error?.response?.status === 409
        ) {
          setUsernameStatus("taken");
          setUsernameMessage(
            "Username already taken"
          );
        } else {
          setUpdateError(
            "Unable to update username. Please try again."
          );
        }
      } finally {
        setUpdating(false);
      }

      return;
    }

    if (editingField === "password") {
      if (!newPassword) {
        setUpdateError(
          "Please enter a new password."
        );
        return;
      }

      if (newPassword.length < 8) {
        setUpdateError(
          "Password must contain at least 8 characters."
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        setUpdateError(
          "Passwords do not match."
        );
        return;
      }

      try {
        setUpdating(true);

        await updateUserProfile({
          password: newPassword,
        });

        setNewPassword("");
        setConfirmPassword("");
        setEditingField(null);
      } catch (error) {
        console.error(
          "Password update failed:",
          error
        );

        setUpdateError(
          "Unable to update password. Please try again."
        );
      } finally {
        setUpdating(false);
      }

      return;
    }

    /*
     * PROFILE PICTURE
     *
     * The image upload itself will be implemented
     * separately. Once we have the uploaded image URL,
     * we can call:
     *
     * await updateUserProfile({
     *   profileimg: imageUrl,
     * });
     */
  };

  const isUpdateDisabled =
    updating ||
    (editingField === "fullName" &&
      (!newFullName.trim() || !/\p{L}/u.test(newFullName.trim()))) ||
    (editingField === "username" &&
      usernameStatus !== "available") ||
    (editingField === "password" &&
      (!newPassword ||
        !confirmPassword ||
        newPassword !== confirmPassword));

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-white">

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 p-6 sm:p-8">

          {/* PROFILE */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-slate-900">
                Profile picture
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Choose a profile picture for your WeTalk account.
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-indigo-600">
                  {profileimg ? (
                    <img
                      src={profileimg}
                      alt={currentUsername || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-10 w-10" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    startEditing("profile")
                  }
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700"
                  aria-label="Edit profile picture"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-800">
                  {currentUsername || "User"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {email}
                </p>
              </div>
            </div>
          </section>

          {/* FULL NAME */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Full name
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                This is the name shown on your WeTalk profile.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs text-slate-400">Full name</p>
                  {editingField === "fullName" ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={newFullName}
                        onChange={(event) => setNewFullName(event.target.value)}
                        placeholder="Enter your full name"
                        className="w-full border-b border-indigo-500 bg-transparent py-1 text-sm font-medium text-slate-900 outline-none"
                      />
                      {updateError && (
                        <p className="mt-2 text-xs text-red-500">{updateError}</p>
                      )}
                    </>
                  ) : (
                    <p className="break-all text-sm font-medium text-slate-800">
                      {currentFullName || "Add full name"}
                    </p>
                  )}
                </div>

                {editingField !== "fullName" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewFullName(currentFullName);
                      startEditing("fullName");
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Edit full name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                    aria-label="Cancel editing full name"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* USERNAME */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Username
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your unique username is how other WeTalk users can find you.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start gap-3 px-4 py-3">

                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs text-slate-400">
                    Username
                  </p>

                  {editingField === "username" ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={newUsername}
                        onChange={(e) =>
                          setNewUsername(
                            e.target.value
                          )
                        }
                        placeholder="Enter username"
                        className="w-full border-b border-indigo-500 bg-transparent py-1 text-sm font-medium text-slate-900 outline-none"
                      />

                      {usernameMessage && (
                        <p
                          className={`mt-2 text-xs font-medium ${
                            usernameStatus ===
                            "available"
                              ? "text-emerald-600"
                              : usernameStatus ===
                                    "taken" ||
                                  usernameStatus ===
                                    "error"
                                ? "text-red-500"
                                : "text-slate-500"
                          }`}
                        >
                          {usernameStatus ===
                            "available" && "✓ "}

                          {usernameStatus ===
                            "taken" && "✕ "}

                          {usernameMessage}
                        </p>
                      )}

                      {updateError && (
                        <p className="mt-2 text-xs text-red-500">
                          {updateError}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="break-all text-sm font-medium text-slate-800">
                      {currentUsername
                        ? `@${currentUsername}`
                        : "Add username"}
                    </p>
                  )}
                </div>

                {editingField !== "username" ? (
                  <button
                    type="button"
                    onClick={() =>
                      startEditing("username")
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Edit username"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                    aria-label="Cancel editing username"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* PASSWORD */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Password
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Keep your WeTalk account secure with a strong password.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              {editingField !== "password" ? (
                <div className="flex items-center gap-3 px-4 py-4">

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      Password
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      ••••••••••••
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      startEditing("password")
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Edit password"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-4">

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600">
                      New password
                    </label>

                    <input
                      autoFocus
                      type="password"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600">
                      Confirm password
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Confirm new password"
                    />

                    {confirmPassword &&
                      newPassword !==
                        confirmPassword && (
                        <p className="mt-2 text-xs text-red-500">
                          Passwords do not match.
                        </p>
                      )}

                    {updateError &&
                      editingField ===
                        "password" && (
                        <p className="mt-2 text-xs text-red-500">
                          {updateError}
                        </p>
                      )}
                  </div>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800"
                  >
                    Cancel password change
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* UPDATE BAR */}
      {isEditing && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
          <div className="mx-auto flex max-w-2xl justify-end gap-3">

            <button
              type="button"
              onClick={cancelEditing}
              disabled={updating}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdateDisabled}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Check className="h-4 w-4" />
              {updating ? "Updating..." : "Update"}
            </button>

          </div>
        </div>
      )}
    </main>
  );
}

export default AccountSettings;

