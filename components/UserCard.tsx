import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { User, ConnectionStatus } from '@/types';
import Colors from '@/constants/colors';
import Avatar from './Avatar';
import Button from './Button';
import { Check, X } from 'lucide-react-native';

interface UserCardProps {
  user: User;
  connectionStatus: {
    status: 'none' | 'pending_sent' | 'pending_received' | 'connected';
    connectionId?: string;
  };
  onConnect?: (userId: string) => void;
  onAccept?: (connectionId: string) => void;
  onDecline?: (connectionId: string) => void;
  onWithdraw?: (connectionId: string) => void;
  onDisconnect?: (connectionId: string) => void;
}

export default function UserCard({ 
  user, 
  connectionStatus,
  onConnect,
  onAccept,
  onDecline,
  onWithdraw,
  onDisconnect
}: UserCardProps) {
  const router = useRouter();

  const handleAction = (action?: (id: string) => void, id?: string) => {
    if (action && id) {
      action(id);
    } else if (action && !id) {
      action(user._id);
    }
  };

  const renderRoleBadge = () => {
    const roleStyle = user.role === 'alumni' ? styles.alumniBadge : styles.studentBadge;
    return (
      <View style={[styles.badge, roleStyle]}>
        <Text style={styles.badgeText}>{user.role}</Text>
      </View>
    );
  };
  
  const renderButtons = () => {
    const { status, connectionId } = connectionStatus;

    switch (status) {
      case 'none':
        return <Button title="Connect" onPress={() => handleAction(onConnect)} variant="outline" size="small" />;
      case 'pending_sent':
        return <Button title="Requested" onPress={() => handleAction(onWithdraw, connectionId)} variant="secondary" size="small" />;
      case 'pending_received':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={() => handleAction(onDecline, connectionId)} style={[styles.iconButton, styles.declineButton]}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAction(onAccept, connectionId)} style={[styles.iconButton, styles.acceptButton]}>
              <Check size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        );
      case 'connected':
        return <Button title="Disconnect" onPress={() => handleAction(onDisconnect, connectionId)} variant="danger" size="small" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push(`/profile/${user._id}`)}
      activeOpacity={0.7}
    >
      <Avatar uri={user.profileImageUrl} size={50} />
      <View style={styles.infoContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.name}>{user.name}</Text>
          {renderRoleBadge()}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {user.role === 'alumni' ? `${user.position} at ${user.company}` : `${user.department}`}
        </Text>
      </View>
      {renderButtons()}
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
    marginBottom: 8,
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
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 50,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  declineButton: {
    backgroundColor: Colors.danger,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  alumniBadge: {
    backgroundColor: Colors.primary,
  },
  studentBadge: {
    backgroundColor: Colors.secondary,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});