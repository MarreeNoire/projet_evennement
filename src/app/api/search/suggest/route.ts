import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* =============================================================================
   GET /api/search/suggest?q=...
   --------------------------------------------------------------------------
   Route légère pour l'autocomplétion de la barre de recherche.
   Retourne au maximum 5 événements dont le titre commence par le terme
   (ilike prefix) ou le contient (ilike wildcard), triés par date.
   Cache HTTP 30 s pour éviter d'aller en base à chaque touche.
   ========================================================================== */

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, max-age=0" },
    });
  }

  // Sécurise contre les injections LIKE
  const safe = q.replace(/[%_]/g, "");

  try {
    const supabase = await createSupabaseServerClient();

    // Priorité aux titres qui commencent par le terme
    const { data: starts } = await supabase
      .from("published_events")
      .select("id, title, slug, city, category")
      .ilike("title", `${safe}%`)
      .order("start_at", { ascending: true })
      .limit(5);

    const startIds = new Set((starts ?? []).map((e) => e.id));

    // Complète avec des titres qui contiennent le terme si on a moins de 5
    let combined = starts ?? [];
    if (combined.length < 5) {
      const { data: contains } = await supabase
        .from("published_events")
        .select("id, title, slug, city, category")
        .ilike("title", `%${safe}%`)
        .not("id", "in", `(${[...startIds].join(",") || "00000000-0000-0000-0000-000000000000"})`)
        .order("start_at", { ascending: true })
        .limit(5 - combined.length);

      combined = [...combined, ...(contains ?? [])];
    }

    return NextResponse.json(combined.slice(0, 5), {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
