import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="messages/[id]" 
        options={{ 
          headerShown: true,
          headerTitle: "Chat",
        }} 
      />
      <Stack.Screen 
        name="post/[id]" 
        options={{ 
          headerShown: true,
          headerTitle: "Post Details",
        }} 
      />
      <Stack.Screen 
        name="profile/[id]" 
        options={{ 
          headerShown: true,
          headerTitle: "Profile",
        }} 
      />
      <Stack.Screen 
        name="query/[id]" 
        options={{ 
          headerShown: true,
          headerTitle: "Query Details",
        }} 
      />
      <Stack.Screen 
        name="create-post" 
        options={{ 
          headerShown: true,
          headerTitle: "Create Post",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="ask-query" 
        options={{ 
          headerShown: true,
          headerTitle: "Ask Query",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-profile" 
        options={{ 
          headerShown: true,
          headerTitle: "Edit Profile",
        }} 
      />
    </Stack>
  );
}