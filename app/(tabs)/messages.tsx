import React, { useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Text, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import useConnectionStore from '@/store/connectionStore';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import Avatar from '@/components/Avatar';
import { useRouter } from 'expo-router';
import { formatTimeAgo } from '@/utils/dateUtils';
import { User } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';

export default function MessagesScreen() {
  const { establishedConnections, isLoading: connectionsLoading, fetchConnections } = useConnectionStore();
  const { user: currentUser } = useAuthStore();
  const { messages, fetchMessages, getUnreadCount } = useMessageStore();
  const router = useRouter();
  const [search, setSearch] = React.useState('');

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

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return connectedUsers;
    return connectedUsers.filter(u => u.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [connectedUsers, search]);

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
    <LinearGradient colors={[Colors.background, '#f8fafc']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <View style={styles.searchBar}>
        <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          if (!item?._id) return null; // Defensive check
          const lastMessage = getLastMessage(item._id);
          const unreadCount = getUnreadCount(item._id);
          
          return (
            <TouchableOpacity 
              style={styles.userItem}
              onPress={() => handleUserPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.avatarContainer}>
                <Avatar uri={item.profileImageUrl} size={60} />
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
      <TouchableOpacity style={styles.fab} onPress={() => {}} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 10,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: 'transparent',
    borderWidth: 0,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
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
    marginLeft: 16,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  unreadMessage: {
    fontWeight: '700',
    color: Colors.text,
  },
  noMessages: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 13,
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
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
});