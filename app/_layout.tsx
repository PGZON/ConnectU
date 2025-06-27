import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { socketService } from '@/utils/socket';
import { useMessageStore } from '@/store/messageStore';
import Colors from '@/constants/colors';
import CustomSplashScreen from '@/components/CustomSplashScreen';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { user, isLoading, checkAuthState } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  console.log('--- [app/_layout.tsx] InitialLayout Render ---');
  console.log(`isLoading: ${isLoading}`);
  console.log(`User object: ${JSON.stringify(user, null, 2)}`);
  console.log('------------------------------------------');

  useEffect(() => {
    console.log('[app/_layout.tsx] Calling checkAuthState');
    checkAuthState();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthScreens = segments.includes('login') || segments.includes('signup');

    if (user) {
      // User is logged in, set up socket connection
      const socket = socketService.getSocket();
      if (socket) {
        socket.on('connect', () => {
          console.log('RootLayout: Socket connected. Initializing stores...');
          useMessageStore.getState().initialize();
        });
      }

      // If user is on an auth screen, redirect them away
      if (inAuthScreens) {
        if (user.role === 'admin' && user.isVerified) {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/(tabs)');
        }
      }
    } else {
      // User is not logged in
      // If user is in a protected area, redirect to login
      if (!inAuthScreens) {
        router.replace('/login');
      }
    }
  }, [user, segments, isLoading, router]);

  if (isLoading || !splashDone) {
    return <CustomSplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="messages/[id]" options={{
             headerBackTitleVisible: false,
             headerTitleStyle: { color: Colors.text },
             headerStyle: { backgroundColor: Colors.card },
             headerTintColor: Colors.primary,
          }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}