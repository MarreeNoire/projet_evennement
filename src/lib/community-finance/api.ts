import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getApiUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function parseJson(request: Request) {
  return request.json().catch(() => null) as Promise<unknown>;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function isOwnedCommunityCoverPath(
  path: string,
  userId: string,
  kind: "tontines" | "cotisations",
) {
  const [ownerId, pathKind, filename, ...extra] = path.split("/");
  return (
    ownerId === userId &&
    pathKind === kind &&
    extra.length === 0 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/i.test(
      filename ?? "",
    )
  );
}
