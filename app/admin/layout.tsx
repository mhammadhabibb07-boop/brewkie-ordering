import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
