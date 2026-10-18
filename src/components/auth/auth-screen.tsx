import type { ReactNode } from "react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";

export function AuthScreen({ image, children }: { image: string | null; children: ReactNode }) {
  return (
    <main className="auth-screen">
      <div className="auth-screen-backdrop" aria-hidden="true">
        {image ? (
          <PublicStorageImage
            src={image}
            alt=""
            fill
            sizes="100vw"
            quality={68}
            preload
            className="auth-screen-image"
          />
        ) : null}
        <div className="auth-screen-scrim" />
      </div>
      <div className="auth-screen-content">{children}</div>
    </main>
  );
}
