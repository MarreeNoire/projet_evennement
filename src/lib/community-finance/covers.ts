import { STORAGE_BUCKETS } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_COVER_SIZE = 5 * 1024 * 1024;

export type CommunityCoverKind = "tontines" | "cotisations";

export async function uploadCommunityCover(file: File, kind: CommunityCoverKind) {
  const extension = IMAGE_TYPES[file.type];
  if (!extension) throw new Error("Choisis une image JPG, PNG, WebP ou AVIF.");
  if (file.size > MAX_COVER_SIZE) throw new Error("L’image doit faire 5 Mo maximum.");

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Connecte-toi pour ajouter une image.");

  const path = `${user.id}/${kind}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.COMMUNITY_COVERS)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (error) throw new Error(`L’image n’a pas pu être envoyée : ${error.message}`);

  return { path };
}

export async function removeCommunityCover(path: string) {
  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from(STORAGE_BUCKETS.COMMUNITY_COVERS).remove([path]);
}
