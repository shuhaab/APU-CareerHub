import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { getSessionUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(`/${user.role}`);
  return <AuthLayout><AuthForm mode="login" /></AuthLayout>;
}
