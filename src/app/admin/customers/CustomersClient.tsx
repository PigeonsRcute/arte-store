"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}

interface Props {
  customers: Customer[];
  countMap: Record<string, number>;
  isOwner: boolean;
}

export default function CustomersClient({ customers, countMap, isOwner }: Props) {
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

  return (
    <section className="space-y-4 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-yellow-300">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black tracking-tight text-yellow-700">Customers</h1>
        <span className="text-sm text-zinc-400">{customers.length} registered</span>
      </div>

      {customers.length === 0 ? (
        <p className="text-sm text-zinc-400">No customers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-100 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">City</th>
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 pr-4">Orders</th>
                {isOwner && <th className="pb-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.map((customer) => {
                const pwOpen = pwFormUserId === customer.id;
                return (
                  <React.Fragment key={customer.id}>
                    <tr className="group hover:bg-zinc-50">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="font-semibold text-zinc-800 transition-colors group-hover:text-pink-600"
                        >
                          {customer.full_name ?? <span className="font-normal text-zinc-400">No name</span>}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-zinc-500">
                        {customer.email ?? <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-zinc-500">
                        {customer.city ?? <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-zinc-500">
                        {customer.country ?? <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">
                          {countMap[customer.id] ?? 0}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="py-3 text-right">
                          <button
                            onClick={() => pwOpen ? closePwForm() : openPwForm(customer.id)}
                            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${pwOpen ? "bg-zinc-100 text-zinc-700" : "text-zinc-600 hover:bg-zinc-100"}`}
                          >
                            {pwOpen ? "Cancel" : "Change Password"}
                          </button>
                        </td>
                      )}
                    </tr>
                    {pwOpen && (
                      <tr>
                        <td colSpan={isOwner ? 7 : 6} className="bg-zinc-50 px-4 py-4">
                          <form
                            onSubmit={(e) => handleChangePassword(e, customer.id)}
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
      )}
    </section>
  );
}
