import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFeedStore } from '@/store/feedStore';
import Colors from '@/constants/colors';
import { Image as ImageIcon, X, Send } from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import { useAuthStore } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const MAX_CAPTION_LENGTH = 1500;
const MAX_IMAGES = 5;

export default function CreatePostScreen() {
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const { createPost, isLoading } = useFeedStore();
  const { user } = useAuthStore();
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
      
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.userRow}>
              <Avatar uri={user?.profileImageUrl} size={44} borderWidth={2} />
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
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
            <Text style={styles.charCounter}>{remainingChars} characters remaining</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScrollView}>
              {images.map(uri => (
                <Animated.View key={uri} entering={FadeIn} exiting={FadeOut} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(uri)}>
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
            
            {images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.fabAddImage} onPress={handlePickImage} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#fd5f36", "#fcae3e", "#f77737", "#e1306c", "#c13584", "#5851db"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.fabGradient}
                >
                  <ImageIcon size={28} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {isLoading && uploadProgress !== null && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
              </View>
            )}
            {uploadStatus && (
              <Text style={[styles.statusText, { color: uploadStatus.includes('successful') ? 'green' : 'red' }]}>{uploadStatus}</Text>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.fabPost, isPostDisabled && styles.fabPostDisabled]}
          onPress={handlePost}
          disabled={isPostDisabled}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#fd5f36", "#fcae3e", "#f77737", "#e1306c", "#c13584", "#5851db"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Send size={28} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120, // More space for floating buttons
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    marginLeft: 12,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  captionInput: {
    fontSize: 17,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  charCounter: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 8,
  },
  imagePreviewScrollView: {
    marginTop: 8,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  imagePreview: {
    width: 120,
    height: 120,
    backgroundColor: Colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabAddImage: {
    position: 'absolute',
    left: 24,
    bottom: -32,
    zIndex: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#fd5f36',
    borderRadius: 3,
  },
  statusText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  fabPost: {
    position: 'absolute',
    bottom: 720,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  fabPostDisabled: {
    opacity: 0.5,
  },
});