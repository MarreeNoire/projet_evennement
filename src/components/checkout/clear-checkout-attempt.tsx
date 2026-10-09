"use client";

import { useEffect } from "react";

export function ClearCheckoutAttempt({ eventId }: { eventId: string }) {
  useEffect(() => {
    window.sessionStorage.removeItem(`rassemble_checkout_${eventId}`);
  }, [eventId]);

  return null;
}
