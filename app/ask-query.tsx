import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Switch, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQueryStore } from '@/store/queryStore';
import useConnectionStore from '@/store/connectionStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { User } from '@/types';
import { Picker } from '@react-native-picker/picker';

export default function AskQueryScreen() {
  const [question, setQuestion] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('career-guidance');
  const { askQuery, isLoading } = useQueryStore();
  const [error, setError] = useState('');
  const router = useRouter();

  const CATEGORY_OPTIONS = [
    { label: 'Career Guidance', value: 'career-guidance' },
    { label: 'Interview Prep', value: 'interview-prep' },
    { label: 'Job Search', value: 'job-search' },
    { label: 'Skill Development', value: 'skill-development' },
    { label: 'Industry Insights', value: 'industry-insights' },
    { label: 'Networking', value: 'networking' },
    { label: 'Resume', value: 'resume' },
    { label: 'Other', value: 'other' },
  ];

  const validate = () => {
    if (question.trim().length < 5) {
      setError('Question title must be at least 5 characters.');
      return false;
    }
    if (content.trim().length < 10 || content.trim().length > 1000) {
      setError('Content must be between 10 and 1000 characters.');
      return false;
    }
    if (!CATEGORY_OPTIONS.some(opt => opt.value === category)) {
      setError('Please select a valid category.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await askQuery(question, content, category, 'medium');
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Ask a Question',
          headerRight: () => (
            <Button
              title="Submit"
              onPress={handleSubmit}
              variant="primary"
              size="small"
              loading={isLoading}
              disabled={isLoading}
            />
          ),
        }} 
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Question Title</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Short summary of your question..."
              value={question}
              onChangeText={setQuestion}
              maxLength={100}
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Details</Text>
            <TextInput
              style={[styles.questionInput, { minHeight: 100 }]}
              placeholder="Describe your question in detail..."
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={1000}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={{ backgroundColor: Colors.card, borderRadius: 8 }}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={{ color: Colors.text }}
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
          </View>
          {error ? <Text style={{ color: Colors.error, marginTop: 8 }}>{error}</Text> : null}
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
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  questionInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  alumniItem: {
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    width: 100,
  },
  selectedAlumni: {
    backgroundColor: Colors.highlight,
  },
  alumniName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  alumniPosition: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  noAlumniText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    padding: 12,
  },
});