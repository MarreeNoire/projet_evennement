import { AdminPlatformEvents } from "@/components/admin/admin-platform-events";
import { getRecentEvents } from "@/lib/events/queries";

export const metadata = {
  title: "Modération des Événements | Super Admin | Event",
  description: "Validation et mise en avant des événements sur la plateforme.",
};

export default async function AdminEvenementsPage() {
  const events = await getRecentEvents(50);
  return <AdminPlatformEvents events={events} />;
}
