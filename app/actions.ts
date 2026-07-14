"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type AuthMode = "sign-in" | "sign-up";
export type AuthState = {
  status: "idle" | "success" | "error";
  mode?: AuthMode;
  message?: string;
};

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(8).max(72);
const modeSchema = z.enum(["sign-in", "sign-up"]);

export async function authenticate(_: AuthState, formData: FormData): Promise<AuthState> {
  const mode = modeSchema.safeParse(formData.get("mode"));
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!mode.success) return { status: "error", message: "Ação de autenticação inválida." };
  if (!email.success) return { status: "error", mode: mode.data, message: "Digite um e-mail válido." };
  if (!password.success) {
    return { status: "error", mode: mode.data, message: "A senha deve ter entre 8 e 72 caracteres." };
  }
  if (!hasSupabaseConfig()) {
    return { status: "error", mode: mode.data, message: "A autenticação real ainda não foi configurada neste ambiente." };
  }

  const supabase = await createClient();
  if (mode.data === "sign-up") {
    const siteUrl = getSiteUrl();
    if (!siteUrl) return { status: "error", mode: mode.data, message: "A URL segura do aplicativo não foi configurada." };

    const { error } = await supabase.auth.signUp({
      email: email.data,
      password: password.data,
      options: { emailRedirectTo: new URL("/auth/callback", siteUrl).toString() },
    });
    if (error) return { status: "error", mode: mode.data, message: "Não foi possível criar a conta. Tente novamente." };
    return {
      status: "success",
      mode: mode.data,
      message: "Conta criada. Verifique seu e-mail antes de entrar.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
  if (error) {
    return { status: "error", mode: mode.data, message: "E-mail ou senha inválidos. Confirme também se o e-mail foi verificado." };
  }
  redirect("/app");
}

export async function authenticateWithGithub() {
  if (!hasSupabaseConfig()) redirect("/?auth=oauth-failed");

  const siteUrl = getSiteUrl();
  if (!siteUrl) redirect("/?auth=oauth-failed");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: new URL("/auth/callback", siteUrl).toString() },
  });
  if (error || !data.url) redirect("/?auth=oauth-failed");
  redirect(data.url);
}
