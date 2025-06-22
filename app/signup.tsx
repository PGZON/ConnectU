import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { UserRole } from '@/types';
import AnimatedLogo from '@/components/AnimatedLogo';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
    prn: '',
    alumniId: '',
    department: '',
    batch: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signup, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'student') {
      if (!formData.prn.trim()) {
        newErrors.prn = 'PRN is required';
      }
      if (!formData.department.trim()) {
        newErrors.department = 'Department is required';
      }
      if (!formData.batch.trim()) {
        newErrors.batch = 'Batch is required';
      }
    } else if (formData.role === 'alumni') {
      if (!formData.alumniId.trim()) {
        newErrors.alumniId = 'Alumni ID is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    const payload: any = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };
    if (formData.role === 'student') {
      payload.prn = formData.prn;
      payload.department = formData.department;
      payload.batch = formData.batch;
    } else if (formData.role === 'alumni') {
      payload.alumniId = formData.alumniId;
    }
    await signup(payload, formData.password);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sign Up', headerShown: false }} />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <AnimatedLogo />
          </View>
          
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitleText}>Join our community</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textSecondary}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              placeholder="Create a password"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              placeholder="Confirm your password"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>I am a</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'student' && styles.roleButtonActive
                ]}
                onPress={() => handleChange('role', 'student')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'student' && styles.roleButtonTextActive
                  ]}
                >
                  Student
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'alumni' && styles.roleButtonActive
                ]}
                onPress={() => handleChange('role', 'alumni')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'alumni' && styles.roleButtonTextActive
                  ]}
                >
                  Alumni
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Student-specific fields */}
          {formData.role === 'student' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>PRN Number</Text>
                <TextInput
                  style={[styles.input, errors.prn && styles.inputError]}
                  value={formData.prn}
                  onChangeText={(value) => handleChange('prn', value)}
                  placeholder="Enter your PRN number"
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="characters"
                />
                {errors.prn && <Text style={styles.errorText}>{errors.prn}</Text>}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput
                  style={[styles.input, errors.department && styles.inputError]}
                  value={formData.department}
                  onChangeText={(value) => handleChange('department', value)}
                  placeholder="Enter your department/branch"
                  placeholderTextColor={Colors.textSecondary}
                />
                {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Batch (Graduation Year)</Text>
                <TextInput
                  style={[styles.input, errors.batch && styles.inputError]}
                  value={formData.batch}
                  onChangeText={(value) => handleChange('batch', value)}
                  placeholder="Enter your batch/graduation year"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="number-pad"
                />
                {errors.batch && <Text style={styles.errorText}>{errors.batch}</Text>}
              </View>
            </>
          )}

          {/* Alumni-specific fields */}
          {formData.role === 'alumni' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Alumni ID</Text>
                <TextInput
                  style={[styles.input, errors.alumniId && styles.inputError]}
                  value={formData.alumniId}
                  onChangeText={(value) => handleChange('alumniId', value)}
                  placeholder="Enter your Alumni ID"
                  placeholderTextColor={Colors.textSecondary}
                />
                {errors.alumniId && <Text style={styles.errorText}>{errors.alumniId}</Text>}
              </View>
            </>
          )}
          
          <Button
            title="Sign Up"
            onPress={handleSignup}
            variant="primary"
            loading={isLoading}
            fullWidth
            style={styles.signupButton}
          />
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
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
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
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
  inputError: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  signupButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});