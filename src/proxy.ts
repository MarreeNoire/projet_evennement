import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LAST_ROUTE_COOKIE = "event_pwa_last_route";
const START_PARAM = "pwa_start";

function getSafeSavedRoute(request: NextRequest) {
  const cookieValue = request.cookies.get(LAST_ROUTE_COOKIE)?.value;
  if (!cookieValue || cookieValue.length > 10_500) return null;

  try {
    const value = decodeURIComponent(cookieValue);
    if (value.length > 3500 || !value.startsWith("/") || value.startsWith("//")) {
      return null;
    }

    const route = new URL(value, request.url);
    if (
      route.origin !== request.nextUrl.origin ||
      route.pathname === "/auth" ||
      route.pathname.startsWith("/auth/") ||
      route.pathname.startsWith("/nouveau-mot-de-passe")
    ) {
      return null;
    }

    route.searchParams.delete(START_PARAM);
    return `${route.pathname}${route.search}${route.hash}`;
  } catch {
    return null;
  }
}

/*
 * PWA launch URLs carry a marker so a normal navigation to `/` remains the
 * home page. Android may recreate a suspended WebView; restore its last route
 * with a server redirect before rendering the home page.
 */
function redirectPwaLaunch(request: NextRequest) {
  if (request.nextUrl.searchParams.get(START_PARAM) !== "1") return null;

  const target = getSafeSavedRoute(request);
  const destination = new URL(target && target !== "/" ? target : "/", request.url);
  return NextResponse.redirect(destination, 307);
}

/* =============================================================================
   Proxy de session Supabase (convention Next.js 16 : `src/proxy.ts`)
   --------------------------------------------------------------------------
   * Rafraîchit les cookies de session à chaque requête (obligatoire avec
     @supabase/ssr, sinon la session expire côté serveur).
   * Ne bloque AUCUNE route ici : la protection se fait page par page avec
     `getCurrentUser()` + `redirect()`, pour garder des messages d'erreur
     clairs et des pages publiques ultra-rapides.
   ========================================================================== */

export default async function proxy(request: NextRequest) {
  const launchRedirect = redirectPwaLaunch(request);
  if (launchRedirect) return launchRedirect;

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sans configuration Supabase : laisse passer (mode installation / démo).
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Valide / rafraîchit la session (ne lève jamais : les pages gèrent le cas).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Toutes les routes sauf : assets Next, images, favicon, fichiers publics.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
