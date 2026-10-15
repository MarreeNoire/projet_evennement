import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const START_PARAM = "pwa_start";

/*
 * PWA launch URLs carry a marker so previous installs also return to the home
 * page instead of following a stale route saved by an older app version.
 */
function redirectPwaLaunch(request: NextRequest) {
  if (request.nextUrl.searchParams.get(START_PARAM) !== "1") return null;

  const response = NextResponse.redirect(new URL("/", request.url), 307);
  response.cookies.set("event_pwa_last_route", "", { path: "/", maxAge: 0 });
  return response;
}

/* =============================================================================
   Proxy de session Supabase (convention Next.js 16 : `src/proxy.ts`)
   --------------------------------------------------------------------------
   * Rafraîchit les cookies de session à chaque requête (obligatoire avec
     @supabase/ssr, sinon la session expire côté serveur).
   * Le mode maintenance redirige les visiteurs vers une page dédiée, tout en
     laissant l'administration et les webhooks accessibles.
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const maintenanceExempt =
    pathname === "/maintenance" ||
    pathname === "/connexion" ||
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/");
  if (maintenanceExempt) return response;

  const { data: maintenanceSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "platform.maintenance_mode")
    .maybeSingle();
  const maintenanceEnabled = maintenanceSetting?.value === true;

  if (maintenanceEnabled) {
    let isAdmin = false;
    if (user) {
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = Boolean(adminRole);
    }

    // Un administrateur connecté peut vérifier le site complet pendant l'intervention.
    if (isAdmin) return response;

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Le site est temporairement en maintenance." },
        { status: 503, headers: { "Retry-After": "300" } },
      );
    }
    return NextResponse.redirect(new URL("/maintenance", request.url), 307);
  }

  return response;
}

export const config = {
  matcher: [
    // Toutes les routes sauf : assets Next, images, favicon, fichiers publics.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
