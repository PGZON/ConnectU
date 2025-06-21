import React, { useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Text, TouchableOpacity, RefreshControl } from 'react-native';
import useConnectionStore from '@/store/connectionStore';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import Avatar from '@/components/Avatar';
import { useRouter } from 'expo-router';
import { formatTimeAgo } from '@/utils/dateUtils';
import { User } from '@/types';

export default function MessagesScreen() {
  const { establishedConnections, isLoading: connectionsLoading, fetchConnections } = useConnectionStore();
  const { user: currentUser } = useAuthStore();
  const { messages, fetchMessages, getUnreadCount } = useMessageStore();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      fetchConnections();
    }
  }, [currentUser, fetchConnections]);

  const onRefresh = useCallback(() => {
    if (currentUser) {
      fetchConnections();
    }
  }, [currentUser, fetchConnections]);

  const connectedUsers = useMemo(() => {
    if (!currentUser) return [];
    return establishedConnections
      .map(c => c.student?._id === currentUser._id ? c.alumni : c.student)
      .filter(Boolean) as User[];
  }, [establishedConnections, currentUser]);

  useEffect(() => {
    connectedUsers.forEach(user => {
      if (user?._id) fetchMessages(user._id);
    });
  }, [connectedUsers, fetchMessages]);

  if (connectionsLoading || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleUserPress = (user: User) => {
    if (user?._id) router.push(`/messages/${user._id}`);
  };

  const getLastMessage = (userId: string) => {
    const userMessages = messages[userId] || [];
    return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={connectedUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          if (!item?._id) return null; // Defensive check
          const lastMessage = getLastMessage(item._id);
          const unreadCount = getUnreadCount(item._id);
          
          return (
            <TouchableOpacity 
              style={styles.userItem}
              onPress={() => handleUserPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <Avatar uri={item.profileImageUrl} size={50} />
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.messageInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                {lastMessage ? (
                  <Text 
                    style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]}
                    numberOfLines={1}
                  >
                    {lastMessage.message}
                  </Text>
                ) : (
                  <Text style={styles.noMessages}>No messages yet</Text>
                )}
              </View>
              
              {lastMessage && (
                <Text style={styles.timestamp}>
                  {formatTimeAgo(new Date(lastMessage.timestamp))}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={connectionsLoading}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active conversations</Text>
            <Text style={styles.emptySubtext}>Connect with people to start chatting.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  messageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  unreadMessage: {
    fontWeight: '600',
    color: Colors.text,
  },
  noMessages: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
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
});