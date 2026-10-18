"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .max(30)
    .refine((value) => value === "" || /^[a-z0-9._]{3,30}$/.test(value), {
      message: "Utilise 3 à 30 lettres, chiffres, points ou tirets bas.",
    })
    .transform((value) => value || null),
  city: z
    .string()
    .trim()
    .max(100, "La ville est trop longue.")
    .transform((value) => value || null),
  bio: z
    .string()
    .trim()
    .max(500, "La biographie ne peut pas dépasser 500 caractères.")
    .transform((value) => value || null),
});

export type UpdateProfileResult = { success: true } | { success: false; message: string };

export async function updateMyProfile(formData: FormData): Promise<UpdateProfileResult> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("display_name"),
    username: formData.get("username"),
    city: formData.get("city"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Vérifie les informations saisies.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { success: false, message: "Ta session a expiré. Reconnecte-toi puis réessaie." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      username: parsed.data.username,
      city: parsed.data.city,
      bio: parsed.data.bio,
    })
    .eq("id", authData.user.id)
    .select("id")
    .maybeSingle();

  if (error?.code === "23505") {
    return { success: false, message: "Ce nom d’utilisateur est déjà utilisé." };
  }
  if (error || !data) {
    return { success: false, message: "Impossible d’enregistrer le profil. Réessaie." };
  }

  revalidatePath("/profil");
  revalidatePath(`/profil/${authData.user.id}`);
  revalidatePath("/connexions");
  return { success: true };
}
