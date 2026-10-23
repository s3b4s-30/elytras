/**
 * Servicio de autenticación (Supabase Auth, correo + contraseña).
 * La UI solo conoce estas funciones, nunca el SDK.
 */
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

const looksLikeEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());

/**
 * Traduce lo que escribió el usuario en el login a un correo.
 * - Si parece correo → se usa tal cual.
 * - Si no → se busca el correo del dueño de esa tienda (RPC `email_for_store`).
 * Devuelve null si no existe (la UI muestra el mismo error genérico que una clave errónea,
 * para no confirmar si una tienda existe).
 */
export const resolveLoginEmail = async (identifier) => {
  const id = identifier.trim();
  if (!id) return null;
  if (looksLikeEmail(id)) return id;
  const { data, error } = await supabase.rpc('email_for_store', { store_name: id });
  if (error) throw error;
  return data || null;
};

export const signIn = async (identifier, password) => {
  const email = await resolveLoginEmail(identifier);
  if (!email) throw new Error('Invalid login credentials');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
};

/** true si el nombre de tienda está libre (insensible a mayúsculas). */
export const isStoreNameAvailable = async (storeName) => {
  const { data, error } = await supabase.rpc('store_name_available', { store_name: storeName });
  if (error) throw error;
  return data === true;
};

export const signUp = async (email, password, storeName) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { store_name: storeName.trim() } },
  });
  if (error) throw error;
  return data.session; // null si el proyecto exige confirmar el correo
};

/** Envía el enlace de recuperación. En web vuelve al mismo origen de la app. */
export const requestPasswordReset = async (email) => {
  const options =
    Platform.OS === 'web' && typeof window !== 'undefined' ? { redirectTo: window.location.origin } : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), options);
  if (error) throw error;
};

/** Define la nueva contraseña tras abrir el enlace de recuperación. */
export const updatePassword = async (password) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

export const signOut = () => supabase.auth.signOut();

export const getSession = async () => (await supabase.auth.getSession()).data.session;

export const onAuthChange = (cb) => {
  const { data } = supabase.auth.onAuthStateChange((_evt, session) => cb(session));
  return () => data.subscription.unsubscribe();
};

/** Tienda (tenant) del usuario autenticado. */
export const getMyStoreId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('store_members')
      .select('store_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (!error && data?.store_id) return data.store_id;
  } catch (err) {
    console.warn('Error consultando store_id:', err);
  }
  return userId;
};

export const authErrorMessage = (e) => {
  const m = (e?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Correo, tienda o contraseña incorrectos';
  if (m.includes('already registered')) return 'Ese correo ya tiene cuenta';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera un momento';
  if (m.includes('email not confirmed')) return 'Confirma tu correo para entrar';
  if (m.includes('same password')) return 'Elige una contraseña distinta a la anterior';
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres';
  if (m.includes('network') || m.includes('fetch')) return 'Sin conexión. Revisa tu internet';
  if (m.includes('email')) return 'Revisa el correo';
  return 'No se pudo completar. Intenta de nuevo';
};
