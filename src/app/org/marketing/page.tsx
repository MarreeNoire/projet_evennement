import { OrgMarketingManager } from "@/components/events/org-marketing-manager";

export const metadata = {
  title: "Marketing & Promos | Event",
  description: "Création de codes de réduction et campagnes d'annonces.",
};

export default async function OrgMarketingPage() {
  return <OrgMarketingManager />;
}
