import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

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
    const inAuthGroup = segments[0] === '(auth)';

    if (isLoading) return; // Wait until loading is false

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
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