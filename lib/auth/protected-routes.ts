const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ONLY_PATHS = ["/login", "/signup"];

/** Routes that require a signed-in session; unauthenticated visitors are redirected to /login. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Routes only meant for signed-out visitors; signed-in users are redirected to /dashboard. */
export function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PATHS.includes(pathname);
}
