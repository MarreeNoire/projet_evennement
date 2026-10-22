"use client";

/* =============================================================================
   File d'attente hors-ligne des commentaires
   --------------------------------------------------------------------------
   Les commentaires écrits sans réseau sont empilés dans localStorage et
   rejoués au retour de la connexion. L'état est partagé via
   useSyncExternalStore (toujours pur pendant le rendu) et un écouteur
   `online` re-tente l'envoi. On ne fait jamais d'hypothèse sur le serveur :
   c'est le consommateur qui fournit la fonction d'envoi.
   ========================================================================== */

export interface QueuedComment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  /** Compteur de tentatives : au-delà de 4, l'entrée reste visible en échec. */
  attempts: number;
}

const STORAGE_KEY = "event.salon.comments.outbox.v1";
const LIMIT = 30;

let cache: QueuedComment[] | null = null;
const listeners = new Set<() => void>();

function load(): QueuedComment[] {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = [];
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as QueuedComment[]) : [];
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(next: QueuedComment[]) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota plein : la file reste en mémoire pour cette session */
    }
  }
  for (const listener of listeners) listener();
}

export function subscribeOutbox(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getOutbox(): QueuedComment[] {
  return load();
}

export function getOutboxVersion(): number {
  return load().length;
}

export function enqueueComment(entry: {
  postId: string;
  parentId: string | null;
  content: string;
}): QueuedComment {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const queued: QueuedComment = {
    id,
    postId: entry.postId,
    parentId: entry.parentId ?? null,
    content: entry.content,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  persist([...load(), queued].slice(-LIMIT));
  return queued;
}

/** Retire une entrée envoyée (ou abandonnée) de la file. */
export function dequeueComment(id: string): void {
  persist(load().filter((item) => item.id !== id));
}

/** Marque une tentative de plus sur l'entrée (échec d'envoi). */
export function bumpAttempt(id: string): void {
  persist(
    load().map((item) =>
      item.id === id ? { ...item, attempts: item.attempts + 1 } : item,
    ),
  );
}

/** Clone sécurisé pour les consommateurs React. */
export function getOutboxSnapshot(): QueuedComment[] {
  return load().map((item) => ({ ...item }));
}
