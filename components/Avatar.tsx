import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

interface AvatarProps {
  uri?: string;
  size?: number;
  borderWidth?: number;
}

export default function Avatar({ uri, size = 40, borderWidth = 0 }: AvatarProps) {
  const defaultImage = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
  const cacheBustedUri = uri ? `${uri}${uri.includes('?') ? '&' : '?'}cb=${Date.now()}` : defaultImage;
  
  return (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: borderWidth,
      }
    ]}>
      <Image
        source={{ uri: cacheBustedUri }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.border,
    borderColor: Colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});