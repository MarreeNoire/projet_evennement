import type { ReactNode } from "react";
import Image from "next/image";

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className="auth-screen">
      <div className="auth-screen-backdrop" aria-hidden="true">
        <Image
          src="/images/auth-background.png"
          alt=""
          fill
          sizes="100vw"
          quality={72}
          preload
          className="auth-screen-image"
        />
        <div className="auth-screen-scrim" />
      </div>
      <div className="auth-screen-content">{children}</div>
    </main>
  );
}
