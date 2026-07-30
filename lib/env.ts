function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Each NEXT_PUBLIC_* value below is accessed as a literal, static
// `process.env.NEXT_PUBLIC_X` expression on purpose. Next.js inlines
// NEXT_PUBLIC_ variables into the browser bundle at build time by
// statically finding and replacing that exact expression — it cannot
// see through a dynamic/computed access like `process.env[name]`, which
// silently evaluates to undefined in client code (there's no real
// `process.env` in the browser). This applies identically under Turbopack
// and Webpack; it is not a bundler bug.
export const env = {
  get supabaseUrl() {
    return required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey() {
    return required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  },
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
};
