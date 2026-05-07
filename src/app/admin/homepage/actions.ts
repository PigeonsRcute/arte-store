"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSection(section: string, content: Record<string, unknown>, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("homepage_content")
    .upsert({ section, content, is_active: isActive }, { onConflict: "section" });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

export async function toggleSection(section: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("homepage_content")
    .update({ is_active: isActive })
    .eq("section", section);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
