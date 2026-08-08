import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/admin-auth";
export const metadata = {
  title: "Admin Login | Knowledge Nest",
  robots: {
    index: false,
    follow: false,
  },
};
export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl font-bold text-white">
            KN
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to manage Knowledge Nest.</p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
