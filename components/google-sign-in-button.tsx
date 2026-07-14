"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createGoogleNonce } from "@/lib/google-auth";
import { createClient } from "@/lib/supabase/client";

type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce: string;
    use_fedcm_for_prompt: boolean;
  }): void;
  prompt(): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

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

export function GoogleSignInButton({ label }: { label: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  function fail() {
    setPending(false);
    router.replace("/?auth=oauth-failed");
  }

  async function signIn() {
    if (!clientId || !window.google) return fail();
    try {
      const { nonce, hashedNonce } = await createGoogleNonce();

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async ({ credential }) => {
          setPending(true);
          try {
            const { error } = await createClient().auth.signInWithIdToken({
              provider: "google",
              token: credential,
              nonce,
            });
            if (error) throw error;
            router.replace("/app");
            router.refresh();
          } catch {
            fail();
          }
        },
      });
      window.google.accounts.id.prompt();
    } catch {
      fail();
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => clientId && window.google ? setReady(true) : fail()}
        onError={fail}
      />
      <button type="button" disabled={!ready || pending} onClick={() => void signIn()}>
        <GoogleIcon />{pending ? "…" : label}
      </button>
    </>
  );
}
