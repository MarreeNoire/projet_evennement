import { getEventsByIds } from "@/lib/salons/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* Connexions de l'utilisateur courant (réseau, demandes reçues, demandes envoyées). */

export interface ConnectionPerson {
  id: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  is_verified: boolean;
}

export interface ConnectionEntry {
  id: string;
  status: "pending" | "accepted" | "declined";
  /** incoming = on m'a écrit, outgoing = j'ai écrit. */
  direction: "incoming" | "outgoing";
  message: string | null;
  origin: string;
  eventTitle: string | null;
  createdAt: string;
  person: ConnectionPerson | null;
}

function isNetworkFailure(error: { message?: string; cause?: unknown }): boolean {
  const details = `${error.message ?? ""} ${error.cause instanceof Error ? error.cause.message : ""}`.toLowerCase();
  return details.includes("fetch failed") || details.includes("failed to fetch") || details.includes("networkerror");
}

function waitForRetry(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

export async function getMyConnections(userId?: string): Promise<ConnectionEntry[] | null> {
  const supabase = await createSupabaseServerClient();
  let currentUserId = userId;
  if (!currentUserId) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn("[getMyConnections] Unable to validate the current session.", authError.message);
      return null;
    }
    currentUserId = authData.user?.id;
  }
  if (!currentUserId) return [];

  const loadConnections = () => supabase
    .from("connections")
    .select("id, requester_id, addressee_id, status, message, origin, event_id, created_at")
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    .neq("status", "declined")
    .order("created_at", { ascending: false })
    .limit(200);

  let { data, error } = await loadConnections();
  if (error && isNetworkFailure(error)) {
    await waitForRetry();
    ({ data, error } = await loadConnections());
  }

  if (error) {
    console.warn("[getMyConnections] Connection records could not be loaded.", {
      code: error.code,
      message: error.message,
    });
    return null;
  }

  const rows = data ?? [];
  const otherIds = [
    ...new Set(rows.map((row) => (row.requester_id === currentUserId ? row.addressee_id : row.requester_id))),
  ];
  const eventIds = rows.map((row) => row.event_id).filter((id): id is string => Boolean(id));

  const [profilesResult, events] = await Promise.all([
    otherIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, display_name, avatar_url, city, is_verified")
          .in("id", otherIds)
      : Promise.resolve({ data: [] as ConnectionPerson[] }),
    getEventsByIds(eventIds),
  ]);

  const people = new Map<string, ConnectionPerson>();
  for (const person of (profilesResult.data ?? []) as unknown as ConnectionPerson[]) {
    people.set(person.id, person);
  }

  return rows.map((row) => {
    const outgoing = row.requester_id === currentUserId;
    const otherId = outgoing ? row.addressee_id : row.requester_id;

    return {
      id: row.id,
      status: row.status as ConnectionEntry["status"],
      direction: outgoing ? "outgoing" : "incoming",
      message: row.message,
      origin: row.origin,
      eventTitle: row.event_id ? (events.get(row.event_id)?.title ?? null) : null,
      createdAt: row.created_at,
      person: people.get(otherId) ?? null,
    };
  });
}
