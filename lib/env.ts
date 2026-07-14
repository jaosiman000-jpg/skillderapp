export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function allowsDemoMode() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_MODE === "true";
}
