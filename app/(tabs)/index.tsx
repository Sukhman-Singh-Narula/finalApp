import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { generateStoryStart, generateStorySuccess, generateStoryFailure, setCurrentStory } from '@/store/slices/storySlice';
import { storyService } from '@/services/storyService';
import CustomButton from '@/components/CustomButton';
import StoryCard from '@/components/StoryCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Plus, Sparkles, X } from 'lucide-react-native';

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stories, isGenerating } = useAppSelector((state) => state.stories);
  
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(user?.defaultSystemPrompt || '');

  const recentStories = stories.slice(0, 5);

  const handleGenerateStory = async () => {
    if (!customPrompt.trim()) {
      Alert.alert('Story Prompt Required', 'Please enter what kind of story you\'d like to create!');
      return;
    }

    dispatch(generateStoryStart());
    setShowPromptModal(false);

    try {
      const story = await storyService.generateStory(systemPrompt, customPrompt);
      dispatch(generateStorySuccess(story));
      setCustomPrompt('');
      Alert.alert('Story Created!', 'Your magical story has been generated successfully!');
    } catch (error) {
      dispatch(generateStoryFailure('Failed to generate story. Please try again.'));
      Alert.alert('Error', 'Failed to generate story. Please try again.');
    }
  };

  const handleStoryPress = (story: any) => {
    dispatch(setCurrentStory(story));
    router.push('/story-player');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

        {isGenerating && (
          <View style={styles.loadingSection}>
            <LoadingSpinner message="Creating your magical story..." />
          </View>
        )}

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Stories</Text>
          {recentStories.length > 0 ? (
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
              disabled={!customPrompt.trim()}
            />
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
  },
  recentSection: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 24,
    marginBottom: 16,
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
    marginBottom: 8,
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
    marginBottom: 40,
  },
});