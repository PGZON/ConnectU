import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Alert, Animated } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import useConnectionStore from '@/store/connectionStore';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore, transformApiPost } from '@/store/feedStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { MessageCircle, CheckCircle, XCircle, Camera, User, Briefcase, GraduationCap, Users, FileText, HelpCircle, Plus } from 'lucide-react-native';
import { api } from '@/utils/api';
import PostCard from '@/components/PostCard';
import { Post } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const { user: authUser } = useAuthStore();
  const router = useRouter();
  
  const profileId = useMemo(() => id || authUser?._id, [id, authUser]);

  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getConnectionStatus, sendConnectionRequest } = useConnectionStore();
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  
  const { likePost } = useFeedStore();
  const [uploading, setUploading] = useState(false);
  const [profileAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    let isMounted = true;
    async function fetchProfileData() {
      if (!profileId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await api.getUserProfile(profileId);
        if (res.success && res.data) {
          if (isMounted) setUser(res.data);
        } else {
          if (isMounted) setError('User not found');
        }
      } catch (err: any) {
        if (isMounted) setError('User not found');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function fetchUserPosts() {
      if (!profileId) return;
      setPostsLoading(true);
      try {
        const res = await api.getUserPosts(profileId);
        if (res.success && res.data && Array.isArray((res.data as any).posts)) {
          const transformed = (res.data as any).posts.map(transformApiPost);
          console.log('Profile posts:', transformed.map(p => ({ id: p.id, media: p.media })));
          setUserPosts(transformed);
        }
      } catch (e) {
        console.error("Failed to fetch user posts", e);
      } finally {
        if (isMounted) setPostsLoading(false);
      }
    }
    
    fetchProfileData();
    fetchUserPosts();
    
    if (id) {
      setConnectionStatus(getConnectionStatus(id));
    } else {
      setConnectionStatus('accepted');
    }
    
    return () => { isMounted = false; };
  }, [profileId, getConnectionStatus, id]);
  
  // Refetch profile data every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (profileId) {
        // These are defined in the useEffect above
        // But we need to redefine them here for scope
        const fetchProfileData = async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await api.getUserProfile(profileId);
            if (res.success && res.data) {
              setUser(res.data);
            } else {
              setError('User not found');
            }
          } catch (err: any) {
            setError('User not found');
          } finally {
            setLoading(false);
          }
        };
        const fetchUserPosts = async () => {
          setPostsLoading(true);
          try {
            const res = await api.getUserPosts(profileId);
            if (res.success && res.data && Array.isArray((res.data as any).posts)) {
              const transformed = (res.data as any).posts.map(transformApiPost);
              setUserPosts(transformed);
            }
          } catch (e) {
            console.error("Failed to fetch user posts", e);
          } finally {
            setPostsLoading(false);
          }
        };
        fetchProfileData();
        fetchUserPosts();
      }
    }, [profileId])
  );
  
  useEffect(() => {
    Animated.timing(profileAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const handleConnect = () => {
    if (!id) return;
    sendConnectionRequest(id);
    setConnectionStatus('pending');
  };

  const handleMessage = () => {
    if (!id) return;
    router.push(`/messages/${id}`);
  };

  const handleLikePost = (postId: string) => {
    likePost(postId);
    setUserPosts(currentPosts => 
      currentPosts.map(p => {
        if (p.id === postId && authUser) {
          const isLiked = p.likes.includes(authUser._id);
          return {
            ...p,
            likes: isLiked 
              ? p.likes.filter(likeId => likeId !== authUser._id)
              : [...p.likes, authUser._id],
          };
        }
        return p;
      })
    );
  };

  const handleProfileImageChange = async () => {
    try {
      // Ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photo library access to change your profile image.');
        return;
      }
      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      setUploading(true);
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        type: asset.type || 'image/jpeg',
      });
      // Upload to backend
      const uploadRes = await api.uploadProfileImage(formData);
      if (!uploadRes.success) {
        throw new Error(uploadRes.message || 'Failed to upload image');
      }
      // Refresh user and feed
      await fetchProfileData();
      useFeedStore.getState().refreshPosts();
      Alert.alert('Success', 'Profile image updated!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile image');
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard post={item} onLike={() => handleLikePost(item.id)} />
  );

  const ListHeader = () => (
    <Animated.View style={{ opacity: profileAnim, transform: [{ scale: profileAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}>
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <View style={styles.profileImageWrapper}>
            <Image
              source={{ uri: user.profileImageUrl }}
              style={styles.profileImage}
              contentFit="cover"
            />
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={20} color="#fff" />
              </View>
            )}
            {profileId === authUser?._id && (
              <View style={styles.cameraIconContainer}>
                <TouchableOpacity onPress={handleProfileImageChange} disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator size={24} color="#fff" />
                  ) : (
                    <Camera size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.bioBelowName}>{user.bio || 'No bio added yet.'}</Text>
          <Text style={styles.role}>{user.role}</Text>
        </View>
        <View style={styles.statsRowNew}>
          <View style={styles.statPill}><Users size={18} color={Colors.primary} /><Text style={styles.statNumber}>{user.connectionsCount ?? 0}</Text><Text style={styles.statLabel}>Connections</Text></View>
          <View style={styles.statPill}><FileText size={18} color={Colors.primary} /><Text style={styles.statNumber}>{userPosts.length}</Text><Text style={styles.statLabel}>Posts</Text></View>
          <View style={styles.statPill}><HelpCircle size={18} color={Colors.primary} /><Text style={styles.statNumber}>{user.queriesCount ?? 0}</Text><Text style={styles.statLabel}>Queries</Text></View>
        </View>
        <View style={styles.actionsContainerNew}>
          {profileId === authUser?._id ? (
            <>
              <Button title="Edit Profile" onPress={() => router.push('/edit-profile')} style={styles.actionButtonNew} />
              <Button title="Logout" onPress={() => { useAuthStore.getState().logout(); router.replace('/login'); }} variant="danger" style={styles.actionButtonNew} />
            </>
          ) : (
            <>
              {connectionStatus === 'none' && (
                <Button title="Connect" onPress={handleConnect} variant="primary" style={styles.actionButtonNew} />
              )}
              {connectionStatus === 'pending' && (
                <Button title="Request Pending" disabled={true} style={styles.actionButtonNew} />
              )}
              {connectionStatus === 'accepted' && (
                <Button title="Message" onPress={handleMessage} variant="primary" style={styles.actionButtonNew} icon={<MessageCircle size={16} color="#FFFFFF" style={{ marginRight: 8 }} />} />
              )}
            </>
          )}
        </View>
      </LinearGradient>
      {user.role === 'alumni' && user.company && (
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}><Briefcase size={18} color={Colors.primary} />  Experience</Text>
          <Text style={styles.companyName}>{user.company}</Text>
          <Text style={styles.position}>{user.position}</Text>
        </View>
      )}
      {user.role === 'student' && user.department && (
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}><GraduationCap size={18} color={Colors.primary} />  Education</Text>
          <Text style={styles.universityName}>ConnectU University</Text>
          <Text style={styles.degreeName}>{user.department}</Text>
          <Text style={styles.duration}>Graduating {user.graduationYear}</Text>
        </View>
      )}
      <Text style={[styles.sectionTitle, { marginLeft: 16, marginTop: 16 }]}>Posts</Text>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.notFoundContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>{error || 'User not found'}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: user.name }} />
      <FlatList
        style={styles.container}
        data={userPosts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          postsLoading ? <ActivityIndicator style={{ margin: 20 }} /> :
          userPosts.length === 0 ? (
            <View style={{ alignItems: 'center', margin: 40 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>No posts yet</Text>
            </View>
          ) : null
        }
      />
      {profileId === authUser?._id && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-post')}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.fabGradient}>
            <Plus size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.text,
  },
  backButton: {
    marginTop: 16,
    color: Colors.primary,
    fontSize: 16,
  },
  gradientHeader: {
    width: '100%',
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImageWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 70,
    backgroundColor: '#fff',
    padding: 4,
    marginBottom: 8,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.success,
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
  },
  bioBelowName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 280,
    alignSelf: 'center',
  },
  role: {
    fontSize: 16,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  statsRowNew: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 18,
    marginBottom: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  actionsContainerNew: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  actionButtonNew: {
    borderRadius: 24,
    marginHorizontal: 6,
    flex: 1,
    elevation: 2,
  },
  cardSection: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  position: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  duration: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  universityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  degreeName: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    zIndex: 10,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});