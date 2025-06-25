import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    console.log('Index page - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    
    // Only redirect if we're not loading and we have a definitive auth state
    if (!isLoading) {
      const user = useAuthStore.getState().user;
      if (isAuthenticated && user) {
        if (user.role === 'admin' && user.isVerified) {
          console.log('Index - redirecting to admin dashboard');
          router.replace('/admin/dashboard');
        } else {
          console.log('Index - redirecting to tabs');
          router.replace('/(tabs)');
        }
      } else {
        console.log('Index - redirecting to login');
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
        Loading ConnectU...
      </Text>
    </View>
  );
}