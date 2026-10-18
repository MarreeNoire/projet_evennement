"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { updateMyProfile } from "@/lib/profile/actions";

export function ProfileDetailsForm({
  displayName,
  username,
  city,
  bio,
}: {
  displayName: string;
  username: string | null;
  city: string | null;
  bio: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateMyProfile(formData);
        if (!result.success) {
          setMessage({ type: "error", text: result.message });
          return;
        }

        setMessage({ type: "success", text: "Ton profil a été enregistré." });
        router.refresh();
      } catch {
        setMessage({
          type: "error",
          text: "L’enregistrement a échoué. Vérifie ta connexion puis réessaie.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold">Nom d&apos;affichage</span>
          <input
            type="text"
            name="display_name"
            defaultValue={displayName}
            required
            minLength={2}
            maxLength={80}
            className="border-border-strong bg-surface focus:border-border-focus focus:ring-border-focus h-11 rounded-md border px-3 text-sm focus:ring-1 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold">Nom d&apos;utilisateur</span>
          <input
            type="text"
            name="username"
            defaultValue={username ?? ""}
            placeholder="nom_utilisateur"
            maxLength={30}
            pattern="[a-zA-Z0-9._]{3,30}"
            title="3 à 30 lettres, chiffres, points ou tirets bas."
            className="border-border-strong bg-surface focus:border-border-focus focus:ring-border-focus h-11 rounded-md border px-3 text-sm focus:ring-1 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Ville</span>
        <input
          type="text"
          name="city"
          defaultValue={city ?? ""}
          placeholder="Abidjan"
          maxLength={100}
          className="border-border-strong bg-surface focus:border-border-focus focus:ring-border-focus h-11 rounded-md border px-3 text-sm focus:ring-1 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Biographie</span>
        <textarea
          name="bio"
          rows={3}
          defaultValue={bio ?? ""}
          maxLength={500}
          placeholder="Passionné d'événements et de rencontres à Abidjan…"
          className="border-border-strong bg-surface focus:border-border-focus focus:ring-border-focus resize-none rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        />
      </label>

      {message ? (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={message.type === "error" ? "text-danger text-sm" : "text-success text-sm"}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover inline-flex h-11 w-fit items-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-70"
      >
        <Save className="size-4" aria-hidden="true" />
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
