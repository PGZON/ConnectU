import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) {
      console.log('AuthWrapper - showing loading state');
      return;
    }

    const currentRoute = segments[0];
    console.log('AuthWrapper - isAuthenticated:', isAuthenticated, 'currentRoute:', currentRoute, 'isLoading:', isLoading);

    const publicRoutes = ['login', 'signup'];
    const isPublicRoute = publicRoutes.includes(currentRoute);

    if (!isAuthenticated && !isPublicRoute) {
      console.log('Redirecting to login - user not authenticated');
      router.replace('/login');
    } else if (isAuthenticated && isPublicRoute) {
      console.log('Redirecting to tabs - user authenticated');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  if (isLoading) {
    // You can show a loading screen here
    console.log('AuthWrapper - showing loading state');
    return null;
  }

  return <>{children}</>;
} 