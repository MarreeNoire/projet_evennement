import { Spinner } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="container-page flex min-h-[55dvh] items-center justify-center py-12">
      <Spinner label="Chargement de la page…" />
    </main>
  );
}
