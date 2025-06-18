import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Post } from '@/types';
import Colors from '@/constants/colors';
import Avatar from './Avatar';
import { formatTimeAgo } from '@/utils/dateUtils';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

const { width } = Dimensions.get('window');

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
  const router = useRouter();
  const isLiked = post.likes.includes('1'); // Assuming current user id is '1'

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
    router.push(`/profile/${post.userId}`);
  };

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

      {post.mediaUrl && (
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.media}
          contentFit="cover"
          transition={300}
        />
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
  media: {
    width: width,
    height: width,
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
    fontSize: 14,
    marginRight: 5,
    color: Colors.text,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  timestamp: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});