import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { API_BASE_URL } from '@/utils/api';

export default function AdminVerifications() {
  const { user, token } = useAuthStore();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.isVerified) {
      setError('Access denied. You are not authorized to view this page.');
      setLoading(false);
      return;
    }
    const fetchPending = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/verifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setPending(data.data);
        } else {
          setError(data.message || 'Failed to fetch verifications');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching verifications');
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [token, user]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    // TODO: Call backend to approve/reject with note
    // Refresh list after action
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Verifications</Text>
      <FlatList
        data={pending}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.email}</Text>
            <Text style={styles.cell}>{item.role}</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add note (optional)"
              value={note}
              onChangeText={setNote}
            />
            <TouchableOpacity onPress={() => handleAction(item._id, 'approve')}><Text style={styles.actionApprove}>Approve</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleAction(item._id, 'reject')}><Text style={styles.actionReject}>Reject</Text></TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Name</Text>
            <Text style={styles.headerCell}>Email</Text>
            <Text style={styles.headerCell}>Role</Text>
            <Text style={styles.headerCell}>Note</Text>
            <Text style={styles.headerCell}>Actions</Text>
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
  noteInput: {
    flex: 2,
    height: 36,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    marginHorizontal: 4,
  },
  actionApprove: {
    color: 'green',
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  actionReject: {
    color: 'red',
    fontWeight: 'bold',
    marginHorizontal: 4,
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