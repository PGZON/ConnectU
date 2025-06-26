import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, Slot } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { Image } from 'expo-image';
import { LogOut, User as UserIcon, Users, CheckCircle, MessageCircle, FileText, BarChart2, Megaphone, Cpu, Trophy } from 'lucide-react-native';
import AnimatedLogo from '@/components/AnimatedLogo';

const navItems = [
  { label: 'Dashboard', route: '/admin/dashboard', icon: <BarChart2 color="#fff" size={20} /> },
  { label: 'Users', route: '/admin/users', icon: <Users color="#fff" size={20} /> },
  { label: 'Verifications', route: '/admin/verifications', icon: <CheckCircle color="#fff" size={20} /> },
  { label: 'Queries', route: '/admin/queries', icon: <MessageCircle color="#fff" size={20} /> },
  { label: 'Posts', route: '/admin/posts', icon: <FileText color="#fff" size={20} /> },
  { label: 'Polls', route: '/admin/polls', icon: <BarChart2 color="#fff" size={20} /> },
  { label: 'Announcements', route: '/admin/announcements', icon: <Megaphone color="#fff" size={20} /> },
  { label: 'Logs', route: '/admin/logs', icon: <FileText color="#fff" size={20} /> },
  { label: 'AI Manager', route: '/admin/ai-manager', icon: <Cpu color="#fff" size={20} /> },
];

export default function AdminLayout() {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  if (!user || user.role !== 'admin' || !user.isVerified) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Access denied. You are not authorized to view this page.</Text>
      </View>
    );
  }

  return (
    <View style={styles.layout}>
      <View style={styles.sidebar}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <AnimatedLogo />
        </View>
        <View style={styles.adminInfo}>
          <Image source={{ uri: user?.profileImageUrl }} style={styles.avatar} />
          <Text style={styles.adminName}>{user?.name}</Text>
          <Text style={styles.adminRole}>Superuser</Text>
        </View>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, pathname === item.route && styles.activeNavItem]}
            onPress={() => router.replace(item.route)}
          >
            <View style={styles.iconLabelRow}>
              {item.icon}
              <Text style={[styles.navText, pathname === item.route && styles.activeNavText]}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => useAuthStore.getState().logout()}>
          <View style={styles.iconLabelRow}>
            <LogOut color="#fff" size={20} />
            <Text style={styles.navText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1a2233',
  },
  sidebar: {
    width: 200,
    backgroundColor: '#11182a',
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  adminInfo: {
    alignItems: 'center',
    marginBottom: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  adminName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  adminRole: {
    color: Colors.primary,
    fontSize: 14,
    marginBottom: 8,
  },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  activeNavItem: {
    backgroundColor: Colors.primary,
  },
  navText: {
    color: '#fff',
    fontSize: 16,
  },
  activeNavText: {
    color: '#1a2233',
    fontWeight: 'bold',
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a2233',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
}); 