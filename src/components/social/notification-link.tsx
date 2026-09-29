"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";

import { markNotificationRead } from "@/lib/notifications/actions";

export function NotificationLink({
  href,
  notificationId,
  isRead,
  children,
}: {
  href: string;
  notificationId: string;
  isRead: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isRead || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await markNotificationRead(notificationId);
      if (!result.success) {
        setError("Cette notification n’a pas pu être marquée comme lue. Réessaie.");
        return;
      }
      router.push(href);
      router.refresh();
    } catch {
      setError("Cette notification n’a pas pu être marquée comme lue. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Link
        href={href}
        onClick={handleClick}
        aria-busy={pending}
        className="hover:bg-bg-muted block"
      >
        {children}
      </Link>
      {error ? (
        <p role="alert" className="border-border text-danger border-b py-2 text-sm">
          {error}
        </p>
      ) : null}
    </>
  );
}
