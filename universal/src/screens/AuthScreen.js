import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { Card, Field, PrimaryButton, Tap } from '../ui/kit';
import {
  signIn,
  signUp,
  requestPasswordReset,
  updatePassword,
  isStoreNameAvailable,
  authErrorMessage,
} from '../data/authService';

const MIN_PASSWORD = 6;
const looksLikeEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());

/** Marco común: fondo OLED, columna centrada (móvil / PWA / escritorio), logo. */
function AuthFrame({ title, children }) {
  const t = useTheme();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 420 }}>
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: t.blue, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bag-handle" size={36} color="#fff" />
            </View>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', marginTop: 16 }}>Sebas POS</Text>
            {title ? <Text style={{ color: t.text2, fontSize: 15, marginTop: 6 }}>{title}</Text> : null}
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Mensaje de estado visible y accesible (funciona igual en web e iOS; Alert no existe en web). */
function Notice({ kind, children }) {
  const t = useTheme();
  if (!children) return null;
  const isError = kind === 'error';
  const color = isError ? t.red : t.green;
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: isError ? 'rgba(255,69,58,0.14)' : 'rgba(48,209,88,0.14)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
      }}
    >
      <Ionicons name={isError ? 'alert-circle' : 'checkmark-circle'} size={18} color={color} />
      <Text style={{ color, flex: 1, fontSize: 14, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

const LinkButton = ({ label, onPress, align = 'center', color }) => {
  const t = useTheme();
  return (
    <Tap onPress={onPress} hapticKind="select" style={{ alignItems: align === 'center' ? 'center' : 'flex-end', paddingVertical: 12 }}>
      <Text style={{ color: color || t.blue, fontSize: 15 }}>{label}</Text>
    </Tap>
  );
};

export function AuthScreen() {
  const [mode, setMode] = useState('in'); // 'in' | 'up' | 'forgot'
  const [identifier, setIdentifier] = useState(''); // correo o tienda (login)
  const [email, setEmail] = useState(''); // registro / recuperación
  const [store, setStore] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (next) => {
    // Al ir a recuperar contraseña se reutiliza el correo ya escrito en el login.
    if (next === 'forgot' && looksLikeEmail(identifier)) setEmail(identifier.trim());
    setMode(next);
    setError('');
    setInfo('');
    setPassword('');
    setConfirm('');
  };

  const submit = async () => {
    setError('');
    setInfo('');

    // Validaciones locales antes de tocar la red.
    if (mode === 'up') {
      if (!store.trim()) return setError('Escribe el nombre de tu tienda');
      if (!looksLikeEmail(email)) return setError('Escribe un correo válido');
      if (password.length < MIN_PASSWORD) return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
      if (password !== confirm) return setError('Las contraseñas no coinciden');
    } else if (mode === 'forgot') {
      if (!looksLikeEmail(email)) return setError('Escribe el correo de tu cuenta');
    }

    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(identifier, password);
      } else if (mode === 'up') {
        if (!(await isStoreNameAvailable(store))) {
          setError('Ese nombre de tienda ya está en uso');
          return;
        }
        const session = await signUp(email, password, store);
        if (!session) {
          setInfo('Cuenta creada. Revisa tu correo para confirmarla');
          setMode('in');
          setIdentifier(email.trim());
        }
      } else {
        await requestPasswordReset(email);
        setInfo('Te enviamos un enlace para restablecer tu contraseña');
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    !busy &&
    (mode === 'in'
      ? identifier.trim() && password.length > 0
      : mode === 'up'
      ? store.trim() && email.trim() && password && confirm
      : email.trim());

  const title = mode === 'up' ? 'Crear cuenta' : mode === 'forgot' ? 'Recuperar contraseña' : '';
  const cta = busy ? '...' : mode === 'in' ? 'Entrar' : mode === 'up' ? 'Crear cuenta' : 'Enviar enlace';

  return (
    <AuthFrame title={title}>
      <Card style={{ padding: 18 }}>
        {mode === 'in' && (
          <>
            <Field
              label="Correo o tienda"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="username"
              placeholder="correo@ejemplo.com o tu tienda"
            />
            <Field
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              placeholder="••••••••"
              onSubmitEditing={submit}
            />
          </>
        )}

        {mode === 'up' && (
          <>
            <Field label="Tienda" value={store} onChangeText={setStore} autoCorrect={false} placeholder="Nombre de tu tienda" />
            <Field
              label="Correo"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              placeholder="correo@ejemplo.com"
            />
            <Field
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
            <Field
              label="Confirmar contraseña"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              onSubmitEditing={submit}
              style={confirm && confirm !== password ? { borderWidth: 1, borderColor: 'rgba(255,69,58,0.7)' } : undefined}
            />
          </>
        )}

        {mode === 'forgot' && (
          <Field
            label="Correo"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            onSubmitEditing={submit}
          />
        )}

        <Notice kind="error">{error}</Notice>
        <Notice kind="ok">{info}</Notice>

        <PrimaryButton title={cta} onPress={submit} disabled={!canSubmit} />

        {mode === 'in' && <LinkButton label="¿Olvidaste tu contraseña?" onPress={() => go('forgot')} />}
      </Card>

      {mode === 'in' && <LinkButton label="Crear cuenta" onPress={() => go('up')} />}
      {mode === 'up' && <LinkButton label="Ya tengo cuenta" onPress={() => go('in')} />}
      {mode === 'forgot' && <LinkButton label="Volver" onPress={() => go('in')} />}
    </AuthFrame>
  );
}

/** Pantalla para definir la nueva contraseña tras abrir el enlace de recuperación. */
export function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (password.length < MIN_PASSWORD) return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    setBusy(true);
    try {
      await updatePassword(password);
      onDone();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Nueva contraseña">
      <Card style={{ padding: 18 }}>
        <Field
          label="Nueva contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
        />
        <Field
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          onSubmitEditing={submit}
        />
        <Notice kind="error">{error}</Notice>
        <PrimaryButton title={busy ? '...' : 'Guardar'} onPress={submit} disabled={busy || !password || !confirm} />
      </Card>
    </AuthFrame>
  );
}
