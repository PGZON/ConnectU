import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { useFeedStore } from '@/store/feedStore';
import PostCard from '@/components/PostCard';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

export default function FeedScreen() {
  const { posts, isLoading, fetchPosts, likePost } = useFeedStore();
  const { isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only fetch posts if user is authenticated
    if (isAuthenticated) {
      console.log('FeedScreen - fetching posts, user authenticated');
      fetchPosts();
    } else {
      console.log('FeedScreen - skipping fetchPosts, user not authenticated');
    }
  }, [fetchPosts, isAuthenticated]);

  const handleRefresh = async () => {
    if (!isAuthenticated) return;
    
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleComment = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleCreatePost = () => {
    router.push('/create-post');
  };

  if (isLoading && !refreshing && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, '#f8fafc']} style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCardWrapper}>
            <PostCard 
              post={item} 
              onLike={handleLike}
              onComment={handleComment}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleCreatePost}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  postCardWrapper: {
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    borderRadius: 16,
  },
  listContent: {
    padding: 18,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fff',
  },
});