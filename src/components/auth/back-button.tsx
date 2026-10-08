"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="text-fg-muted hover:text-fg focus-visible:outline-primary inline-flex min-h-10 w-fit items-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Retour
    </button>
  );
}
