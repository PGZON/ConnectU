import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useMessageStore } from '@/store/messageStore';
import { mockUsers } from '@/mocks/users';
import Colors from '@/constants/colors';
import MessageBubble from '@/components/MessageBubble';
import { Send } from 'lucide-react-native';
import Avatar from '@/components/Avatar';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, fetchMessages, sendMessage, markAsRead } = useMessageStore();
  const [messageText, setMessageText] = useState('');
  const [user, setUser] = useState(mockUsers.find(u => u.id === id));
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const userMessages = messages[id] || [];

  useEffect(() => {
    if (id) {
      fetchMessages(id);
      markAsRead(id);
    }
  }, [id, fetchMessages, markAsRead]);

  const handleSend = () => {
    if (messageText.trim() === '') return;
    
    sendMessage(id, messageText.trim());
    setMessageText('');
    
    // Scroll to bottom after sending
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: user?.name || 'Chat',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <Avatar uri={user?.profileImageUrl} size={32} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={userMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isCurrentUser={item.senderId === '1'} // Assuming current user id is '1'
            />
          )}
          contentContainerStyle={styles.messagesList}
          onLayout={() => {
            if (flatListRef.current && userMessages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }}
        />
        
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