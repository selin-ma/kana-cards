import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

// When env vars are missing, this is a placeholder — App never renders in that case
export const supabase = isSupabaseConfigured
  ? createClient(url!, key!)
  : ({} as ReturnType<typeof createClient>);
