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
  /** Numéro de l'autre personne, visible seulement après son partage individuel. */
  sharedPhone: string | null;
  /** Le membre courant partage-t-il son numéro avec cette connexion ? */
  isSharingPhone: boolean;
  canSharePhone: boolean;
  phoneRequestId: string | null;
  phoneRequestDirection: "incoming" | "outgoing" | null;
}

function isNetworkFailure(error: { message?: string; cause?: unknown }): boolean {
  const details =
    `${error.message ?? ""} ${error.cause instanceof Error ? error.cause.message : ""}`.toLowerCase();
  return (
    details.includes("fetch failed") ||
    details.includes("failed to fetch") ||
    details.includes("networkerror")
  );
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

  const loadConnections = () =>
    supabase
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
    ...new Set(
      rows.map((row) => (row.requester_id === currentUserId ? row.addressee_id : row.requester_id)),
    ),
  ];
  const eventIds = rows.map((row) => row.event_id).filter((id): id is string => Boolean(id));
  const acceptedRows = rows.filter((row) => row.status === "accepted");
  const acceptedConnectionIds = acceptedRows.map((row) => row.id);
  const acceptedOtherIds = acceptedRows.map((row) =>
    row.requester_id === currentUserId ? row.addressee_id : row.requester_id,
  );

  const [
    profilesResult,
    events,
    sharesResult,
    contactsResult,
    ownContactResult,
    contactRequestsResult,
  ] = await Promise.all([
    otherIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, display_name, avatar_url, city, is_verified")
          .in("id", otherIds)
      : Promise.resolve({ data: [] as ConnectionPerson[] }),
    getEventsByIds(eventIds),
    acceptedConnectionIds.length > 0
      ? supabase
          .from("connection_contact_shares")
          .select("connection_id, owner_id")
          .in("connection_id", acceptedConnectionIds)
      : Promise.resolve({ data: [] as { connection_id: string; owner_id: string }[] }),
    acceptedOtherIds.length > 0
      ? supabase.from("profile_contacts").select("user_id, phone").in("user_id", acceptedOtherIds)
      : Promise.resolve({ data: [] as { user_id: string; phone: string }[] }),
    supabase.from("profile_contacts").select("phone").eq("user_id", currentUserId).maybeSingle(),
    acceptedConnectionIds.length > 0
      ? supabase
          .from("connection_contact_requests")
          .select("id, connection_id, requester_id")
          .in("connection_id", acceptedConnectionIds)
          .eq("status", "pending")
      : Promise.resolve({
          data: [] as { id: string; connection_id: string; requester_id: string }[],
        }),
  ]);

  const people = new Map<string, ConnectionPerson>();
  for (const person of (profilesResult.data ?? []) as unknown as ConnectionPerson[]) {
    people.set(person.id, person);
  }
  const shareKeys = new Set(
    (sharesResult.data ?? []).map((share) => `${share.connection_id}:${share.owner_id}`),
  );
  const sharedPhones = new Map(
    (contactsResult.data ?? []).map((contact) => [contact.user_id, contact.phone]),
  );
  const canSharePhone = Boolean(ownContactResult.data?.phone);
  const contactRequests = new Map(
    (contactRequestsResult.data ?? []).map((request) => [request.connection_id, request]),
  );

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
      sharedPhone: sharedPhones.get(otherId) ?? null,
      isSharingPhone: shareKeys.has(`${row.id}:${currentUserId}`),
      canSharePhone,
      phoneRequestId: contactRequests.get(row.id)?.id ?? null,
      phoneRequestDirection: contactRequests.has(row.id)
        ? contactRequests.get(row.id)?.requester_id === currentUserId
          ? "outgoing"
          : "incoming"
        : null,
    };
  });
}
