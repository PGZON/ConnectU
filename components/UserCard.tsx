import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { User } from '@/types';
import Colors from '@/constants/colors';
import Avatar from './Avatar';
import Button from './Button';

interface UserCardProps {
  user: User;
  connectionStatus?: 'none' | 'pending' | 'accepted';
  onConnect?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export default function UserCard({ 
  user, 
  connectionStatus = 'none',
  onConnect,
  onMessage
}: UserCardProps) {
  const router = useRouter();

  const handleProfilePress = () => {
    router.push(`/profile/${user.id}`);
  };

  const handleConnect = () => {
    if (onConnect) {
      onConnect(user.id);
    }
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage(user.id);
    } else {
      router.push(`/messages/${user.id}`);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handleProfilePress}
      activeOpacity={0.7}
    >
      <Avatar uri={user.profileImageUrl} size={60} />
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>{user.role}</Text>
        
        {user.role === 'alumni' && (
          <Text style={styles.position}>
            {user.position} at {user.company}
          </Text>
        )}
        
        {user.role === 'student' && (
          <Text style={styles.department}>
            {user.department}, Class of {user.graduationYear}
          </Text>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {connectionStatus === 'none' && (
          <Button
            title="Connect"
            onPress={handleConnect}
            variant="outline"
            size="small"
          />
        )}
        
        {connectionStatus === 'pending' && (
          <Button
            title="Pending"
            disabled={true}
            size="small"
          />
        )}
        
        {connectionStatus === 'accepted' && (
          <Button
            title="Message"
            onPress={handleMessage}
            variant="primary"
            size="small"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  role: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  position: {
    fontSize: 13,
    color: Colors.text,
  },
  department: {
    fontSize: 13,
    color: Colors.text,
  },
  actionsContainer: {
    marginLeft: 8,
  },
});