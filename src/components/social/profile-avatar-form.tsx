"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle } from "lucide-react";

import { ProfileAvatarPreview } from "@/components/social/profile-avatar-preview";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfileAvatarForm({
  userId,
  displayName,
  initialAvatarUrl,
}: {
  userId: string;
  displayName: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function uploadPhoto(file: File | undefined) {
    if (!file) return;
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) {
      setError("Choisis une image JPG, PNG, WebP ou AVIF.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("La photo doit faire 2 Mo maximum.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || data.user?.id !== userId) {
          setError("Reconnecte-toi pour modifier ta photo.");
          return;
        }

        const path = `${userId}/profile.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.AVATARS)
          .upload(path, file, { contentType: file.type, upsert: true, cacheControl: "3600" });
        if (uploadError) {
          setError("La photo n’a pas pu être envoyée. Réessaie.");
          return;
        }

        const { data: publicData } = supabase.storage
          .from(STORAGE_BUCKETS.AVATARS)
          .getPublicUrl(path);
        const nextUrl = `${publicData.publicUrl}?v=${Date.now()}`;
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ avatar_url: nextUrl })
          .eq("id", userId);

        if (profileError) {
          setError("La photo a été envoyée, mais le profil n’a pas pu être mis à jour.");
          return;
        }

        setAvatarUrl(nextUrl);
        router.refresh();
      } catch {
        setError("La photo n’a pas pu être envoyée. Vérifie ta connexion puis réessaie.");
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <ProfileAvatarPreview src={avatarUrl} name={displayName} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        disabled={pending}
        onChange={(event) => {
          uploadPhoto(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="border-border-strong bg-surface hover:bg-bg-muted inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Camera className="size-4" aria-hidden="true" />
        )}
        {pending ? "Envoi…" : avatarUrl ? "Changer la photo" : "Ajouter une photo"}
      </button>
      <p className="text-fg-subtle text-center text-xs sm:text-left">
        Visible sur ton profil et dans les salons · 2 Mo max
      </p>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
