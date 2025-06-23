import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';

export default function EditProfileScreen() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    department: user?.department || '',
    graduationYear: user?.graduationYear ? user.graduationYear.toString() : '',
    company: user?.company || '',
    position: user?.position || '',
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
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View style={styles.avatarBg}>
            <Avatar uri={user?.profileImageUrl} size={90} borderWidth={3} />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
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
          <View style={styles.divider} />
          {user?.role === 'student' && (
            <>
              <Text style={styles.sectionTitle}>Education</Text>
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
          
          {user?.role === 'alumni' && (
            <>
              <Text style={styles.sectionTitle}>Work</Text>
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
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 0,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  avatarBg: {
    backgroundColor: Colors.highlight,
    borderRadius: 60,
    padding: 8,
    marginBottom: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 10,
    marginTop: 8,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
});