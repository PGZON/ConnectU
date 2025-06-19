import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthWrapper } from '@/components/AuthWrapper';
import ResetPasswordScreen from './reset-password';

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Check for existing authentication on app startup
    checkAuth();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthWrapper>
          <RootLayoutNav />
        </AuthWrapper>
      </GestureHandlerRootView>
    </>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="create-post" />
      <Stack.Screen name="ask-query" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="query/[id]" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="messages/[id]" />
      <Stack.Screen name="reset-password" element={<ResetPasswordScreen />} />
    </Stack>
  );
}