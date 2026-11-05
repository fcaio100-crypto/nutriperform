import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState as RNAppState } from "react-native";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "";

/** Mesmo projeto Supabase do app web: login e dados iguais nos dois. */
export const supabase = createClient(url, key, {
  auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

// renova o token só com o app em primeiro plano (recomendação do supabase-js para RN)
RNAppState.addEventListener("change", (s) => {
  if (s === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
