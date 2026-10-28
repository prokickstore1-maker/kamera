import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Login Admin | vintaagemeew", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) {
    redirect("/admin/orders");
  }

  return (
    <div className="w-full flex items-center justify-center">
      <LoginForm />
    </div>
  );
}