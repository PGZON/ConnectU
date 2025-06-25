import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/utils/api';

export default function AdminDashboard() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.isVerified) {
      setError('Access denied. You are not authorized to view this page.');
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
          setRecent(data.data.recentActivity || []);
        } else {
          setError(data.message || 'Failed to fetch stats');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token, user]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <View style={styles.cardsRow}>
        <View style={styles.card}><Text style={styles.cardTitle}>Total Users</Text><Text style={styles.cardValue}>{stats?.totalUsers}</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Verified Users</Text><Text style={styles.cardValue}>{stats?.verifiedUsers}</Text></View>
      </View>
      <View style={styles.cardsRow}>
        <View style={styles.card}><Text style={styles.cardTitle}>Queries</Text><Text style={styles.cardValue}>{stats?.totalQueries}</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Posts</Text><Text style={styles.cardValue}>{stats?.totalPosts}</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Polls</Text><Text style={styles.cardValue}>{stats?.totalPolls}</Text></View>
      </View>
      <Text style={styles.subtitle}>Recent Activity</Text>
      <View style={styles.timeline}>
        {recent.length === 0 && <Text style={styles.empty}>No recent activity.</Text>}
        {recent.map((item, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <Text style={styles.timelineText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#1a2233',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a2233',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 24,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  timeline: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  timelineItem: {
    marginBottom: 8,
  },
  timelineText: {
    color: Colors.text,
    fontSize: 15,
  },
  empty: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
}); 