import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { API_BASE_URL } from '@/utils/api';

export default function AdminLogs() {
  const { user, token } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.isVerified) {
      setError('Access denied. You are not authorized to view this page.');
      setLoading(false);
      return;
    }
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setLogs(data.data);
        } else {
          setError(data.message || 'Failed to fetch logs');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token, user]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Logs</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.type}</Text>
            <Text style={styles.cell}>{item.message}</Text>
            <Text style={styles.cell}>{item.timestamp}</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Type</Text>
            <Text style={styles.headerCell}>Message</Text>
            <Text style={styles.headerCell}>Timestamp</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2233',
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 4,
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    color: Colors.text,
    textAlign: 'center',
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