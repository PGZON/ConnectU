import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { socketService } from '@/utils/socket';
import { useMessageStore } from '@/store/messageStore';

const InitialLayout = () => {
  const { user, isLoading, checkAuthState } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  console.log('--- [app/_layout.tsx] InitialLayout Render ---');
  console.log(`isLoading: ${isLoading}`);
  console.log(`User object: ${JSON.stringify(user, null, 2)}`);
  console.log('------------------------------------------');

  useEffect(() => {
    console.log('[app/_layout.tsx] Calling checkAuthState');
    checkAuthState();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Wait until loading is complete

    const inAuthScreens = segments.includes('login') || segments.includes('signup');

    if (user) {
      // User is logged IN.
      // 1. Set up socket listeners.
      const socket = socketService.getSocket();
      if (socket) {
        socket.on('connect', () => {
          console.log('RootLayout: Socket connected/reconnected. Initializing stores...');
          useMessageStore.getState().initialize();
        });
      }
      
      // 2. If user is on a login/signup page, redirect them to the main app.
      if (inAuthScreens) {
        router.replace('/(tabs)');
      }
    } else {
      // User is logged OUT.
      // If they are on any screen that IS NOT login/signup, redirect them.
      if (!inAuthScreens) {
        router.replace('/login');
      }
    }
  }, [user, segments, isLoading, router]);
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <InitialLayout />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}