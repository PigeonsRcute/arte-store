import { requireAnyAdminRole } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireAnyAdminRole();

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <AdminSidebar role={role} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
