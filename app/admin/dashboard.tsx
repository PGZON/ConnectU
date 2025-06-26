import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

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
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsGradient}
      >
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.cardHighlight]}>
            <Text style={styles.cardTitle}>Total Users</Text>
            <Text style={styles.cardValue}>{stats?.totalUsers}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verified Users</Text>
            <Text style={styles.cardValue}>{stats?.verifiedUsers}</Text>
          </View>
        </View>
        <View style={styles.cardsRow}>
          <View style={styles.card}><Text style={styles.cardTitle}>Queries</Text><Text style={styles.cardValue}>{stats?.totalQueries}</Text></View>
          <View style={styles.card}><Text style={styles.cardTitle}>Posts</Text><Text style={styles.cardValue}>{stats?.totalPosts}</Text></View>
          <View style={styles.card}><Text style={styles.cardTitle}>Polls</Text><Text style={styles.cardValue}>{stats?.totalPolls}</Text></View>
        </View>
      </LinearGradient>
      <Text style={styles.subtitle}>Recent Activity</Text>
      <View style={styles.timeline}>
        {recent.length === 0 && <Text style={styles.empty}>No recent activity.</Text>}
        {recent.map((item, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <MaterialIcons name="history" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.timelineText}>
              {item.summary}
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>  {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</Text>
            </Text>
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
    backgroundColor: Colors.background,
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
  statsGradient: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 12,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 10,
    alignItems: 'center',
    minWidth: 130,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    transition: 'transform 0.2s',
  },
  cardHighlight: {
    backgroundColor: Colors.highlight,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.18,
    elevation: 4,
    transform: [{ scale: 1.04 }],
  },
  cardTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  timeline: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timelineText: {
    color: Colors.text,
    fontSize: 16,
    flex: 1,
  },
  empty: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  error: {
    color: Colors.error,
    fontSize: 16,
  },
}); 