import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Switch, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQueryStore } from '@/store/queryStore';
import useConnectionStore from '@/store/connectionStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { User } from '@/types';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const TAG_SUGGESTIONS = ['internship', 'placement', 'resume', 'networking', 'skills', 'alumni', 'career', 'project', 'interview', 'guidance'];

export default function AskQueryScreen() {
  const [question, setQuestion] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('career-guidance');
  const { askQuery, isLoading } = useQueryStore();
  const [error, setError] = useState({ question: '', content: '', category: '', tags: '', general: '' });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const contentInputRef = useRef<TextInput>(null);
  const tagInputRef = useRef<TextInput>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const shakeAnim = useSharedValue(0);

  const CATEGORY_OPTIONS = [
    { label: 'Career Guidance', value: 'career-guidance', icon: <Ionicons name="briefcase-outline" size={18} color={Colors.text} /> },
    { label: 'Interview Prep', value: 'interview-prep', icon: <MaterialIcons name="question-answer" size={18} color={Colors.text} /> },
    { label: 'Job Search', value: 'job-search', icon: <FontAwesome5 name="search" size={16} color={Colors.text} /> },
    { label: 'Skill Development', value: 'skill-development', icon: <Ionicons name="school-outline" size={18} color={Colors.text} /> },
    { label: 'Industry Insights', value: 'industry-insights', icon: <Entypo name="bar-graph" size={18} color={Colors.text} /> },
    { label: 'Networking', value: 'networking', icon: <Ionicons name="people-outline" size={18} color={Colors.text} /> },
    { label: 'Resume', value: 'resume', icon: <MaterialIcons name="description" size={18} color={Colors.text} /> },
    { label: 'Other', value: 'other', icon: <Ionicons name="ellipsis-horizontal" size={18} color={Colors.text} /> },
  ];

  const validate = () => {
    let valid = true;
    let err = { question: '', content: '', category: '', tags: '', general: '' };
    if (question.trim().length < 5) {
      err.question = 'Title must be at least 5 characters.';
      valid = false;
    }
    if (content.trim().length < 10 || content.trim().length > 1000) {
      err.content = 'Content must be 10-1000 characters.';
      valid = false;
    }
    if (!CATEGORY_OPTIONS.some(opt => opt.value === category)) {
      err.category = 'Select a valid category.';
      valid = false;
    }
    if (tags.some(tag => tag.length < 2)) {
      err.tags = 'Tags must be at least 2 characters.';
      valid = false;
    }
    setError(err);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setShowPreview(false);
    await askQuery(question, content, category, 'medium', tags);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      router.back();
    }, 1200);
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag) && newTag.length >= 2) {
      setTags([...tags, newTag]);
      setTagInput('');
      setError(e => ({ ...e, tags: '' }));
    } else if (newTag.length > 0) {
      shakeAnim.value = withSpring(10, { damping: 2 }, () => {
        shakeAnim.value = withSpring(0);
      });
    }
  };
  const handleRemoveTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  // Animated styles for input focus
  const getAnimatedInputStyle = (field: string) => useAnimatedStyle(() => ({
    borderColor: focusedField === field ? Colors.primary : Colors.card,
    shadowColor: focusedField === field ? Colors.primary : 'transparent',
    shadowOpacity: focusedField === field ? 0.15 : 0,
    shadowRadius: focusedField === field ? 6 : 0,
    elevation: focusedField === field ? 3 : 0,
    transform: [{ translateX: field === 'tags' ? shakeAnim.value : 0 }],
  }));

  if (user?.role === 'admin') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ color: Colors.text, fontSize: 18, fontWeight: 'bold' }}>Admins cannot create queries.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: '',
          headerShown: false,
        }} 
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {/* Gradient Header with Avatar */}
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.gradientHeader}>
            <View style={{ alignItems: 'center', paddingTop: 36 }}>
              <Avatar uri={user?.profileImageUrl} size={72} borderWidth={3} />
              <Text style={styles.headerTitle}>Ask a Question</Text>
              <Text style={styles.headerSubtitle}>{user?.name}</Text>
            </View>
          </LinearGradient>

          {/* Card: Question Title */}
          <View style={styles.card}>
            <Text style={styles.label}>Question Title</Text>
            <Animated.View style={[styles.animatedInput, getAnimatedInputStyle('question')]}> 
              <TextInput
                style={styles.questionInput}
                placeholder="Short summary of your question..."
                value={question}
                onChangeText={setQuestion}
                maxLength={100}
                placeholderTextColor={Colors.textSecondary}
                autoFocus
                returnKeyType="next"
                onFocus={() => setFocusedField('question')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={() => contentInputRef.current?.focus()}
              />
            </Animated.View>
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>{question.length}/100</Text>
              {error.question ? <Text style={styles.errorText}>{error.question}</Text> : null}
            </View>
          </View>

          {/* Card: Details */}
          <View style={styles.card}>
            <Text style={styles.label}>Details</Text>
            <Animated.View style={[styles.animatedInput, getAnimatedInputStyle('content')]}> 
              <TextInput
                ref={contentInputRef}
                style={[styles.questionInput, { minHeight: 100 }]}
                placeholder="Describe your question in detail..."
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={1000}
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="next"
                onFocus={() => setFocusedField('content')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={() => tagInputRef.current?.focus()}
              />
            </Animated.View>
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>{content.length}/1000</Text>
              {error.content ? <Text style={styles.errorText}>{error.content}</Text> : null}
            </View>
          </View>

          {/* Card: Category Chips */}
          <View style={styles.card}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {CATEGORY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.categoryChip, category === opt.value && styles.selectedCategoryChip]}
                  onPress={() => setCategory(opt.value)}
                  activeOpacity={0.7}
                >
                  {opt.icon}
                  <Text style={[styles.categoryChipText, category === opt.value && styles.selectedCategoryChipText]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {error.category ? <Text style={styles.errorText}>{error.category}</Text> : null}
          </View>

          {/* Card: Tags with Suggestions */}
          <View style={styles.card}>
            <Text style={styles.label}>Tags <Text style={{ color: Colors.textSecondary }}>(optional)</Text></Text>
            <Animated.View style={[styles.animatedInput, getAnimatedInputStyle('tags')]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  ref={tagInputRef}
                  style={[styles.questionInput, { flex: 1, minHeight: 40, paddingVertical: 8 }]}
                  placeholder="Add a tag and press enter..."
                  value={tagInput}
                  onChangeText={setTagInput}
                  onFocus={() => setFocusedField('tags')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={handleAddTag}
                  maxLength={20}
                  placeholderTextColor={Colors.textSecondary}
                />
                <TouchableOpacity onPress={handleAddTag} style={{ marginLeft: 8 }}>
                  <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {tags.map(tag => (
                <TouchableOpacity key={tag} onPress={() => handleRemoveTag(tag)} style={styles.tagChip}>
                  <Text style={{ color: Colors.primary }}>{tag}</Text>
                  <Ionicons name="close" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
            {/* Tag Suggestions */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {TAG_SUGGESTIONS.filter(s => !tags.includes(s)).slice(0, 6).map(suggestion => (
                <TouchableOpacity key={suggestion} onPress={() => setTags([...tags, suggestion])} style={styles.suggestionChip}>
                  <Text style={{ color: Colors.textSecondary }}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {error.tags ? <Text style={styles.errorText}>{error.tags}</Text> : null}
          </View>

          {/* Preview Section */}
          {showPreview && (
            <View style={styles.previewBox}>
              <Text style={styles.label}>Preview</Text>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: Colors.text }}>{question}</Text>
                <Text style={{ color: Colors.textSecondary, marginTop: 4 }}>{content}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  {CATEGORY_OPTIONS.find(opt => opt.value === category)?.icon}
                  <Text style={{ marginLeft: 6, color: Colors.textSecondary }}>{CATEGORY_OPTIONS.find(opt => opt.value === category)?.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                  {tags.map(tag => (
                    <View key={tag} style={styles.tagChipPreview}>
                      <Text style={{ color: Colors.primary }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Button title="Edit" onPress={() => setShowPreview(false)} variant="secondary" />
            </View>
          )}

          {/* Animated Gradient Submit Button */}
          <TouchableOpacity
            style={styles.gradientButtonWrapper}
            activeOpacity={0.85}
            onPress={() => showPreview ? handleSubmit() : setShowPreview(true)}
            disabled={isLoading || success}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <Animated.View style={{ marginRight: 8 }}>
                  <Ionicons name="reload" size={24} color="#fff" />
                </Animated.View>
              ) : (
                <Animated.View style={{ marginRight: 8 }}>
                  <Ionicons name={showPreview ? "send" : "eye"} size={24} color="#fff" />
                </Animated.View>
              )}
              <Text style={styles.gradientButtonText}>{showPreview ? 'Post' : 'Preview'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Success Confetti/Animation */}
          {success && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              <Text style={{ color: Colors.success, fontWeight: 'bold', fontSize: 20, marginTop: 12 }}>Query Posted!</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    width: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 24,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 15,
    marginTop: 2,
    opacity: 0.85,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  animatedInput: {
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginBottom: 0,
    borderWidth: 1.5,
    padding: 0,
  },
  questionInput: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginLeft: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: Colors.card,
    marginBottom: 4,
  },
  selectedCategoryChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    marginLeft: 6,
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagChipPreview: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  suggestionChip: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.card,
  },
  previewBox: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
  },
  gradientButtonWrapper: {
    marginHorizontal: 32,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 3,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 32,
    width: '100%',
  },
  gradientButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  successBox: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
});