import { redirect } from "next/navigation";

import { AdminNavigation } from "@/components/admin/admin-navigation";
import { EditorialFooter } from "@/components/layout/editorial/editorial-footer";
import { EditorialScope } from "@/components/layout/editorial/editorial-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { loadHeaderUser } from "@/lib/auth/viewer";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.roles.includes("admin")) redirect("/");

  const viewer = await loadHeaderUser();

  return (
    <EditorialScope>
      <div className="flex min-h-dvh flex-col bg-bg">
        <SiteHeader />
        <div className="container-page flex-1 py-5 sm:py-8">
          <div className="grid min-w-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
            <AdminNavigation />
            <main id="contenu" className="min-w-0">
              {children}
            </main>
          </div>
        </div>
        <EditorialFooter viewer={viewer} />
      </div>
    </EditorialScope>
  );
}
