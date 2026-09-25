import { OrgTeamManager } from "@/components/events/org-team-manager";

export const metadata = {
  title: "Gestion de l'Équipe | Espace Organisateur | Rassemble",
  description: "Gérez les collaborateurs et leurs rôles d'accès.",
};

export default async function OrgEquipePage() {
  return <OrgTeamManager />;
}
