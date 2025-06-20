import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useConnectionStore } from '@/store/connectionStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { MessageCircle, CheckCircle, XCircle, Camera } from 'lucide-react-native';
import { api } from '@/utils/api';
import PostCard from '@/components/PostCard';

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getConnectionStatus, sendConnectionRequest } = useConnectionStore();
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const isOwnProfile = !id;

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (id) {
          res = await api.getUserProfile(id);
        } else {
          res = await api.getMe();
        }
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
    async function fetchPosts() {
      setPostsLoading(true);
      try {
        const userId = id || user?.id;
        if (userId) {
          const res = await api.getUserPosts(userId);
          if (res.success && res.data && res.data.posts) {
            setPosts(res.data.posts);
          } else {
            setPosts([]);
          }
        }
      } catch {
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    }
    fetchUser();
    if (id) {
      setConnectionStatus(getConnectionStatus(id));
    } else {
      setConnectionStatus('accepted');
    }
    return () => { isMounted = false; };
  }, [id, getConnectionStatus]);

  useEffect(() => {
    if (user) {
      const userId = id || user.id;
      if (userId) {
        setPostsLoading(true);
        api.getUserPosts(userId).then(res => {
          if (res.success && res.data && res.data.posts) {
            setPosts(res.data.posts);
          } else {
            setPosts([]);
          }
          setPostsLoading(false);
        }).catch(() => {
          setPosts([]);
          setPostsLoading(false);
        });
      }
    }
  }, [user, id]);

  const handleConnect = () => {
    if (!id) return;
    sendConnectionRequest(id);
    setConnectionStatus('pending');
  };

  const handleMessage = () => {
    if (!id) return;
    router.push(`/messages/${id}`);
  };

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
        <Text style={styles.notFoundText}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: user.name }} />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: user.profileImageUrl }}
              style={styles.profileImage}
              contentFit="cover"
            />
            {isOwnProfile && (
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
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{user.connectionsCount ?? 0}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{user.queriesCount ?? 0}</Text>
              <Text style={styles.statLabel}>Queries</Text>
            </View>
          </View>
          
          {/* Buttons */}
          {isOwnProfile ? (
            <>
              <Button title="Edit Profile" onPress={() => router.push('/edit-profile')} style={{ marginTop: 12 }} />
              <Button title="Logout" onPress={() => router.push('/login')} variant="danger" style={{ marginTop: 8 }} />
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
        
        {user.role === 'alumni' && (
          <View style={styles.experienceSection}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <View style={styles.experienceItem}>
              <Text style={styles.companyName}>{user.company}</Text>
              <Text style={styles.position}>{user.position}</Text>
              <Text style={styles.duration}>2019 - Present</Text>
            </View>
          </View>
        )}
        
        {user.role === 'student' && (
          <View style={styles.educationSection}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.educationItem}>
              <Text style={styles.universityName}>University Name</Text>
              <Text style={styles.degree}>{user.department}</Text>
              <Text style={styles.graduationYear}>Class of {user.graduationYear}</Text>
            </View>
          </View>
        )}
        
        {/* Posts Grid */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
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
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: Colors.primary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    minWidth: 140,
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
  experienceSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  experienceItem: {
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  position: {
    fontSize: 14,
    color: Colors.text,
    marginVertical: 2,
  },
  duration: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  educationSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  educationItem: {
    marginBottom: 8,
  },
  universityName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  degree: {
    fontSize: 14,
    color: Colors.text,
    marginVertical: 2,
  },
  graduationYear: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
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
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 4,
  },
  cameraIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  postsSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
});