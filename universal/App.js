import React, { useEffect, useMemo, useState } from 'react';
import { View, useColorScheme, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePOSStore } from './src/data/usePOSStore';
import { SupabasePOSRepository } from './src/data/SupabasePOSRepository';
import { supabase } from './src/data/supabaseClient';
import { getMyStoreId, signOut } from './src/data/authService';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import { Glass, Tap, FadeIn, Txt } from './src/ui/kit';
import { POSScreen } from './src/screens/POSScreen';
import { InventarioScreen } from './src/screens/InventarioScreen';
import { HistorialScreen } from './src/screens/HistorialScreen';
import { ResumenScreen } from './src/screens/ResumenScreen';
import { AuthScreen, ResetPasswordScreen } from './src/screens/AuthScreen';
import { CheckoutSheet } from './src/sheets/CheckoutSheet';
import { ProductSheet } from './src/sheets/ProductSheet';
import { CreateSheet } from './src/sheets/CreateSheet';
import { TopMenu, SuppliersSheet } from './src/sheets/TopMenu';
import { DesktopSidebar } from './src/components/DesktopSidebar';

// En entorno Web, garantizamos que html, body y #root ocupen el 100% de la altura de la pantalla
// para evitar que la aplicación se colapse hacia arriba o deje un espacio vacío gigante debajo.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'sebas-pos-fullscreen-fix';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      html, body {
        height: 100% !important;
        min-height: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: #000000 !important;
        overflow: hidden !important;
      }
      #root {
        display: flex !important;
        flex: 1 !important;
        height: 100% !important;
        min-height: 100% !important;
        width: 100% !important;
        overflow: hidden !important;
        background-color: #000000 !important;
      }
    `;
    document.head.appendChild(style);
  }
}

const TABS = [
  ['resumen', 'Resumen', 'pie-chart'],
  ['vender', 'Vender', 'cart'],
  ['inventario', 'Inventario', 'cube'],
  ['historial', 'Historial', 'time'],
];

/** Ancho máximo de la columna de la app en pantallas grandes (escritorio / tablet). */
export const MAX_COLUMN = 760;

function TabBar({ tab, onChange, badge }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) }}>
      <Glass radius={30} intensity={80} style={{ flexDirection: 'row', padding: 6 }}>
        {TABS.map(([id, label, icon]) => {
          const active = tab === id;
          return (
            <Tap key={id} onPress={() => onChange(id)} hapticKind="select" style={{ flex: 1 }}>
              <View style={{ alignItems: 'center', paddingVertical: 8, borderRadius: 24, backgroundColor: active ? t.card2 : 'transparent' }}>
                <View>
                  <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? t.blue : t.text2} />
                  {id === 'vender' && badge > 0 && (
                    <View style={{ position: 'absolute', top: -4, right: -10, backgroundColor: t.red, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge}</Txt>
                    </View>
                  )}
                </View>
                <Txt style={{ fontSize: 10, marginTop: 2, color: active ? t.blue : t.text2, fontWeight: '600' }}>{label}</Txt>
              </View>
            </Tap>
          );
        })}
      </Glass>
    </View>
  );
}

function Shell({ store, onSignOut }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [tab, setTab] = useState('vender');
  const [checkout, setCheckout] = useState(false);
  const [productId, setProductId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const menu = <TopMenu store={store} onSignOut={onSignOut} />;

  return (
    <View style={[{ flex: 1, backgroundColor: t.bg }, Platform.OS === 'web' ? { height: '100%', width: '100%' } : null]}>
      <StatusBar style={t.tint === 'dark' ? 'light' : 'dark'} />
      {isDesktop ? (
        <View style={{ flex: 1, flexDirection: 'row', height: '100%', width: '100%' }}>
          <DesktopSidebar
            tab={tab}
            onChange={setTab}
            badge={store.totalCartUnits}
            store={store}
            onSignOut={onSignOut}
            onOpenSuppliers={() => setSuppliersOpen(true)}
          />
          <View style={{ flex: 1, backgroundColor: t.bg, height: '100%' }}>
            {tab === 'resumen' && <ResumenScreen store={store} isDesktop={true} />}
            {tab === 'vender' && (
              <POSScreen store={store} isDesktop={true} onCheckout={() => setCheckout(true)} />
            )}
            {tab === 'inventario' && (
              <InventarioScreen
                store={store}
                isDesktop={true}
                onOpen={setProductId}
                onCreate={() => setCreating(true)}
              />
            )}
            {tab === 'historial' && <HistorialScreen store={store} isDesktop={true} />}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', height: '100%', width: '100%' }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 600, backgroundColor: t.bg, height: '100%' }}>
            <FadeIn key={tab} style={{ flex: 1, height: '100%' }}>
              {tab === 'resumen' && (
                <ResumenScreen
                  store={store}
                  isDesktop={false}
                  headerRight={menu}
                  onGoToPOS={() => setTab('vender')}
                />
              )}
              {tab === 'vender' && (
                <POSScreen store={store} isDesktop={false} onCheckout={() => setCheckout(true)} headerRight={menu} />
              )}
              {tab === 'inventario' && (
                <InventarioScreen
                  store={store}
                  isDesktop={false}
                  onOpen={setProductId}
                  onCreate={() => setCreating(true)}
                  headerRight={menu}
                  onGoToPOS={() => setTab('vender')}
                />
              )}
              {tab === 'historial' && (
                <HistorialScreen
                  store={store}
                  isDesktop={false}
                  headerRight={menu}
                  onGoToPOS={() => setTab('vender')}
                />
              )}
            </FadeIn>
            <TabBar tab={tab} onChange={setTab} badge={store.totalCartUnits} />
          </View>
        </View>
      )}

      {/* Sheets modales */}
      <CheckoutSheet visible={checkout && store.cart.length > 0} onClose={() => setCheckout(false)} store={store} />
      <ProductSheet productId={productId} onClose={() => setProductId(null)} store={store} />
      <CreateSheet visible={creating} onClose={() => setCreating(false)} store={store} />
      <SuppliersSheet visible={suppliersOpen} onClose={() => setSuppliersOpen(false)} store={store} />
    </View>
  );
}

/** Aplica el store del repositorio activo de la tienda en Supabase. */
function POSApp({ repository, onSignOut, scheme }) {
  const store = usePOSStore(repository);
  if (!store.ready) return <Splash />;
  return (
    <ThemeProvider mode={store.themeMode} systemScheme={scheme}>
      <View style={[{ flex: 1, backgroundColor: '#000000' }, Platform.OS === 'web' ? { height: '100%', width: '100%' } : null]}>
        <Shell store={store} onSignOut={onSignOut} />
      </View>
    </ThemeProvider>
  );
}

const Splash = () => (
  <View style={[{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }, Platform.OS === 'web' ? { height: '100vh', width: '100%' } : null]}>
    <ActivityIndicator size="large" color="#0A84FF" />
  </View>
);

function Root() {
  const scheme = useColorScheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  // true cuando el usuario abrió el enlace de recuperación y debe definir una nueva contraseña
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Verificación inicial de sesión usando supabase.auth.getSession()
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('Error verificando sesión inicial:', error.message);
        }
        setSession(initialSession);
        if (initialSession?.user) {
          const id = await getMyStoreId(initialSession.user.id);
          if (isMounted) {
            setStoreId(id);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Fallo en getSession:', err);
        if (isMounted) setLoading(false);
      });

    // 2. Listener en tiempo real con supabase.auth.onAuthStateChange()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(newSession);
      if (newSession?.user) {
        setLoading(true);
        const id = await getMyStoreId(newSession.user.id);
        if (isMounted) {
          setStoreId(id);
          setLoading(false);
        }
      } else {
        setStoreId(null);
        setLoading(false);
      }
    });

    // Limpieza de suscripciones para evitar fugas de memoria
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const repository = useMemo(() => {
    return storeId ? new SupabasePOSRepository(supabase, storeId) : null;
  }, [storeId]);

  const handleSignOut = async () => {
    setLoading(true);
    await repository?.clearLocal?.();
    await signOut();
    setSession(null);
    setStoreId(null);
    setLoading(false);
  };

  // 3. Indicador de carga mientras se verifica la sesión o se resuelve la tienda
  if (loading) {
    return <Splash />;
  }

  // Enlace de recuperación abierto: definir nueva contraseña antes de entrar
  if (recovery && session) {
    return (
      <ThemeProvider mode="system" systemScheme={scheme}>
        <ResetPasswordScreen onDone={() => setRecovery(false)} />
      </ThemeProvider>
    );
  }

  // 4. Si NO hay una sesión activa, renderiza obligatoriamente <AuthScreen />
  if (!session) {
    return (
      <ThemeProvider mode="system" systemScheme={scheme}>
        <AuthScreen />
      </ThemeProvider>
    );
  }

  // Si hay sesión pero aún se prepara el repositorio de la tienda
  if (!repository) {
    return <Splash />;
  }

  // 5. Si SÍ hay una sesión activa, renderiza el componente principal de la aplicación POS
  return (
    <View style={[{ flex: 1, backgroundColor: '#000000' }, Platform.OS === 'web' ? { height: '100%', width: '100%' } : null]}>
      <POSApp
        key={storeId}
        repository={repository}
        scheme={scheme}
        onSignOut={handleSignOut}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={[{ flex: 1, backgroundColor: '#000000' }, Platform.OS === 'web' ? { height: '100vh', width: '100vw' } : null]}>
      <Root />
    </SafeAreaProvider>
  );
}
