import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, FlatList, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQueryStore } from '@/store/queryStore';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { formatTimeAgo } from '@/utils/dateUtils';
import { Answer } from '@/types';

const AnswerCard = ({ answer, onPress }: { answer: Answer, onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <View style={styles.answerContainer}>
      <View style={styles.userInfo}>
        <Avatar uri={answer.alumni?.profileImageUrl} size={40} />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{answer.alumni?.name}</Text>
          {answer.createdAt && (
            <Text style={styles.timestamp}>{formatTimeAgo(new Date(answer.createdAt))}</Text>
          )}
        </View>
      </View>
      <Text style={styles.answerText} numberOfLines={3} ellipsizeMode="tail">{answer.content}</Text>
      {answer.isAccepted && (
        <Text style={{ color: Colors.success, fontWeight: 'bold', marginTop: 4 }}>Accepted Answer</Text>
      )}
    </View>
  </TouchableOpacity>
);

export default function QueryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { queries, answerQuery, isLoading } = useQueryStore();
  const { user } = useAuthStore();
  const [answer, setAnswer] = useState('');
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);

  const query = queries.find(q => q.id === id);

  const canAnswer = useMemo(() => {
    if (!user || user.role !== 'alumni') return false;
    // This logic allows an alum to answer multiple times. 
    // To prevent re-answering, you would check:
    // return !query?.answers.some(a => a.alumni?._id === user._id);
    return true;
  }, [user, query]);

  if (!query) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Query not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="outline"
        />
      </View>
    );
  }

  const handleSubmitAnswer = async () => {
    if (answer.trim() === '') return;
    console.log('[DEBUG] Submit Answer pressed. Query ID:', id, 'Answer:', answer);
    try {
      const success = await answerQuery(id, answer);
      console.log('[DEBUG] answerQuery response:', success);
      if (success) {
        setAnswer('');
        router.replace('/(tabs)/queries');
      } else {
        console.error('[DEBUG] answerQuery failed:', success);
      }
    } catch (err) {
      console.error('[DEBUG] Error in handleSubmitAnswer:', err);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Career Query' }} />
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAnswer && (
              <>
                <View style={styles.userInfo}>
                  <Avatar uri={selectedAnswer.alumni?.profileImageUrl} size={48} />
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{selectedAnswer.alumni?.name}</Text>
                    {selectedAnswer.createdAt && (
                      <Text style={styles.timestamp}>{formatTimeAgo(new Date(selectedAnswer.createdAt))}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.modalAnswerText}>{selectedAnswer.content}</Text>
                {selectedAnswer.isAccepted && (
                  <Text style={{ color: Colors.success, fontWeight: 'bold', marginTop: 8 }}>Accepted Answer</Text>
                )}
                <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.queryCard}>
            <View style={styles.userInfo}>
              <Avatar uri={query.student?.profileImageUrl} size={40} />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{query.student?.name}</Text>
                <Text style={styles.timestamp}>{formatTimeAgo(new Date(query.createdAt))}</Text>
              </View>
            </View>
            
            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>Question:</Text>
              <Text style={styles.questionText}>{query.question}</Text>
            </View>
          </View>

          <Text style={styles.answersHeader}>Answers</Text>
          
          {query.answers && query.answers.length > 0 ? (
            <FlatList
              data={query.answers}
              renderItem={({ item }) => (
                <AnswerCard
                  answer={item}
                  onPress={() => {
                    setSelectedAnswer(item);
                    setModalVisible(true);
                  }}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
             <Text style={styles.noAnswersText}>No answers yet. Be the first to help!</Text>
          )}

          {canAnswer && (
            <View style={styles.answerInputContainer}>
              <Text style={styles.answerLabel}>Your Answer:</Text>
              <TextInput
                style={styles.answerInput}
                placeholder="Provide your professional advice..."
                value={answer}
                onChangeText={setAnswer}
                multiline
                maxLength={2000}
                placeholderTextColor={Colors.textSecondary}
              />
              <Button
                title="Submit Answer"
                onPress={handleSubmitAnswer}
                variant="primary"
                loading={isLoading}
                disabled={answer.trim() === ''}
                fullWidth
                style={styles.submitButton}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
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
  queryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 4,
  },
  answersHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  answerContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginTop: 8,
  },
  answerInputContainer: {
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  answerInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border
  },
  submitButton: {
    marginTop: 8,
  },
  noAnswersText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalAnswerText: {
    fontSize: 17,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});