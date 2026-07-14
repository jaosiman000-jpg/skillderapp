import { describe, expect, it } from "vitest";
import { githubFullNameFromUrl } from "@/lib/skills/github";

describe("GitHub repository URL validation", () => {
  it("accepts only the main HTTPS repository URL", () => {
    expect(githubFullNameFromUrl("https://github.com/openai/codex")).toBe("openai/codex");
    expect(githubFullNameFromUrl("https://github.com/openai/codex.git")).toBe("openai/codex");
  });

  it("rejects alternate hosts, nested paths and query strings", () => {
    expect(githubFullNameFromUrl("http://github.com/openai/codex")).toBeNull();
    expect(githubFullNameFromUrl("https://github.com.evil.test/openai/codex")).toBeNull();
    expect(githubFullNameFromUrl("https://github.com/openai/codex/issues")).toBeNull();
    expect(githubFullNameFromUrl("https://github.com/openai/codex?tab=readme")).toBeNull();
  });
});
