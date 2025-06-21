import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ActivityIndicator, Text, TextInput } from 'react-native';
import { useConnectionStore } from '@/store/connectionStore';
import UserCard from '@/components/UserCard';
import Colors from '@/constants/colors';
import { User } from '@/types';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function NetworkScreen() {
  const { 
    connections, 
    pendingRequests, 
    allUsers,
    isLoading, 
    fetchConnections, 
    fetchAllUsers,
    sendConnectionRequest,
    acceptConnectionRequest,
    getConnectionStatus 
  } = useConnectionStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchConnections();
    fetchAllUsers();
  }, [fetchConnections, fetchAllUsers]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(query) || 
        (user.department && user.department.toLowerCase().includes(query)) ||
        (user.company && user.company.toLowerCase().includes(query)) ||
        (user.position && user.position.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchConnections(), fetchAllUsers()]);
    setRefreshing(false);
  };

  const handleConnect = (userId: string) => {
    sendConnectionRequest(userId);
  };

  const handleMessage = (userId: string) => {
    router.push(`/messages/${userId}`);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users, departments, companies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {pendingRequests.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <UserCard 
                user={item.sender!}
                connectionStatus="pending"
                onConnect={() => acceptConnectionRequest(item.id)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
          />
        </View>
      )}

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Discover People</Text>
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserCard 
              user={item}
              connectionStatus={getConnectionStatus(item.id)}
              onConnect={() => handleConnect(item.id)}
              onMessage={() => handleMessage(item.id)}
            />
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
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.text,
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  horizontalListContent: {
    paddingHorizontal: 8,
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
});