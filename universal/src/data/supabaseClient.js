/**
 * Cliente Supabase oficial con persistencia en AsyncStorage.
 */
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://orvjcplxxygnxxfshkdj.supabase.co';
const anon =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_PwyErkdY48tuCBX5OP_vOg_orG89n-y';

export const isSupabaseConfigured = Boolean(
  url && anon && !url.includes('TU-PROYECTO')
);

export const supabase = createClient(url, anon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // En web el enlace de recuperación trae la sesión en la URL; en nativo no aplica.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
