import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import useConnectionStore from '@/store/connectionStore';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore, transformApiPost } from '@/store/feedStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { MessageCircle, CheckCircle, XCircle, Camera } from 'lucide-react-native';
import { api } from '@/utils/api';
import PostCard from '@/components/PostCard';
import { Post } from '@/types';

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

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard post={item} onLike={() => handleLikePost(item.id)} />
  );

  const ListHeader = () => (
    <>
      <View style={styles.header}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: user.profileImageUrl }}
            style={styles.profileImage}
            contentFit="cover"
          />
          {profileId === authUser?._id && (
            <View style={styles.cameraIconContainer}>
              <TouchableOpacity>
                <Camera size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
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
            </>
          )}
        </View>
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
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.connectionsCount ?? 0}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.queriesCount ?? 0}</Text>
            <Text style={styles.statLabel}>Queries</Text>
          </View>
        </View>
        
        {profileId === authUser?._id ? (
          <>
            <Button title="Edit Profile" onPress={() => router.push('/edit-profile')} style={{ marginTop: 12 }} />
            <Button title="Logout" onPress={() => { useAuthStore.getState().logout(); router.replace('/login'); }} variant="danger" style={{ marginTop: 8 }} />
          </>
        ) : (
          <View style={styles.actionsContainer}>
            {connectionStatus === 'none' && (
              <Button
                title="Connect"
                onPress={handleConnect}
                variant="primary"
                style={styles.actionButton}
              />
            )}
            
            {connectionStatus === 'pending' && (
              <Button
                title="Request Pending"
                disabled={true}
                style={styles.actionButton}
              />
            )}
            
            {connectionStatus === 'accepted' && (
              <Button
                title="Message"
                onPress={handleMessage}
                variant="primary"
                style={styles.actionButton}
                icon={<MessageCircle size={16} color="#FFFFFF" style={{ marginRight: 8 }} />}
              />
            )}
          </View>
        )}
      </View>
      
      <View style={styles.bioSection}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <Text style={styles.bioText}>{user.bio || 'No bio added yet.'}</Text>
      </View>
      
      {user.role === 'alumni' && user.company && (
        <View style={styles.experienceSection}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <View style={styles.experienceItem}>
            <Text style={styles.companyName}>{user.company}</Text>
            <Text style={styles.position}>{user.position}</Text>
          </View>
        </View>
      )}
      
      {user.role === 'student' && user.department && (
        <View style={styles.educationSection}>
          <Text style={styles.sectionTitle}>Education</Text>
          <View style={styles.educationItem}>
            <Text style={styles.universityName}>ConnectU University</Text>
            <Text style={styles.degreeName}>{user.department}</Text>
            <Text style={styles.duration}>Graduating {user.graduationYear}</Text>
          </View>
        </View>
      )}
      <Text style={[styles.sectionTitle, { marginLeft: 16, marginTop: 16 }]}>Posts</Text>
    </>
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
        ListFooterComponent={postsLoading ? <ActivityIndicator style={{ margin: 20 }} /> : null}
      />
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
  header: {
    backgroundColor: Colors.card,
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
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
  verifiedText: {
    color: Colors.success,
    fontWeight: '500',
  },
  notVerifiedText: {
    color: Colors.error,
    fontWeight: '500',
  },
  role: {
    fontSize: 16,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  details: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  statBox: {
    alignItems: 'center',
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
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  bioSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 8,
  },
  bioText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  experienceSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 8,
  },
  experienceItem: {
    marginBottom: 8,
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
  educationSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 8,
  },
  educationItem: {
    marginBottom: 8,
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
});