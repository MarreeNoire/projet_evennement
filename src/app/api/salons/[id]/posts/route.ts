import { NextResponse } from "next/server";

import { getSalonPosts } from "@/lib/salons/queries";

/* =============================================================================
   Fil paginé d'un salon — GET /api/salons/[id]/posts?offset=N&limit=M
   --------------------------------------------------------------------------
   Réutilise exactement la même lecture serveur (RLS + URLs signées) que la
   page : aucun nouveau chemin d'accès aux données. Sert au défilement infini.
   ========================================================================== */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const rawOffset = Number.parseInt(url.searchParams.get("offset") ?? "", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  const posts = await getSalonPosts(id, { limit, offset });

  return NextResponse.json(
    { posts },
    {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
