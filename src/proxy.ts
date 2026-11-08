import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const locales: readonly string[] = routing.locales;
const defaultLocale: string = routing.defaultLocale;

/** Segments that require a session cookie. */
const PROTECTED_PREFIXES = ["/dashboard"];

function resolveLocale(pathname: string, request: NextRequest): string {
  const [, maybeLocale] = pathname.split("/");
  if (maybeLocale && locales.includes(maybeLocale)) {
    return maybeLocale;
  }

  const preferred = request.cookies.get("NEXT_LOCALE")?.value;
  if (preferred && locales.includes(preferred)) {
    return preferred;
  }

  return defaultLocale;
}

/** Strips a locale prefix so guards can match on the app path alone. */
function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  const [, maybeLocale, ...rest] = segments;
  return maybeLocale && locales.includes(maybeLocale)
    ? `/${rest.join("/")}`
    : pathname;
}

function isProtectedPath(path: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path = stripLocale(pathname);

  // Presence-only check — token validity is enforced server-side by `withAuth`.
  if (isProtectedPath(path) && !request.cookies.has("token")) {
    const locale = resolveLocale(pathname, request);
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
