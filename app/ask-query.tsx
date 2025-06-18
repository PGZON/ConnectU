import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Switch, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQueryStore } from '@/store/queryStore';
import { useConnectionStore } from '@/store/connectionStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { User } from '@/types';

export default function AskQueryScreen() {
  const [question, setQuestion] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState<User | null>(null);
  const { askQuery, isLoading } = useQueryStore();
  const { getConnectedUsers } = useConnectionStore();
  const [connectedAlumni, setConnectedAlumni] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Filter only alumni from connected users
    const alumni = getConnectedUsers().filter(user => user.role === 'alumni');
    setConnectedAlumni(alumni);
  }, [getConnectedUsers]);

  const handleTogglePublic = () => {
    setIsPublic(!isPublic);
    if (isPublic) {
      // If switching to private, require alumni selection
      setSelectedAlumni(null);
    }
  };

  const handleSelectAlumni = (alumni: User) => {
    setSelectedAlumni(alumni);
  };

  const handleSubmit = async () => {
    if (question.trim() === '') return;
    
    if (!isPublic && !selectedAlumni) {
      alert('Please select an alumni for your private query');
      return;
    }
    
    await askQuery(
      question, 
      !isPublic ? selectedAlumni?.id : undefined,
      isPublic
    );
    
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
              disabled={question.trim() === '' || (!isPublic && !selectedAlumni)}
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
            <Text style={styles.label}>Your Question</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Ask a career-related question..."
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={500}
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
          </View>
          
          <View style={styles.formGroup}>
            <View style={styles.toggleContainer}>
              <Text style={styles.label}>Make question public</Text>
              <Switch
                value={isPublic}
                onValueChange={handleTogglePublic}
                trackColor={{ false: Colors.inactive, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={styles.helperText}>
              {isPublic 
                ? 'Your question will be visible to all alumni' 
                : 'Your question will only be sent to the selected alumni'}
            </Text>
          </View>
          
          {!isPublic && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Alumni</Text>
              {connectedAlumni.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {connectedAlumni.map(alumni => (
                    <TouchableOpacity
                      key={alumni.id}
                      style={[
                        styles.alumniItem,
                        selectedAlumni?.id === alumni.id && styles.selectedAlumni
                      ]}
                      onPress={() => handleSelectAlumni(alumni)}
                    >
                      <Avatar uri={alumni.profileImageUrl} size={50} />
                      <Text style={styles.alumniName}>{alumni.name}</Text>
                      <Text style={styles.alumniPosition}>{alumni.position}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noAlumniText}>
                  You need to connect with alumni first
                </Text>
              )}
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