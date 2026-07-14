import { describe, expect, it } from "vitest";
import { createGoogleNonce } from "@/lib/google-auth";

describe("Google authentication nonce", () => {
  it("creates a random nonce and its SHA-256 hexadecimal digest", async () => {
    const first = await createGoogleNonce();
    const second = await createGoogleNonce();

    expect(first.nonce).not.toBe(second.nonce);
    expect(first.hashedNonce).toMatch(/^[a-f0-9]{64}$/);
  });
});
