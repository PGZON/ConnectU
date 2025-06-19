import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFeedStore } from '@/store/feedStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Image as ImageIcon, X } from 'lucide-react-native';

export default function CreatePostScreen() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const { createPost, isLoading } = useFeedStore();
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  const handlePost = () => {
    if (caption.trim() === '') return;
    setUploadProgress(0);
    setUploadStatus(null);
    createPost(
      caption,
      image || undefined,
      image ? 'image' : undefined,
      (percent) => setUploadProgress(percent)
    )
      .then(() => {
        setUploadStatus('Upload successful!');
        setTimeout(() => {
          setUploadProgress(null);
          setUploadStatus(null);
          router.back();
        }, 1000);
      })
      .catch(() => {
        setUploadStatus('Upload failed. Please try again.');
        setUploadProgress(null);
      });
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Create Post',
          headerRight: () => (
            <Button
              title="Post"
              onPress={handlePost}
              variant="primary"
              size="small"
              loading={isLoading}
              disabled={caption.trim() === ''}
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
          <TextInput
            style={styles.captionInput}
            placeholder="What would you like to share?"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2000}
            placeholderTextColor={Colors.textSecondary}
            autoFocus
          />
          
          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.addImageButton}
            onPress={handlePickImage}
          >
            <ImageIcon size={24} color={Colors.primary} />
            <Text style={styles.addImageText}>Add Photo</Text>
          </TouchableOpacity>
          
          {uploadProgress !== null && (
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <Text style={{ fontSize: 16, color: Colors.primary }}>Uploading: {uploadProgress}%</Text>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
          {uploadStatus && (
            <Text style={{ color: uploadStatus.includes('successful') ? 'green' : 'red', textAlign: 'center', marginBottom: 8 }}>{uploadStatus}</Text>
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
  captionInput: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
  },
  addImageText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
});