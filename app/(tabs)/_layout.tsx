import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import { MessageCircle, Home, Users, User, BookOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMessageStore } from '@/store/messageStore';
import useConnectionStore from '@/store/connectionStore';
import { useAuthStore } from '@/store/authStore';
import { Platform, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import AnimatedLogo from '@/components/AnimatedLogo';
import { useFonts } from 'expo-font';

const ProfileTabIcon = ({ color, size }: { color: string, size: number }) => {
  const { user } = useAuthStore();

  if (user?.profileImageUrl) {
    return (
      <Image
        source={{ uri: user.profileImageUrl }}
        style={[styles.profileIcon, { borderColor: color }]}
      />
    );
  }
  return <User size={size} color={color} />;
};

export default function TabLayout() {
  const { user, isLoading } = useAuthStore();
  const { fetchConnections, receivedRequests } = useConnectionStore();
  const { getTotalUnreadCount } = useMessageStore();
  
  const [fontsLoaded] = useFonts({
    'Pacifico-Regular': require('../../assets/fonts/Pacifico-Regular.ttf'),
  });

  console.log('--- [app/(tabs)/_layout.tsx] TabLayout Render ---');
  console.log(`isLoading: ${isLoading}`);
  console.log(`User object: ${JSON.stringify(user, null, 2)}`);
  console.log('--------------------------------------------');

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user, fetchConnections]);

  if (isLoading || !fontsLoaded) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
  }

  const requestCount = receivedRequests.length;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.inactive,
        tabBarStyle: {
          borderTopColor: Colors.border,
        },
        headerStyle: {
          backgroundColor: Colors.card,
        },
        headerTitleStyle: {
          color: Colors.text,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <AnimatedLogo />,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          tabBarBadge: requestCount > 0 ? requestCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.secondary },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MessageCircle size={size} color={color} />
              {getTotalUnreadCount() > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -4,
                  backgroundColor: Colors.secondary,
                  borderRadius: 10,
                  width: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}>
                    {getTotalUnreadCount() > 9 ? '9+' : getTotalUnreadCount()}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="queries"
        options={{
          title: 'Queries',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileTabIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
});