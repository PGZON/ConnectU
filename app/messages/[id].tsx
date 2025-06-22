import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import useConnectionStore from '@/store/connectionStore';
import Colors from '@/constants/colors';
import MessageBubble from '@/components/MessageBubble';
import { Send } from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import { User } from '@/types';

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

  useEffect(() => {
    if (id) {
      fetchMessages(id);
      markAsRead(id);
    }
  }, [id, fetchMessages, markAsRead]);

  useEffect(() => {
    if (connectedUsers) {
      const foundUser = connectedUsers.find(u => u._id === id);
      setChatUser(foundUser);
    }
  }, [id, connectedUsers]);

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
    <>
      <Stack.Screen 
        options={{
          title: chatUser?.name || 'Chat',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <Avatar uri={chatUser?.profileImage} size={32} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
          keyboardDismissMode='on-drag'
          onLayout={() => {
            if (flatListRef.current && userMessages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }}
        />
        
        {error && (
          <View style={{ paddingLeft: 16, paddingBottom: 4 }}>
            <Text style={{ color: Colors.error, fontStyle: 'italic' }}>{error}</Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            placeholderTextColor={Colors.textSecondary}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              messageText.trim() === '' && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={messageText.trim() === ''}
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
  messagesList: {
    padding: 16,
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
    maxHeight: 100,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.inactive,
  },
});