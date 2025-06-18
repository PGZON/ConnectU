import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useFeedStore } from '@/store/feedStore';
import Colors from '@/constants/colors';
import PostCard from '@/components/PostCard';
import Avatar from '@/components/Avatar';
import { Send } from 'lucide-react-native';
import { currentUser } from '@/mocks/users';
import { formatTimeAgo } from '@/utils/dateUtils';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, likePost, addComment } = useFeedStore();
  const [commentText, setCommentText] = useState('');
  const router = useRouter();

  const post = posts.find(p => p.id === id);

  if (!post) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLike = () => {
    likePost(post.id);
  };

  const handleSendComment = () => {
    if (commentText.trim() === '') return;
    
    addComment(post.id, commentText.trim());
    setCommentText('');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Post' }} />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={[post, ...post.comments]}
          keyExtractor={(item, index) => 'post' + item.id + index}
          renderItem={({ item, index }) => {
            if (index === 0) {
              // Render the post
              return <PostCard post={post} onLike={handleLike} />;
            } else {
              // Render comments
              const comment = item;
              return (
                <View style={styles.commentContainer}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentUser}>
                      <Avatar uri={comment.user?.profileImageUrl} size={32} />
                      <Text style={styles.commentUserName}>{comment.user?.name}</Text>
                    </View>
                    <Text style={styles.commentTime}>
                      {formatTimeAgo(new Date(comment.createdAt))}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              );
            }
          }}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.commentsTitle}>
                Comments ({post.comments.length})
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
        
        <View style={styles.inputContainer}>
          <Avatar uri={currentUser.profileImageUrl} size={36} />
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            placeholderTextColor={Colors.textSecondary}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              commentText.trim() === '' && styles.sendButtonDisabled
            ]}
            onPress={handleSendComment}
            disabled={commentText.trim() === ''}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  listContent: {
    paddingBottom: 16,
  },
  commentContainer: {
    backgroundColor: Colors.card,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUserName: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
    color: Colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    maxHeight: 100,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.inactive,
  },
});