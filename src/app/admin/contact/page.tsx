import { revalidatePath } from "next/cache";
import { requireAnyAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

async function markRead(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
  revalidatePath("/admin/contact");
}

export default async function AdminContactPage() {
  await requireAnyAdminRole();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("[admin/contact]", error.message);

  const messages = (data ?? []) as ContactMessage[];
  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Contact Inbox</h1>
        <p className="text-sm text-zinc-500">
          {unread > 0 ? `${unread} unread message${unread === 1 ? "" : "s"}` : "All caught up."}
        </p>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-zinc-200 overflow-hidden">
        {messages.length === 0 ? (
          <p className="p-8 text-center text-zinc-400">No messages yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 w-4" />
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {messages.map((msg) => (
                <tr key={msg.id} className={msg.is_read ? "bg-white" : "bg-yellow-50"}>
                  <td className="px-4 py-3">
                    {!msg.is_read && (
                      <span className="block h-2 w-2 rounded-full bg-yellow-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className={`font-semibold text-zinc-900 ${!msg.is_read ? "font-black" : ""}`}>
                      {msg.name}
                    </p>
                    <p className="text-xs text-zinc-400">{msg.email}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{msg.subject}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-zinc-500">{msg.message}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                    {new Date(msg.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {!msg.is_read && (
                      <form action={markRead}>
                        <input type="hidden" name="id" value={msg.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-200 whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Message detail — expand inline by clicking (future: modal or detail page) */}
      {messages.some((m) => m.message.length > 80) && (
        <p className="text-xs text-zinc-400 text-center">
          Truncated messages — full text visible in database or a future detail view.
        </p>
      )}
    </div>
  );
}
