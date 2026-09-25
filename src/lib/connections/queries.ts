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

export async function getMyConnections(): Promise<ConnectionEntry[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, status, message, origin, event_id, created_at")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .neq("status", "declined")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[getMyConnections]", error.message);
    return [];
  }

  const rows = data ?? [];
  const otherIds = [
    ...new Set(rows.map((row) => (row.requester_id === user.id ? row.addressee_id : row.requester_id))),
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
    const outgoing = row.requester_id === user.id;
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
