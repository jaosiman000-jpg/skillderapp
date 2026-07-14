"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { authenticate, authenticateWithProvider, type AuthMode, type AuthState } from "@/app/actions";
import { Brand } from "@/components/brand";

const initialState: AuthState = { status: "idle" };

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.7 4.7 0 0 1-2 3v2.8h3.5c2-1.9 3.2-4.6 3.2-7.9Z" />
      <path fill="#34A853" d="M12 22c2.9 0 5.3-.9 7-2.6l-3.5-2.8a6.4 6.4 0 0 1-9.5-3.4H2.4V16A10.6 10.6 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6 13.2a6.3 6.3 0 0 1 0-4V6.4H2.4a10.6 10.6 0 0 0 0 9.5L6 13.2Z" />
      <path fill="#EA4335" d="M12 5.6c1.6 0 3 .6 4.1 1.6l3-3A10.1 10.1 0 0 0 2.4 6.5L6 9.2A6.3 6.3 0 0 1 12 5.6Z" />
    </svg>
  );
}

export function EntryExperience({ demoAllowed, authIssue }: { demoAllowed: boolean; authIssue?: string }) {
  const [showSplash, setShowSplash] = useState(true);
  const [locale, setLocale] = useState<"pt-BR" | "en">("pt-BR");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [state, action, pending] = useActionState(authenticate, initialState);

  const copy = locale === "pt-BR"
    ? {
        tagline: "Descubra sua próxima skill.",
        title: "Entre no SKILLDER",
        subtitle: "Use seu e-mail ou entre direto com sua conta.",
        signIn: "Entrar",
        signUp: "Criar conta",
        email: "E-mail",
        password: "Senha",
        passwordHint: "Mínimo de 8 caracteres",
        submitIn: "Entrar com e-mail",
        submitUp: "Criar conta com e-mail",
        pending: "Aguarde…",
        divider: "ou continue com",
        google: "Google",
        github: "GitHub",
        language: "Continue in English",
        demo: "Explorar demonstração local",
        legal: "Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.",
        oauthError: "Não foi possível iniciar o login social. Tente novamente.",
      }
    : {
        tagline: "Discover your next skill.",
        title: "Sign in to SKILLDER",
        subtitle: "Use your email or continue directly with your account.",
        signIn: "Sign in",
        signUp: "Create account",
        email: "Email",
        password: "Password",
        passwordHint: "At least 8 characters",
        submitIn: "Sign in with email",
        submitUp: "Create account with email",
        pending: "Please wait…",
        divider: "or continue with",
        google: "Google",
        github: "GitHub",
        language: "Continuar em português",
        demo: "Explore local demo",
        legal: "By continuing, you agree to the Terms of Use and Privacy Policy.",
        oauthError: "We could not start social sign-in. Please try again.",
      };

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <main className="splash" aria-label="SKILLDER">
        <Brand light />
        <p>{copy.tagline}</p>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <section className="auth-brand" aria-label="SKILLDER">
        <Brand light />
      </section>
      <section className="auth-sheet">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="auth-tabs" role="group" aria-label={copy.title}>
          <button type="button" className={mode === "sign-in" ? "is-active" : ""} onClick={() => setMode("sign-in")}>{copy.signIn}</button>
          <button type="button" className={mode === "sign-up" ? "is-active" : ""} onClick={() => setMode("sign-up")}>{copy.signUp}</button>
        </div>
        <form action={action} className="auth-form">
          <input type="hidden" name="mode" value={mode} />
          <label htmlFor="email">{copy.email}</label>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} placeholder="voce@exemplo.com" />
          <label htmlFor="password">{copy.password}</label>
          <input id="password" name="password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} required minLength={8} maxLength={72} aria-describedby="password-hint" />
          <small id="password-hint">{copy.passwordHint}</small>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? copy.pending : mode === "sign-up" ? copy.submitUp : copy.submitIn}
          </button>
          {state.message && state.mode === mode ? <p className={`form-message form-message--${state.status}`} role="status">{state.message}</p> : null}
        </form>
        <div className="auth-divider"><span>{copy.divider}</span></div>
        <div className="social-auth">
          <form action={authenticateWithProvider}>
            <input type="hidden" name="provider" value="google" />
            <button type="submit"><GoogleIcon />{copy.google}</button>
          </form>
          <form action={authenticateWithProvider}>
            <input type="hidden" name="provider" value="github" />
            <button type="submit"><Github aria-hidden="true" />{copy.github}</button>
          </form>
        </div>
        {authIssue ? <p className="form-message form-message--error auth-global-message" role="alert">{copy.oauthError}</p> : null}
        <button
          className="language-link"
          type="button"
          lang={locale === "pt-BR" ? "en" : "pt-BR"}
          onClick={() => setLocale((current) => current === "pt-BR" ? "en" : "pt-BR")}
        >
          {copy.language}
        </button>
        {demoAllowed ? <Link className="demo-link" href="/app?demo=1">{copy.demo}</Link> : null}
        <p className="legal-copy">{copy.legal}</p>
      </section>
    </main>
  );
}
