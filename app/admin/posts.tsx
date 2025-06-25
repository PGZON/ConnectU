import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { API_BASE_URL } from '@/utils/api';

export default function AdminPosts() {
  const { user, token } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editPost, setEditPost] = useState<any>(null);
  const [editCaption, setEditCaption] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      } else {
        setError(data.message || 'Failed to fetch posts');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.isVerified) {
      setError('Access denied. You are not authorized to view this page.');
      setLoading(false);
      return;
    }
    fetchPosts();
    // eslint-disable-next-line
  }, [token, user]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        setError(data.message || 'Failed to delete post');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting post');
    }
  };

  const openEditModal = (post: any) => {
    setEditPost(post);
    setEditCaption(post.caption);
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!editPost) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/posts/${editPost._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption: editCaption }),
      });
      const data = await res.json();
      if (data.success) {
        setEditModal(false);
        setEditPost(null);
        setEditCaption('');
        fetchPosts();
      } else {
        setError(data.message || 'Failed to update post');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating post');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post Manager</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.caption}</Text>
            <Text style={styles.cell}>{item.author?.name || 'Unknown'}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEditModal(item)}><Text style={styles.actionText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item._id)}><Text style={styles.actionText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Caption</Text>
            <Text style={styles.headerCell}>Author</Text>
            <Text style={styles.headerCell}>Actions</Text>
          </View>
        )}
      />
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Post</Text>
            <TextInput
              style={styles.input}
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Edit caption"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEdit}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actions: {
    flex: 1,
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    width: 300,
  },
  input: {
    height: 40,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    flex: 1,
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
}); 