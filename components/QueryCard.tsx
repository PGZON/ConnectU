import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Query } from '@/types';
import Colors from '@/constants/colors';
import Avatar from './Avatar';
import Button from './Button';
import { formatTimeAgo } from '@/utils/dateUtils';

interface QueryCardProps {
  query: Query;
  onAnswer?: (queryId: string) => void;
  onAnswerPress?: (answer: any) => void;
}

export default function QueryCard({ query, onAnswer, onAnswerPress }: QueryCardProps) {
  const router = useRouter();

  const handleStudentPress = () => {
    if (query.student) {
      router.push(`/profile/${query.student.id}`);
    }
  };

  const handleAlumniPress = (alumniId?: string) => {
    if (alumniId) {
      router.push(`/profile/${alumniId}`);
    }
  };

  const handleAnswer = () => {
    if (onAnswer) {
      onAnswer(query.id);
    } else {
      router.push(`/query/${query.id}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleStudentPress} style={styles.userInfo}>
          <Avatar uri={query.student?.profileImageUrl} size={36} />
          <Text style={styles.name}>{query.student?.name}</Text>
        </TouchableOpacity>
        <Text style={styles.timestamp}>{formatTimeAgo(new Date(query.createdAt))}</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionLabel}>Question:</Text>
        <Text style={styles.questionText}>{query.question}</Text>
      </View>

      {query.answers && query.answers.length > 0 ? (
        <View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Answers:</Text>
          {query.answers.map((ans) => (
            <TouchableOpacity
              key={ans.id}
              onPress={() => onAnswerPress && onAnswerPress(ans)}
              activeOpacity={0.8}
              style={styles.answerBox}
            >
              <View style={styles.answerHeader}>
                <TouchableOpacity onPress={() => handleAlumniPress(ans.alumni?.id)} style={styles.userInfo}>
                  <Avatar uri={ans.alumni?.profileImageUrl} size={36} />
                  <Text style={styles.name}>{ans.alumni?.name}</Text>
                </TouchableOpacity>
                <Text style={styles.timestamp}>{formatTimeAgo(new Date(ans.createdAt))}</Text>
              </View>
              <Text style={styles.answerText}>{ans.content}</Text>
              {ans.isAccepted && (
                <Text style={{ color: Colors.success, fontWeight: 'bold', marginTop: 4 }}>Accepted Answer</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.actions}>
          <Button
            title="Answer"
            onPress={handleAnswer}
            variant="primary"
            size="small"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
    color: Colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  questionText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  answerContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  answerBox: {
    marginBottom: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actions: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
});