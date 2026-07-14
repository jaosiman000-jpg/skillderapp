"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createGoogleNonce } from "@/lib/google-auth";
import { createClient } from "@/lib/supabase/client";

type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce: string;
    use_fedcm_for_button: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: {
    type: "standard";
    theme: "outline";
    size: "large";
    text: "continue_with";
    shape: "pill";
    logo_alignment: "left";
    width: string;
  }): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

export function GoogleSignInButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let cancelled = false;
    const fail = () => {
      if (cancelled) return;
      setPending(false);
      router.replace("/?auth=oauth-failed");
    };

    async function initialize() {
      if (!clientId || !buttonRef.current) return fail();
      const { nonce, hashedNonce } = await createGoogleNonce();
      const render = () => {
        if (cancelled || !window.google || !buttonRef.current) return fail();
        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce: hashedNonce,
          use_fedcm_for_button: true,
          callback: async ({ credential }) => {
            setPending(true);
            try {
              const { error } = await createClient().auth.signInWithIdToken({ provider: "google", token: credential, nonce });
              if (error) throw error;
              router.replace("/app");
              router.refresh();
            } catch {
              fail();
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: String(Math.max(buttonRef.current.clientWidth, 180)),
        });
      };

      if (window.google) return render();
      document.querySelector('script[src="https://accounts.google.com/gsi/client"]')?.remove();
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.addEventListener("load", render, { once: true });
      script.addEventListener("error", fail, { once: true });
      document.head.appendChild(script);
    }

    void initialize().catch(fail);
    return () => { cancelled = true; };
  }, [clientId, router]);

  return (
    <div ref={buttonRef} className={pending ? "google-auth-button google-auth-button--pending" : "google-auth-button"} />
  );
}
