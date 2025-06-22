import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Post } from '@/types';
import Colors from '@/constants/colors';
import Avatar from './Avatar';
import { formatTimeAgo } from '@/utils/dateUtils';
import { useAuthStore } from '@/store/authStore';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

const { width } = Dimensions.get('window');
const MEDIA_SECTION_WIDTH = width;

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const { user: currentUser } = useAuthStore();

  React.useEffect(() => {
    if (currentUser) {
      setIsLiked(post.likes.includes(currentUser._id));
    }
  }, [post.likes, currentUser]);

  const handleLike = () => {
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

  const renderMediaItem = ({ item }: { item: any }) => (
    <Image
      source={{ uri: item.url }}
      style={styles.media}
      contentFit="cover"
      transition={300}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.userInfo}>
          <Avatar uri={post.user?.profileImageUrl} size={40} />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{post.user?.name}</Text>
            <Text style={styles.role}>{post.user?.role}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      {post.media && post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.media.length === 1 ? (
            <Image
              source={{ uri: post.media[0].url }}
              style={styles.media}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={post.media}
                renderItem={renderMediaItem}
                keyExtractor={(item) => item.url}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                style={{ width: MEDIA_SECTION_WIDTH }}
                contentContainerStyle={{ width: MEDIA_SECTION_WIDTH * post.media.length }}
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
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Heart
            size={22}
            color={isLiked ? Colors.secondary : Colors.textSecondary}
            fill={isLiked ? Colors.secondary : 'none'}
          />
          <Text style={styles.actionText}>{post.likes.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
          <MessageCircle size={22} color={Colors.textSecondary} />
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {post.comments.length > 0 && (
        <TouchableOpacity onPress={handleComment} style={styles.commentsPreview}>
          <Text style={styles.commentUser}>{post.comments[0].user?.name}</Text>
          <Text style={styles.commentText}>{post.comments[0].text}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.timestamp}>{formatTimeAgo(new Date(post.createdAt))}</Text>
    </View>
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
  },
  mediaContainer: {
    position: 'relative',
    width: MEDIA_SECTION_WIDTH,
    height: width, // 1:1 aspect ratio
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  media: {
    width: MEDIA_SECTION_WIDTH,
    height: '100%',
    borderRadius: 0,
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
});