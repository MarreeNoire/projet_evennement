import { redirect } from "next/navigation";

import { AdminNavigation } from "@/components/admin/admin-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.roles.includes("admin")) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <div className="container-page flex-1 py-5 sm:py-8">
        <div className="grid min-w-0 gap-5 lg:gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <AdminNavigation />
          <main id="contenu" className="min-w-0">{children}</main>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
