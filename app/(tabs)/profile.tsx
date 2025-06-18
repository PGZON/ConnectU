import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Camera, LogOut, Edit2 } from 'lucide-react-native';
import { currentUser } from '@/mocks/users';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const [user, setUser] = useState(currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsLoading(true);
      
      // Simulate API call to update profile image
      setTimeout(() => {
        setUser(prev => ({
          ...prev,
          profileImageUrl: result.assets[0].uri,
        }));
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => logout(),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: user.profileImageUrl }}
            style={styles.profileImage}
            contentFit="cover"
          />
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={handlePickImage}
            disabled={isLoading}
          >
            <Camera size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>{user.role}</Text>
        
        {user.role === 'student' && (
          <Text style={styles.details}>
            {user.department}, Class of {user.graduationYear}
          </Text>
        )}
        
        {user.role === 'alumni' && (
          <Text style={styles.details}>
            {user.position} at {user.company}
          </Text>
        )}
      </View>
      
      <View style={styles.bioSection}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <Text style={styles.bioText}>{user.bio || 'No bio added yet.'}</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <Button
          title="Edit Profile"
          onPress={handleEditProfile}
          variant="outline"
          fullWidth
          style={styles.actionButton}
          textStyle={styles.actionButtonText}
          icon={<Edit2 size={16} color={Colors.primary} style={{ marginRight: 8 }} />}
        />
        
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={[styles.actionButton, styles.logoutButton]}
          textStyle={[styles.actionButtonText, styles.logoutButtonText]}
          icon={<LogOut size={16} color={Colors.error} style={{ marginRight: 8 }} />}
        />
      </View>
      
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Queries</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.card,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: Colors.text,
  },
  bioSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: '600',
  },
  logoutButton: {
    borderColor: Colors.error,
  },
  logoutButtonText: {
    color: Colors.error,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
});