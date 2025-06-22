import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFeedStore } from '@/store/feedStore';
import Colors from '@/constants/colors';
import { Image as ImageIcon, X, Send } from 'lucide-react-native';

const MAX_CAPTION_LENGTH = 1500;
const MAX_IMAGES = 5;

export default function CreatePostScreen() {
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const { createPost, isLoading } = useFeedStore();
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handlePickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      alert(`You can only select up to ${MAX_IMAGES} images.`);
      return;
    }

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (!result.canceled && result.assets) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setImages(prevImages => [...prevImages, ...selectedUris]);
    }
  };

  const handleRemoveImage = (uriToRemove: string) => {
    setImages(prevImages => prevImages.filter(uri => uri !== uriToRemove));
  };

  const handlePost = () => {
    if (caption.trim() === '' && images.length === 0) return;
    setUploadProgress(0);
    setUploadStatus(null);
    createPost(
      caption,
      images,
      images.length > 0 ? 'image' : undefined,
      (percent) => setUploadProgress(percent)
    )
      .then(() => {
        setUploadStatus('Post created successfully!');
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

  const remainingChars = MAX_CAPTION_LENGTH - caption.length;
  const isPostDisabled = (caption.trim() === '' && images.length === 0) || isLoading;

  return (
    <>
      <Stack.Screen options={{ title: 'Create Post' }} />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="What's on your mind?"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={MAX_CAPTION_LENGTH}
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
          </View>

          <Text style={styles.charCounter}>{remainingChars} characters remaining</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScrollView}>
            {images.map(uri => (
              <View key={uri} style={styles.imagePreviewContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(uri)}>
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          
          {images.length < MAX_IMAGES && (
            <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
              <ImageIcon size={24} color={Colors.primary} />
              <Text style={styles.addImageText}>
                {images.length > 0 ? `Add More Photos (${images.length}/${MAX_IMAGES})` : `Add Photos (${images.length}/${MAX_IMAGES})`}
              </Text>
            </TouchableOpacity>
          )}
          
          {isLoading && uploadProgress !== null && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.uploadingText}>Uploading: {uploadProgress}%</Text>
            </View>
          )}
          {uploadStatus && (
            <Text style={[styles.statusText, { color: uploadStatus.includes('successful') ? 'green' : 'red' }]}>{uploadStatus}</Text>
          )}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.postButton, isPostDisabled && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={isPostDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Send size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 100, // Space for the floating button
  },
  inputContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  captionInput: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 8,
    marginRight: 4,
  },
  imagePreviewScrollView: {
    marginTop: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  imagePreview: {
    width: 200,
    height: 200,
    backgroundColor: Colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addImageText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primary,
  },
  statusText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  postButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  postButtonDisabled: {
    backgroundColor: Colors.inactive,
  },
});