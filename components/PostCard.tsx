import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, FlatList, Animated, Pressable, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Post } from '@/types';
import Colors from '@/constants/colors';
import Avatar from './Avatar';
import { formatTimeAgo } from '@/utils/dateUtils';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';
import { LinearGradient } from 'expo-linear-gradient';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

const { width: windowWidth } = Dimensions.get('window');
// Use a more responsive width for web
const cardWidth = Platform.OS === 'web' ? Math.min(windowWidth, 600) : windowWidth;
const MEDIA_SECTION_WIDTH = cardWidth;

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [mediaContainerWidth, setMediaContainerWidth] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const { user: currentUser } = useAuthStore();
  const { deletePost } = useFeedStore();

  const getItemLayout = (data: any, index: number) => ({
    length: mediaContainerWidth,
    offset: mediaContainerWidth * index,
    index,
  });

  React.useEffect(() => {
    if (currentUser) {
      setIsLiked(post.likes.includes(currentUser._id));
    }
  }, [post.likes, currentUser]);

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true })
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onLike) {
      onLike(post.id);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(post.id);
    } else {
      router.push(`/post/${post.id}`);
    }
  };

  const handleProfilePress = () => {
    if (post.user) {
      router.push(`/profile/${post.user.id}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deletePost(post.id), 
          style: 'destructive' 
        },
      ]
    );
  };

  const renderMediaItem = ({ item }: { item: any }) => (
    <Image
      source={{ uri: item.url }}
      style={{ width: mediaContainerWidth, height: '100%' }}
      contentFit="cover"
      transition={300}
    />
  );

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.userInfo}>
          <Avatar uri={post.user?.profileImageUrl} size={40} />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{post.user?.name}</Text>
            <Text style={styles.role}>{post.user?.role}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {post.likes.length > 10 && (
            <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>Popular</Text></View>
          )}
          {currentUser?._id === post.user?.id && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Trash2 size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      {post.media && post.media.length > 0 && (
        <View 
          style={styles.mediaContainer}
          onLayout={(e) => setMediaContainerWidth(e.nativeEvent.layout.width)}
        >
          {post.media.length === 1 ? (
            <>
              <Image
                source={{ uri: post.media[0].url }}
                style={styles.media}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.35)"]} style={styles.mediaOverlay} />
            </>
          ) : (
            mediaContainerWidth > 0 && <>
              <FlatList
                ref={flatListRef}
                data={post.media}
                renderItem={renderMediaItem}
                getItemLayout={getItemLayout}
                keyExtractor={(item) => item.url}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                style={{ height: '100%' }}
              />
              <View style={styles.pagination}>
                {post.media.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activeIndex ? styles.paginationDotActive : {},
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed] }>
          <Heart
            size={22}
            color={isLiked ? Colors.secondary : Colors.textSecondary}
            fill={isLiked ? Colors.secondary : 'none'}
          />
          <Text style={styles.actionText}>{post.likes.length}</Text>
        </Pressable>

        <Pressable onPress={handleComment} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed] }>
          <MessageCircle size={22} color={Colors.textSecondary} />
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed] }>
          <Share2 size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {post.comments.length > 0 && (
        <TouchableOpacity onPress={handleComment} style={styles.commentsPreview}>
          <Text style={styles.commentUser}>{post.comments[0].user?.name}</Text>
          <Text style={styles.commentText}>{post.comments[0].text}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.timestamp}>{formatTimeAgo(new Date(post.createdAt))}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
  nameContainer: {
    marginLeft: 10,
  },
  name: {
    fontWeight: '600',
    fontSize: 15,
    color: Colors.text,
  },
  role: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  caption: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
    maxWidth: cardWidth,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  commentsPreview: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
  },
  commentUser: {
    fontWeight: '600',
    color: Colors.text,
    marginRight: 5,
  },
  commentText: {
    color: Colors.textSecondary,
  },
  timestamp: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  popularBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  popularBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  actionButtonPressed: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    opacity: 0.7,
  },
});