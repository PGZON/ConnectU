import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import useConnectionStore from '@/store/connectionStore';
import { useQueryStore } from '@/store/queryStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Camera, LogOut, Edit2, CheckCircle, XCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import PostCard from '@/components/PostCard';
import { transformApiPost } from '@/store/feedStore';

export default function ProfileScreen() {
  const { user, isLoading: authLoading, checkAuthState, logout } = useAuthStore();
  const { connections, fetchConnections, isLoading: connLoading } = useConnectionStore();
  const { userQueries, fetchQueriesForUser, isLoading: queriesLoading } = useQueryStore();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // This is the critical fix. Do not render anything until the user is loaded.
  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Fetch user posts
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

  // Initial fetch
  useEffect(() => {
    if (!user) {
      checkAuthState();
      return;
    }
    fetchConnections();
    fetchQueriesForUser(user.id);
    fetchUserPosts();
  }, [user, checkAuthState, fetchConnections, fetchQueriesForUser, fetchUserPosts]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkAuthState();
    await fetchConnections();
    await fetchQueriesForUser(user?.id);
    await fetchUserPosts();
    setRefreshing(false);
  }, [checkAuthState, fetchConnections, fetchQueriesForUser, fetchUserPosts, user?.id]);

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
      // TODO: Implement backend upload and update
      Alert.alert('Not implemented', 'Profile image update is not implemented yet.');
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
      // TODO: Implement verification API call
      setVerificationMessage('Verification not implemented.');
    } catch (error: any) {
      setVerificationMessage('Verification failed.');
    } finally {
      setVerificationLoading(false);
    }
  };

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.error }}>{error}</Text>
        <Button title="Retry" onPress={onRefresh} />
      </View>
    );
  }

  // Stats
  const connectionsCount = connections.length;
  const postsCount = posts.length;
  const queriesCount = userQueries.filter(q => q.studentId === user.id).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: user.profileImageUrl }}
            style={styles.profileImage}
            contentFit="cover"
          />
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={handlePickImage}
          >
            <Camera size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {user.isVerified ? (
            <>
              <CheckCircle size={18} color={Colors.success} style={{ marginRight: 4 }} />
              <Text style={styles.verifiedText}>Verified</Text>
            </>
          ) : (
            <>
              <XCircle size={18} color={Colors.error} style={{ marginRight: 4 }} />
              <Text style={styles.notVerifiedText}>Not Verified</Text>
              <Button
                title={verificationLoading ? 'Verifying...' : 'Verify Now'}
                onPress={handleVerify}
                disabled={verificationLoading}
                style={{ marginLeft: 8 }}
                small
              />
            </>
          )}
        </View>
        {verificationMessage && (
          <Text style={{ color: user.isVerified ? Colors.success : Colors.error, marginBottom: 8 }}>{verificationMessage}</Text>
        )}
        <Text style={styles.role}>{user.role}</Text>
        {user.role === 'student' && (
          <Text style={styles.details}>
            {user.department}, Class of {user.graduationYear}
          </Text>
        )}
        {user.role === 'alumni' && (
          <Text style={styles.details}>
            {user.position} at {user.company}
          </Text>
        )}
      </View>
      <View style={styles.bioSection}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <Text style={styles.bioText}>{user.bio || 'No bio added yet.'}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <Button
          title="Edit Profile"
          onPress={handleEditProfile}
          variant="outline"
          fullWidth
          style={styles.actionButton}
          textStyle={styles.actionButtonText}
          icon={<Edit2 size={16} color={Colors.primary} style={{ marginRight: 8 }} />}
        />
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={[styles.actionButton, styles.logoutButton]}
          textStyle={[styles.actionButtonText, styles.logoutButtonText]}
          icon={<LogOut size={16} color={Colors.error} style={{ marginRight: 8 }} />}
        />
      </View>
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{connectionsCount}</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{postsCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{queriesCount}</Text>
          <Text style={styles.statLabel}>Queries</Text>
        </View>
      </View>
      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>My Posts</Text>
        {postsLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 16 }} />
        ) : posts.length === 0 ? (
          <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 16 }}>No posts yet.</Text>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <PostCard post={item} />}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.card,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: Colors.text,
  },
  bioSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: '600',
  },
  logoutButton: {
    borderColor: Colors.error,
  },
  logoutButtonText: {
    color: Colors.error,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  verifiedText: {
    color: Colors.success,
    fontWeight: '600',
    marginRight: 8,
  },
  notVerifiedText: {
    color: Colors.error,
    fontWeight: '600',
    marginRight: 8,
  },
  postsSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
});