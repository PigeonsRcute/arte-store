"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { AdminRole } from "@/lib/types";
import { ADMIN_ROLES } from "@/lib/permissions";

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  last_sign_in_at: string | null;
}

interface Props {
  members: Member[];
  currentUserId: string;
}

const INVITABLE_ROLES = ADMIN_ROLES.filter((r) => r !== "owner") as AdminRole[];

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ROLE_COLORS: Record<AdminRole, string> = {
  owner:       "bg-red-100 text-red-700",
  editor:      "bg-violet-100 text-violet-700",
  support:     "bg-green-100 text-green-700",
  viewer:      "bg-zinc-100 text-zinc-600",
  nails_admin: "bg-purple-100 text-purple-700",
};

export default function TeamClient({ members: initial, currentUserId }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initial);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("viewer");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [inviteError, setInviteError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [pwFormUserId, setPwFormUserId] = useState<string | null>(null);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [pwError, setPwError] = useState("");

  function openPwForm(userId: string) {
    setPwFormUserId(userId);
    setPwNew("");
    setPwConfirm("");
    setPwStatus("idle");
    setPwError("");
  }

  function closePwForm() {
    setPwFormUserId(null);
    setPwNew("");
    setPwConfirm("");
    setPwStatus("idle");
    setPwError("");
  }

  async function handleChangePassword(e: React.FormEvent, userId: string) {
    e.preventDefault();
    if (pwNew.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwStatus("loading");
    setPwError("");
    const res = await fetch(`/api/admin/users/${userId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwNew }),
    });
    if (res.ok) {
      setPwStatus("ok");
      setTimeout(closePwForm, 1500);
    } else {
      const data = await res.json();
      setPwStatus("error");
      setPwError(data.error ?? "Failed to update password.");
    }
  }

  function resetInviteForm() {
    setInviteName("");
    setInviteEmail("");
    setInviteRole("viewer");
    setInviteMessage("");
    setInviteStatus("idle");
    setInviteError("");
    setShowInviteForm(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteStatus("loading");
    setInviteError("");
    const res = await fetch("/api/admin/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        message: inviteMessage.trim() || undefined,
      }),
    });
    if (res.ok) {
      setInviteStatus("ok");
      router.refresh();
      setTimeout(resetInviteForm, 2000);
    } else {
      const data = await res.json();
      setInviteStatus("error");
      setInviteError(data.error ?? "Invite failed");
    }
  }

  async function handleRoleChange(userId: string, newRole: AdminRole) {
    setPendingId(userId);
    const res = await fetch(`/api/admin/team/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
      );
    }
    setPendingId(null);
  }

  async function handleRevoke(userId: string) {
    if (!confirm("Remove this user's admin access?")) return;
    setPendingId(userId);
    const res = await fetch(`/api/admin/team/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    }
    setPendingId(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Team</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage admin users and their roles.</p>
      </div>

      {/* Members table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Last active</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {members.map((m) => {
              const isSelf = m.id === currentUserId;
              const busy = pendingId === m.id;
              const isPending = m.last_sign_in_at === null;
              const pwOpen = pwFormUserId === m.id;
              return (
                <React.Fragment key={m.id}>
                  <tr className="group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-900">{m.full_name ?? "—"}</p>
                        {isPending && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{m.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {isSelf ? (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[m.role]}`}>
                          {m.role}
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          disabled={busy}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as AdminRole)}
                          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                        >
                          {ADMIN_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">{formatDate(m.last_sign_in_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => pwOpen ? closePwForm() : openPwForm(m.id)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold transition ${pwOpen ? "bg-zinc-100 text-zinc-700" : "text-zinc-600 hover:bg-zinc-100"}`}
                        >
                          {pwOpen ? "Cancel" : "Change Password"}
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => handleRevoke(m.id)}
                            disabled={busy}
                            className="rounded-md px-3 py-1 text-xs font-semibold text-red-600 opacity-0 transition hover:bg-red-50 group-hover:opacity-100 disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {pwOpen && (
                    <tr>
                      <td colSpan={4} className="bg-zinc-50 px-5 py-4">
                        <form
                          onSubmit={(e) => handleChangePassword(e, m.id)}
                          className="flex items-end gap-3"
                        >
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-zinc-500">
                              New password
                            </label>
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={pwNew}
                              onChange={(e) => { setPwNew(e.target.value); setPwError(""); }}
                              placeholder="Min. 8 characters"
                              className="w-48 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-zinc-500">
                              Confirm password
                            </label>
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={pwConfirm}
                              onChange={(e) => { setPwConfirm(e.target.value); setPwError(""); }}
                              placeholder="Repeat password"
                              className="w-48 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={pwStatus === "loading" || pwStatus === "ok"}
                            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60"
                          >
                            {pwStatus === "loading" && <Loader2 size={13} className="animate-spin" />}
                            {pwStatus === "ok" ? "Updated!" : "Update"}
                          </button>
                          {pwError && (
                            <p className="text-xs font-semibold text-red-600">{pwError}</p>
                          )}
                          {pwStatus === "ok" && (
                            <p className="text-xs font-semibold text-green-600">Password updated.</p>
                          )}
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite section */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Invite new admin</h2>
          {!showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Invite Admin
            </button>
          )}
        </div>

        {showInviteForm && (
          <form onSubmit={handleInvite} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                Message <span className="text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal note to include in the invite email…"
                rows={3}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {inviteStatus === "ok" && (
              <p className="text-xs text-green-600">Invite sent successfully.</p>
            )}
            {inviteStatus === "error" && (
              <p className="text-xs text-red-600">{inviteError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={inviteStatus === "loading" || inviteStatus === "ok"}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {inviteStatus === "loading" ? "Sending…" : "Send invite"}
              </button>
              <button
                type="button"
                onClick={resetInviteForm}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
