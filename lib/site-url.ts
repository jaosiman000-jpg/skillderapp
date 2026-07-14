export function getSiteUrl() {
  const fallback = process.env.NODE_ENV === "development" ? "http://localhost:3000" : null;
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallback;
  if (!value) return null;

  try {
    const url = new URL(value);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !local) return null;
    return url.origin;
  } catch {
    return null;
  }
}
