import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import useConnectionStore from '@/store/connectionStore';
import Colors from '@/constants/colors';
import MessageBubble from '@/components/MessageBubble';
import { Send } from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import { User } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/utils/api';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sendRealtimeMessage, fetchMessages, markAsRead, error } = useMessageStore();
  const userMessages = useMessageStore(state => state.messages[id!] || []);
  const { user: currentUser } = useAuthStore();
  const { connectedUsers } = useConnectionStore();
  const [messageText, setMessageText] = useState('');
  const [chatUser, setChatUser] = useState<User | undefined>();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (id) {
      fetchMessages(id);
      markAsRead(id);
    }
  }, [id, fetchMessages, markAsRead]);

  useEffect(() => {
    const getChatUser = async () => {
      if (!id) return;
      // 1. Try to find user in connection store
      const foundUser = connectedUsers.find(u => u._id === id);
      if (foundUser) {
        setChatUser(foundUser);
        return;
      }
      // 2. If not found, fetch from API
      try {
        const response = await api.getUserProfile(id);
        if (response.success && response.data) {
          setChatUser(response.data);
        }
      } catch (e) {
        console.error("Failed to fetch chat user by ID", e);
      }
    };
    getChatUser();
  }, [id, connectedUsers]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar uri={chatUser?.profileImageUrl} size={36} />
          <View style={{ marginLeft: 10 }}>
            <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '600', color: Colors.text }}>
              {chatUser?.name || 'Loading...'}
            </Text>
            {chatUser?.bio && (
              <Text numberOfLines={1} style={{ fontSize: 12, color: Colors.textSecondary }}>
                {chatUser.bio}
              </Text>
            )}
          </View>
        </View>
      ),
    });
  }, [navigation, chatUser]);

  useEffect(() => {
    if (userMessages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [userMessages]);

  const handleSend = () => {
    if (messageText.trim() === '' || !chatUser) return;
    
    sendRealtimeMessage(chatUser, messageText.trim());
    setMessageText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={userMessages}
            keyExtractor={(item) => item._id || new Date(item.createdAt).toISOString()}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isCurrentUser={item.sender._id === currentUser?._id}
              />
            )}
            contentContainerStyle={styles.messagesList}
            keyboardDismissMode='interactive'
            onLayout={() => {
              if (flatListRef.current && userMessages.length > 0) {
                flatListRef.current.scrollToEnd({ animated: false });
              }
            }}
          />
        </View>

        {error && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
            <Text style={{ color: Colors.error, fontStyle: 'italic' }}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={messageText.trim() === ''}
          >
            <LinearGradient
              colors={messageText.trim() === '' ? [Colors.inactive, Colors.inactive] : [Colors.secondary, Colors.primary]}
              style={styles.sendButton}
            >
              <Send size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    borderRadius: 22,
    paddingHorizontal: 4,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: Colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});