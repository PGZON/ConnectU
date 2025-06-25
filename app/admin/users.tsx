import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { API_BASE_URL } from '@/utils/api';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

export default function AdminUsers() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.isVerified) {
      setError('Access denied. You are not authorized to view this page.');
      setLoading(false);
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_BASE_URL}/admin/users`;
        if (roleFilter !== 'all') url += `?role=${roleFilter}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token, user, roleFilter]);

  // Add action handlers
  const handleDeactivate = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to deactivate user');
      setUsers((prev) => prev.map(u => u._id === id ? { ...u, isActive: false } : u));
      alert('User deactivated successfully!');
      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error deactivating user');
    } finally {
      setLoading(false);
    }
  };
  const handleActivate = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/users/${id}/activate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to activate user');
      // Refresh users
      setUsers((prev) => prev.map(u => u._id === id ? { ...u, isActive: true } : u));
    } catch (err: any) {
      setError(err.message || 'Error activating user');
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (user: any) => {
    // TODO: Open edit modal (placeholder)
    alert(`Edit user: ${user.name}`);
  };
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/users/${id}?hard=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete user');
      alert('User permanently deleted!');
      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Filter by Role:</Text>
        <Picker
          selectedValue={roleFilter}
          style={styles.picker}
          onValueChange={setRoleFilter}
        >
          <Picker.Item label="All" value="all" />
          <Picker.Item label="Student" value="student" />
          <Picker.Item label="Alumni" value="alumni" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.email}</Text>
            <Text style={styles.cell}>{item.role}</Text>
            <Text style={styles.cell}>{item.isActive ? 'Active' : 'Inactive'}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => alert(`View user: ${item.name}`)}><Text style={styles.actionText}>View</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(item)}><Text style={styles.actionText}>Edit</Text></TouchableOpacity>
              {item.isActive ? (
                <TouchableOpacity onPress={() => handleDeactivate(item._id)}><Text style={styles.actionText}>Deactivate</Text></TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handleActivate(item._id)}><Text style={styles.actionText}>Activate</Text></TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleDelete(item._id)}><Text style={[styles.actionText, { color: 'red' }]}>Delete</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => alert('Reset password coming soon!')}><Text style={styles.actionText}>Reset Password</Text></TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Name</Text>
            <Text style={styles.headerCell}>Email</Text>
            <Text style={styles.headerCell}>Role</Text>
            <Text style={styles.headerCell}>Status</Text>
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    color: Colors.text,
    marginRight: 8,
  },
  picker: {
    height: 40,
    width: 150,
    color: Colors.text,
    backgroundColor: '#fff',
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
  actions: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionText: {
    color: Colors.primary,
    fontWeight: 'bold',
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