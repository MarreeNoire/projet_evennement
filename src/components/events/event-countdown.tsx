"use client";

import { useEffect, useState } from "react";

const MINUTE = 60_000;
const WINDOW = 48 * 60 * MINUTE;

function daysAhead(startAt: string, now: number) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Abidjan",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = (timestamp: number) =>
    Object.fromEntries(formatter.formatToParts(timestamp).map(({ type, value }) => [type, value]));
  const today = parts(now);
  const eventDay = parts(new Date(startAt).getTime());
  const asUtcDay = (value: Record<string, string>) =>
    Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day));

  return Math.round((asUtcDay(eventDay) - asUtcDay(today)) / (24 * 60 * MINUTE));
}

function getCountdown(startAt: string, now: number) {
  const remaining = new Date(startAt).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0 || remaining > WINDOW) return null;
  const day = daysAhead(startAt, now);
  if (day < 0 || day > 1) return null;

  const minutes = Math.ceil(remaining / MINUTE);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `J-${day} · dans ${hours} h ${String(remainingMinutes).padStart(2, "0")}`;
}

export function EventCountdown({ startAt }: { startAt: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(getCountdown(startAt, Date.now()));
    update();
    const interval = window.setInterval(update, MINUTE);
    return () => window.clearInterval(interval);
  }, [startAt]);

  if (!label) return null;

  return (
    <span className="event-countdown" aria-label={`Début de l'événement : ${label}`}>
      {label}
    </span>
  );
}
