"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function updateMyProfile(formData: FormData): Promise<void> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("display_name"),
    username: formData.get("username"),
    city: formData.get("city"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    redirect(
      `/profil?profileError=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Vérifie les informations saisies.")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) redirect("/connexion?redirect=/profil");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      username: parsed.data.username,
      city: parsed.data.city,
      bio: parsed.data.bio,
    })
    .eq("id", authData.user.id);

  if (error?.code === "23505") {
    redirect(
      "/profil?profileError=Ce%20nom%20d%E2%80%99utilisateur%20est%20d%C3%A9j%C3%A0%20utilis%C3%A9.",
    );
  }
  if (error)
    redirect(
      "/profil?profileError=Impossible%20d%E2%80%99enregistrer%20le%20profil.%20R%C3%A9essaie.",
    );

  revalidatePath("/profil");
  revalidatePath(`/profil/${authData.user.id}`);
  revalidatePath("/connexions");
  redirect("/profil?profileSaved=1");
}
