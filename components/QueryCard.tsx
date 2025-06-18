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
}

export default function QueryCard({ query, onAnswer }: QueryCardProps) {
  const router = useRouter();

  const handleStudentPress = () => {
    if (query.student) {
      router.push(`/profile/${query.student.id}`);
    }
  };

  const handleAlumniPress = () => {
    if (query.alumni) {
      router.push(`/profile/${query.alumni.id}`);
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

      {query.answer ? (
        <View style={styles.answerContainer}>
          <View style={styles.answerHeader}>
            <TouchableOpacity onPress={handleAlumniPress} style={styles.userInfo}>
              <Avatar uri={query.alumni?.profileImageUrl} size={36} />
              <Text style={styles.name}>{query.alumni?.name}</Text>
            </TouchableOpacity>
            {query.answeredAt && (
              <Text style={styles.timestamp}>{formatTimeAgo(new Date(query.answeredAt))}</Text>
            )}
          </View>
          <Text style={styles.answerLabel}>Answer:</Text>
          <Text style={styles.answerText}>{query.answer}</Text>
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
    marginBottom: 12,
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
  actions: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
});