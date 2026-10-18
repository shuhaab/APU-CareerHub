import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { getSessionUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect(`/${user.role}`);
  return <AuthLayout><AuthForm mode="register" /></AuthLayout>;
}
