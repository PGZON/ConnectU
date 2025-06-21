import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { currentUser } from '@/mocks/users';

export default function EditProfileScreen() {
  const { updateProfile, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    name: currentUser.name,
    bio: currentUser.bio || '',
    department: currentUser.department || '',
    graduationYear: currentUser.graduationYear?.toString() || '',
    company: currentUser.company || '',
    position: currentUser.position || '',
  });
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    const updatedData = {
      ...formData,
      graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
    };
    
    await updateProfile(updatedData);
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Edit Profile',
          headerRight: () => (
            <Button
              title="Save"
              onPress={handleSave}
              variant="primary"
              size="small"
              loading={isLoading}
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
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              editable={false}
              placeholder="Your full name"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => handleChange('bio', value)}
              placeholder="Tell us about yourself"
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={300}
            />
          </View>
          
          {currentUser.role === 'student' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput
                  style={styles.input}
                  value={formData.department}
                  editable={false}
                  placeholder="Your department or major"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Graduation Year</Text>
                <TextInput
                  style={styles.input}
                  value={formData.graduationYear}
                  editable={false}
                  placeholder="Expected graduation year"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="number-pad"
                />
              </View>
            </>
          )}
          
          {currentUser.role === 'alumni' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Company</Text>
                <TextInput
                  style={styles.input}
                  value={formData.company}
                  onChangeText={(value) => handleChange('company', value)}
                  placeholder="Current company"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Position</Text>
                <TextInput
                  style={styles.input}
                  value={formData.position}
                  onChangeText={(value) => handleChange('position', value)}
                  placeholder="Your job title"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </>
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});