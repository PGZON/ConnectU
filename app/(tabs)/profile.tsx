import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import useConnectionStore from '@/store/connectionStore';
import { useQueryStore } from '@/store/queryStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Camera, LogOut, Edit2, CheckCircle, XCircle, Users, FileText, HelpCircle, Edit } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import PostCard from '@/components/PostCard';
import { transformApiPost } from '@/store/feedStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import { API_BASE_URL } from '@/utils/api';
import { User } from '@/types';
import { Post } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import { useMessageStore } from '@/store/messageStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, isLoading: authLoading, checkAuthState, logout } = useAuthStore();
  const { connections, fetchConnections } = useConnectionStore();
  const { userQueries, fetchQueriesForUser } = useQueryStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const fetchUserPosts = useCallback(async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      const res = await api.getUserPosts(user.id);
      if (res.success && res.data && res.data.posts) {
        setPosts(res.data.posts.map(transformApiPost));
      } else {
        setPosts([]);
      }
    } catch (err) {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchQueriesForUser(user.id);
      fetchUserPosts();
    } else {
      checkAuthState();
    }
  }, [user, checkAuthState, fetchConnections, fetchQueriesForUser, fetchUserPosts]);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await Promise.all([
      checkAuthState(),
      fetchConnections(),
      fetchQueriesForUser(user.id),
      fetchUserPosts()
    ]);
    setRefreshing(false);
  }, [user, checkAuthState, fetchConnections, fetchQueriesForUser, fetchUserPosts]);

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };
  
  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);
      setUploading(true);
      setProgress(0);
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/users/upload/profile-image`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.onload = async () => {
          setUploading(false);
          setProgress(100);
          if (xhr.status >= 200 && xhr.status < 300) {
            Alert.alert('Success', 'Profile image updated!');
            if (checkAuthState) checkAuthState();
            try {
              useFeedStore.getState().refreshPosts();
            } catch {}
            try {
              useConnectionStore.getState().fetchAllUsers();
            } catch {}
            try {
              if (user?.id) useMessageStore.getState().fetchMessages(user.id);
            } catch {}
          } else {
            console.log('Upload failed:', xhr.status, xhr.responseText);
            Alert.alert('Error', 'Failed to update profile image.');
          }
        };
        xhr.onerror = () => {
          setUploading(false);
          console.log('XHR error:', xhr.status, xhr.responseText);
          Alert.alert('Error', 'Failed to upload image.');
        };
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
            console.log('Upload progress:', percent);
          }
        };
        xhr.send(formData);
      } catch (error) {
        setUploading(false);
        Alert.alert('Error', 'Failed to upload image.');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logout(), style: 'destructive' },
      ]
    );
  };

  const handleVerify = async () => {
    setVerificationLoading(true);
    setVerificationMessage(null);
    try {
      setVerificationMessage('Verification not implemented.');
    } catch (error: any) {
      setVerificationMessage('Verification failed.');
    } finally {
      setVerificationLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const connectionsCount = connections.length;
  const postsCount = posts.length;
  const queriesCount = userQueries.length;
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity onPress={handlePickImage} style={styles.profileImageContainer}>
          <Image
            source={{ uri: user.profileImageUrl }}
            style={styles.profileImage}
            contentFit="cover"
          />
          <View style={styles.cameraIcon}>
            <Camera size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {!user.isVerified && (
          <View style={styles.verificationContainer}>
            <XCircle size={20} color={Colors.danger} />
            <Text style={styles.verificationText}>Not Verified</Text>
            <Button title="Verify Now" onPress={handleVerify} size="small" loading={verificationLoading} />
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{connectionsCount}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{queriesCount}</Text>
            <Text style={styles.statLabel}>Queries</Text>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.bioTitle}>Bio</Text>
          <Text style={styles.bioText}>{user.bio || 'No bio added yet.'}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <Button title="Edit Profile" onPress={handleEditProfile} icon={<Edit size={16} color="#fff" />} />
          <Button title="Logout" onPress={handleLogout} variant="danger" icon={<LogOut size={16} color="#fff" />} />
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.postsTitle}>My Posts</Text>
          {postsLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
          ) : posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <Text style={styles.noPostsText}>You haven't made any posts yet.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  role: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  verificationText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  bioContainer: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    marginBottom: 20,
  },
  postsSection: {
    marginTop: 10,
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  noPostsText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});