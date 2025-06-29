// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/hooks';
import {
  generateStoryAsync,
  loadUserStories,
  setCurrentStory,
  setCurrentServerStory,
  clearError,
  refreshStories
} from '@/store/slices/storySlice';
import CustomButton from '@/components/CustomButton';
import StoryCard from '@/components/StoryCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Plus, Sparkles, X, RefreshCw } from 'lucide-react-native';

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { user, firebase_token } = useAppSelector((state) => state.auth);
  const { stories, isGenerating, generationProgress, error, isLoadingStories } = useAppSelector((state) => state.stories);

  const [showPromptModal, setShowPromptModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(user?.defaultSystemPrompt || '');
  const [refreshing, setRefreshing] = useState(false);

  const recentStories = stories.slice(0, 5);

  // Load stories when component mounts
  useEffect(() => {
    if (firebase_token) {
      dispatch(loadUserStories(firebase_token));
    }
  }, [firebase_token, dispatch]);

  // Update system prompt when user data changes
  useEffect(() => {
    if (user?.defaultSystemPrompt) {
      setSystemPrompt(user.defaultSystemPrompt);
    }
  }, [user?.defaultSystemPrompt]);

  const handleGenerateStory = async () => {
    if (!customPrompt.trim()) {
      Alert.alert('Story Prompt Required', 'Please enter what kind of story you\'d like to create!');
      return;
    }

    if (!firebase_token) {
      Alert.alert('Authentication Error', 'Please log in again to create stories.');
      return;
    }

    setShowPromptModal(false);

    try {
      console.log('🎬 Starting story generation...');
      await dispatch(generateStoryAsync({
        firebase_token,
        prompt: customPrompt
      })).unwrap();

      setCustomPrompt('');
      Alert.alert(
        'Story Created!',
        'Your magical story has been generated successfully!',
        [
          {
            text: 'View Story',
            onPress: () => {
              // The latest story should be at the beginning of the stories array
              const latestStory = stories[0];
              if (latestStory) {
                handleStoryPress(latestStory);
              }
            }
          },
          { text: 'Create Another', style: 'cancel' }
        ]
      );
    } catch (error: any) {
      console.error('Story generation error:', error);
      Alert.alert(
        'Story Generation Failed',
        error.message || 'Failed to generate story. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStoryPress = async (story: any) => {
    try {
      if (story.scenes && story.scenes.length > 0) {
        // Story has server data with scenes, use it directly
        dispatch(setCurrentServerStory({
          story_id: story.id,
          title: story.title,
          user_prompt: story.description,
          total_scenes: story.scenes.length,
          total_duration: story.duration || 0,
          scenes: story.scenes,
          status: 'completed',
          generated_at: story.generatedTime,
        }));
      } else {
        // Story is just metadata, need to load full details
        dispatch(setCurrentStory(story));
      }

      router.push('/story-player');
    } catch (error) {
      console.error('Error loading story:', error);
      Alert.alert('Error', 'Failed to load story details.');
    }
  };

  const handleRefresh = async () => {
    if (!firebase_token) return;

    setRefreshing(true);
    try {
      await dispatch(refreshStories(firebase_token)).unwrap();
    } catch (error) {
      console.warn('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await handleRefresh();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.childName}! 👋
          </Text>
          <Text style={styles.subGreeting}>
            Ready for a magical story adventure?
          </Text>
        </View>

        <View style={styles.generateSection}>
          <CustomButton
            title="Generate New Story"
            onPress={() => setShowPromptModal(true)}
            style={styles.generateButton}
            disabled={isGenerating}
          />
          <View style={styles.generateIcon}>
            <Sparkles size={24} color={Colors.primary} />
          </View>
        </View>

        {/* Show generation progress */}
        {isGenerating && (
          <View style={styles.loadingSection}>
            <LoadingSpinner message={generationProgress || "Creating your magical story..."} />
            <Text style={styles.progressText}>
              {generationProgress || "This may take 30-60 seconds..."}
            </Text>
          </View>
        )}

        {/* Show any errors */}
        {error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>{error}</Text>
            <CustomButton
              title="Try Again"
              onPress={() => dispatch(clearError())}
              variant="outline"
              size="small"
            />
          </View>
        )}

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Stories</Text>
            {stories.length > 0 && (
              <CustomButton
                title="Refresh"
                onPress={handleRefresh}
                variant="outline"
                size="small"
                style={styles.refreshButton}
                disabled={refreshing || isLoadingStories}
              />
            )}
          </View>

          {isLoadingStories ? (
            <View style={styles.loadingSection}>
              <LoadingSpinner message="Loading your stories..." />
            </View>
          ) : recentStories.length > 0 ? (
            recentStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onPress={() => handleStoryPress(story)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No stories yet! Generate your first magical story above.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Story Generation Modal */}
      <Modal
        visible={showPromptModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPromptModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Your Story</Text>
            <CustomButton
              title="✕"
              onPress={() => setShowPromptModal(false)}
              variant="outline"
              size="small"
              style={styles.closeButton}
            />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.promptSection}>
              <Text style={styles.promptLabel}>What story would you like to hear?</Text>
              <Text style={styles.promptHelper}>
                Be specific! For example: "A brave little mouse who goes on an adventure to find magical cheese"
              </Text>
              <TextInput
                style={styles.promptInput}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                placeholder="Tell me about a brave little mouse who goes on an adventure..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.promptSection}>
              <Text style={styles.promptLabel}>Story Instructions (Optional)</Text>
              <Text style={styles.promptHelper}>
                These instructions help customize the story style. Leave blank to use your default preferences.
              </Text>
              <TextInput
                style={styles.promptInput}
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder="Any special instructions for the story..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <CustomButton
              title="Generate Story"
              onPress={handleGenerateStory}
              style={styles.generateModalButton}
              disabled={!customPrompt.trim() || isGenerating}
            />

            <Text style={styles.modalFooterText}>
              ✨ Stories are generated with magical illustrations and narration!
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: Colors.secondary,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  generateSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    position: 'relative',
  },
  generateButton: {
    marginBottom: 0,
  },
  generateIcon: {
    position: 'absolute',
    right: 40,
    top: 36,
  },
  loadingSection: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  errorSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF5F5',
    marginHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  recentSection: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  refreshButton: {
    minWidth: 80,
  },
  emptyState: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    minWidth: 40,
    paddingHorizontal: 12,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  promptSection: {
    marginBottom: 24,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  promptHelper: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
    minHeight: 80,
  },
  generateModalButton: {
    marginTop: 16,
    marginBottom: 20,
  },
  modalFooterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
});