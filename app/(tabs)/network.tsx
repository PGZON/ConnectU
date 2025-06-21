import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import useConnectionStore from '@/store/connectionStore';
import { useAuthStore } from '@/store/authStore';
import UserCard from '@/components/UserCard';
import Colors from '@/constants/colors';
import { User, Connection } from '@/types';

const { width } = Dimensions.get('window');

// Helper to get the other user from a connection
const getOtherUser = (connection: Connection, currentUserId: string): User | null => {
  if (connection.student?._id === currentUserId) {
    return connection.alumni;
  }
  if (connection.alumni?._id === currentUserId) {
    return connection.student;
  }
  return null;
};

export default function NetworkScreen() {
  const {
    allUsers,
    discoverUsers,
    receivedRequests,
    sentRequests,
    establishedConnections,
    isLoading,
    fetchConnections,
    fetchAllUsers,
    acceptConnection,
    declineConnection,
    sendConnectionRequest,
    getConnectionStatus,
  } = useConnectionStore();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Discover');

  useEffect(() => {
    if (currentUser) {
      fetchAllUsers();
      fetchConnections();
    }
  }, [currentUser, fetchAllUsers, fetchConnections]);

  const onRefresh = useCallback(() => {
    if (currentUser) {
      fetchAllUsers();
      fetchConnections();
    }
  }, [currentUser, fetchAllUsers, fetchConnections]);

  if (!currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // --- RENDER LOGIC ---

  const renderUserCard = ({ item }: { item: User }) => {
    if (!item || !item._id) return null; // Safety check
    const status = getConnectionStatus(item._id);
    return (
      <UserCard
        user={item}
        connectionStatus={status.status}
        connectionId={status.connectionId}
        onAccept={acceptConnection}
        onDecline={declineConnection}
        onConnect={sendConnectionRequest}
      />
    );
  };

  const renderEmptyList = (message: string) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const renderContent = () => {
    // Add a RefreshControl to each list individually.
    const refreshControl = <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />;

    switch (activeTab) {
      case 'Discover':
        return (
          <FlatList
            data={discoverUsers}
            renderItem={renderUserCard}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={() => renderEmptyList('No new users to discover.')}
            refreshControl={refreshControl}
          />
        );
      case 'Requests':
        const receivedUsers = receivedRequests.map(r => r.student).filter(Boolean) as User[];
        const sentUsers = sentRequests.map(r => r.alumni).filter(Boolean) as User[];
        
        // Use a ScrollView for the refresh control to cover both lists.
        return (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={refreshControl}
          >
            {receivedUsers.length === 0 && sentUsers.length === 0 ? (
              renderEmptyList('No pending requests.')
            ) : (
              <>
                {receivedUsers.length > 0 && <Text style={styles.sectionTitle}>Received</Text>}
                {receivedUsers.map(user => <View key={'received-' + user._id}>{renderUserCard({ item: user })}</View>)}
                
                {sentUsers.length > 0 && <Text style={styles.sectionTitle}>Sent</Text>}
                {sentUsers.map(user => <View key={'sent-' + user._id}>{renderUserCard({ item: user })}</View>)}
              </>
            )}
          </ScrollView>
        );
      case 'Connected':
        const connectedUsers = establishedConnections.map(c => getOtherUser(c, currentUser._id)).filter(Boolean) as User[];
        return (
          <FlatList
            data={connectedUsers}
            renderItem={renderUserCard}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={() => renderEmptyList("You haven't made any connections yet.")}
            refreshControl={refreshControl}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('Discover')} style={[styles.tab, activeTab === 'Discover' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'Discover' && styles.activeTabText]}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Requests')} style={[styles.tab, activeTab === 'Requests' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'Requests' && styles.activeTabText]}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Connected')} style={[styles.tab, activeTab === 'Connected' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'Connected' && styles.activeTabText]}>Connected</Text>
        </TouchableOpacity>
      </View>
      {isLoading && !discoverUsers.length && !receivedRequests.length && !establishedConnections.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        renderContent()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.card, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  activeTabText: { color: '#FFFFFF' },
  emptyContainer: { alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: Colors.background },
});