import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const dentroDoClaude = typeof window !== "undefined" && !!(window as unknown as { claude?: { use?: unknown } }).claude?.use;

/** Supabase (login e dados na nuvem) — usado no app publicado na Vercel.
 *  Dentro do Claude o app segue com contas locais e o banco do próprio Claude. */
export const supabase: SupabaseClient | null = url && key && !dentroDoClaude ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
