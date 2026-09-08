import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import type { NotificationResponse } from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DemoProvider } from '@/stores/demo-store';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query/client';
import { AuthProvider, useAuth } from '@/stores/auth-store';
import { AuthScreen } from '@/components/auth-screen';
import { registerForPushNotificationsAsync } from '@/lib/notifications/register';
import { persistPushToken } from '@/lib/supabase/repositories';
import { colors } from '@/design/tokens';

export default function RootLayout() {
  return <SafeAreaProvider><QueryClientProvider client={queryClient}><AuthProvider><DemoProvider><StatusBar style="light" /><RootNavigator /></DemoProvider></AuthProvider></QueryClientProvider></SafeAreaProvider>;
}

function RootNavigator() { const { loading, session, demoMode } = useAuth(); const router = useRouter(); const pathname = usePathname(); useEffect(() => { if (Platform.OS === 'web') return; let cancelled = false; let subscription: { remove: () => void } | undefined; void import('expo-notifications').then((notifications) => { if (cancelled) return; const openFromNotification = (response: NotificationResponse) => { const route = response.notification.request.content.data?.route; if (typeof route === 'string') router.push(route as any); }; subscription = notifications.addNotificationResponseReceivedListener(openFromNotification); void notifications.getLastNotificationResponseAsync().then((response) => { if (!cancelled && response) openFromNotification(response); }); }); return () => { cancelled = true; subscription?.remove(); }; }, [router]); useEffect(() => { if (Platform.OS === 'web' || demoMode || !session) return; let cancelled = false; void registerForPushNotificationsAsync({ requestPermission: false }).then((token) => { if (!cancelled && token) void persistPushToken(token).catch(() => undefined); }).catch(() => undefined); return () => { cancelled = true; }; }, [demoMode, session]); const publicRoute = pathname === '/auth/callback' || pathname.startsWith('/add/'); if (loading) return <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.ink} /></View>; if (!demoMode && !session && !publicRoute) return <AuthScreen />; return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />; }
