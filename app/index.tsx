import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  
  // For demo purposes, we'll redirect to the main app
  // In a real app, check authentication status
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/login"} />;
}