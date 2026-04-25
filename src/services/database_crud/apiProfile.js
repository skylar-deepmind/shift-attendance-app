import supabase from "@/lib/supabase.js";

export async function insertProfile(profileData) {
  const { data, error } = await supabase
    .from("profiles")
    .insert([profileData])
    .select();
  if (error) {
    throw new Error(`Profile creation failed: ${error.message}`);
  }
  return data;
}

export async function upsertProfile(profileData) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "id" })
    .select();

  if (error) {
    throw new Error(`Profile upsert failed: ${error.message}`);
  }

  return data;
}

export async function getProfileById(profileId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    throw new Error(`Profile fetch failed: ${error.message}`);
  }

  return data;
}

export async function updateProfile(profileId, profileData) {
  const { data, error } = await supabase
    .from("profiles")
    .update(profileData)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }

  return data;
}
