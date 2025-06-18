import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { mockUsers } from '@/mocks/users';
import { useConnectionStore } from '@/store/connectionStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { MessageCircle } from 'lucide-react-native';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState(mockUsers.find(u => u.id === id));
  const { getConnectionStatus, sendConnectionRequest } = useConnectionStore();
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const router = useRouter();

  useEffect(() => {
    if (id) {
      setUser(mockUsers.find(u => u.id === id));
      setConnectionStatus(getConnectionStatus(id));
    }
  }, [id, getConnectionStatus]);

  const handleConnect = () => {
    sendConnectionRequest(id);
    setConnectionStatus('pending');
  };

  const handleMessage = () => {
    router.push(`/messages/${id}`);
  };

  if (!user) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: user.name }} />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{ uri: user.profileImageUrl }}
            style={styles.profileImage}
            contentFit="cover"
          />
          
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
          
          <View style={styles.actionsContainer}>
            {connectionStatus === 'none' && (
              <Button
                title="Connect"
                onPress={handleConnect}
                variant="primary"
                style={styles.actionButton}
              />
            )}
            
            {connectionStatus === 'pending' && (
              <Button
                title="Request Pending"
                disabled={true}
                style={styles.actionButton}
              />
            )}
            
            {connectionStatus === 'accepted' && (
              <Button
                title="Message"
                onPress={handleMessage}
                variant="primary"
                style={styles.actionButton}
                icon={<MessageCircle size={16} color="#FFFFFF" style={{ marginRight: 8 }} />}
              />
            )}
          </View>
        </View>
        
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>{user.bio || 'No bio added yet.'}</Text>
        </View>
        
        {user.role === 'alumni' && (
          <View style={styles.experienceSection}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <View style={styles.experienceItem}>
              <Text style={styles.companyName}>{user.company}</Text>
              <Text style={styles.position}>{user.position}</Text>
              <Text style={styles.duration}>2019 - Present</Text>
            </View>
          </View>
        )}
        
        {user.role === 'student' && (
          <View style={styles.educationSection}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.educationItem}>
              <Text style={styles.universityName}>University Name</Text>
              <Text style={styles.degree}>{user.department}</Text>
              <Text style={styles.graduationYear}>Class of {user.graduationYear}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  backButton: {
    fontSize: 16,
    color: Colors.primary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    minWidth: 140,
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
  experienceSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  experienceItem: {
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  position: {
    fontSize: 14,
    color: Colors.text,
    marginVertical: 2,
  },
  duration: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  educationSection: {
    padding: 16,
    backgroundColor: Colors.card,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  educationItem: {
    marginBottom: 8,
  },
  universityName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  degree: {
    fontSize: 14,
    color: Colors.text,
    marginVertical: 2,
  },
  graduationYear: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});