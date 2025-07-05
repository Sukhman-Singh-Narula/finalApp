// app/(tabs)/index.tsx - UPDATED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Image,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Wand as Wand2, Settings, Sparkles, Heart, Play, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, type Story } from '@/services/apiService';

export default function HomeScreen() {
  const { user, token, updateUserProfile } = useAuth();
  const router = useRouter();

  const [promptModalVisible, setPromptModalVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [storyPrompt, setStoryPrompt] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStories, setLoadingStories] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchUserStories();
    }
  }, [user, token]);

  const fetchUserStories = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoadingStories(true);
      console.log('📚 Fetching recent stories for home screen...');
      
      const response = await apiService.getUserStories(token, 5, 0);
      
      if (response.success && response.stories) {
        const formattedStories = response.stories.map((story: any) => ({
          story_id: story.story_id,
          title: story.title,
          user_prompt: story.user_prompt,
          created_at: story.created_at,
          total_scenes: story.total_scenes || 0,
          total_duration: story.total_duration || 0,
          status: story.status || 'completed',
          thumbnail_url: story.thumbnail_url,
          scenes: story.scenes_data || [],
        }));
        
        setStories(formattedStories);
        console.log('✅ Recent stories loaded:', formattedStories.length);
      } else {
        console.log('No stories found or request failed');
        setStories([]);
      }
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      // Don't show alert for this, just log the error
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, [token]);

  const handleGenerateStory = async () => {
    if (!storyPrompt.trim()) {
      Alert.alert('Error', 'Please enter a story prompt');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Please sign in to generate stories');
      return;
    }

    try {
      setIsGenerating(true);
      console.log('🎬 Starting story generation...');
      
      const result = await apiService.generateStory(storyPrompt.trim(), token);
      
      setStoryModalVisible(false);
      setStoryPrompt('');

      console.log('✅ Story generation response:', result);

      if (result.success && result.story_id) {
        Alert.alert(
          '✨ Story Generation Started!',
          `Your story "${result.story_id}" is being created! It will be ready in about 30-60 seconds.`,
          [
            { text: 'OK', style: 'default' },
            {
              text: 'View Progress',
              onPress: () => {
                router.push(`/story/${result.story_id}`);
              }
            }
          ]
        );

        // Refresh stories list after a short delay
        setTimeout(() => {
          fetchUserStories();
        }, 2000);
      } else {
        Alert.alert('Error', result.message || 'Failed to start story generation');
      }
    } catch (error: any) {
      console.error('❌ Story generation error:', error);
      Alert.alert(
        'Story Generation Failed',
        error.message || 'Failed to generate story. Please check your internet connection and try again.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Retry', onPress: () => handleGenerateStory() }
        ]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateSystemPrompt = async () => {
    if (!newPrompt.trim()) {
      Alert.alert('Error', 'Please enter a story prompt');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Please sign in to update settings');
      return;
    }

    try {
      console.log('📝 Updating system prompt...');
      
      // Update via API service
      const response = await apiService.updateSystemPrompt(newPrompt.trim(), token);
      
      if (response.success) {
        // Also update local user profile
        await updateUserProfile({ storyPrompt: newPrompt.trim() });
        
        setPromptModalVisible(false);
        setNewPrompt('');
        Alert.alert('Success', 'Story settings updated!');
      } else {
        Alert.alert('Error', response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('❌ Update system prompt error:', error);
      Alert.alert('Error', error.message || 'Failed to update settings');
    }
  };

  const renderStoryItem = ({ item }: { item: Story }) => (
    <TouchableOpacity
      style={styles.storyCard}
      onPress={() => router.push(`/story/${item.story_id}`)}
    >
      {item.thumbnail_url && (
        <Image source={{ uri: item.thumbnail_url }} style={styles.storyThumbnail} />
      )}
      <View style={styles.storyInfo}>
        <Text style={styles.storyTitle}>{item.title}</Text>
        <Text style={styles.storyPrompt} numberOfLines={2}>{item.user_prompt}</Text>
        <View style={styles.storyMeta}>
          <View style={styles.metaItem}>
            <BookOpen size={14} color="#DDA0DD" />
            <Text style={styles.metaText}>{item.total_scenes} scenes</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color="#DDA0DD" />
            <Text style={styles.metaText}>{Math.round(item.total_duration / 60000)}m</Text>
          </View>
          <View style={[styles.statusBadge, 
            item.status === 'completed' ? styles.completedBadge : 
            item.status === 'processing' ? styles.processingBadge : styles.failedBadge
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <Play size={24} color="#FF69B4" />
    </TouchableOpacity>
  );

  const renderEmptyStories = () => (
    <View style={styles.emptyState}>
      <BookOpen size={48} color="#DDA0DD" />
      <Text style={styles.emptyStateText}>No stories yet!</Text>
      <Text style={styles.emptyStateSubtext}>Create your first magical story</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello! 👋</Text>
          <Text style={styles.welcomeText}>
            Ready to create magic for {user?.childName || 'your little one'}?
          </Text>
        </View>

        {/* Child Info Card */}
        {user && (
          <View style={styles.childCard}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{user.childName}</Text>
              <Text style={styles.childAge}>Age {user.childAge}</Text>
            </View>
            <View style={styles.interestsContainer}>
              <Heart size={16} color="#FF69B4" />
              <Text style={styles.interests}>
                Loves: {user.childInterests?.join(', ') || 'Adventures'}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStoryModalVisible(true)}
            disabled={isGenerating}
          >
            <LinearGradient
              colors={isGenerating ? ['#C8A2C8', '#DDA0DD'] : ['#FF69B4', '#FF1493']}
              style={styles.buttonGradient}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size={28} color="white" />
                  <Text style={styles.primaryButtonText}>Generating Magic...</Text>
                </>
              ) : (
                <>
                  <BookOpen size={28} color="white" />
                  <Text style={styles.primaryButtonText}>Generate Story</Text>
                  <Sparkles size={20} color="white" style={styles.sparkleIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setNewPrompt(user?.storyPrompt || '');
              setPromptModalVisible(true);
            }}
          >
            <Wand2 size={24} color="#DDA0DD" />
            <Text style={styles.secondaryButtonText}>Change Story Settings</Text>
            <Settings size={18} color="#DDA0DD" />
          </TouchableOpacity>
        </View>

        {/* Recent Stories */}
        <View style={styles.storiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Stories</Text>
            {loadingStories && <ActivityIndicator size={20} color="#FF69B4" />}
          </View>
          
          {stories.length > 0 ? (
            <FlatList
              data={stories.slice(0, 5)}
              renderItem={renderStoryItem}
              keyExtractor={(item) => item.story_id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : !loadingStories ? (
            renderEmptyStories()
          ) : null}
          
          {stories.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/stories')}
            >
              <Text style={styles.viewAllText}>View All Stories</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Story Generation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={storyModalVisible}
        onRequestClose={() => setStoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Story</Text>
            <Text style={styles.modalSubtitle}>
              What adventure should we create for {user?.childName || 'your child'}?
            </Text>

            <TextInput
              style={styles.promptInput}
              multiline
              numberOfLines={4}
              value={storyPrompt}
              onChangeText={setStoryPrompt}
              placeholder="Tell me about a brave princess who..."
              placeholderTextColor="#C8A2C8"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setStoryModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isGenerating && styles.disabledButton]}
                onPress={handleGenerateStory}
                disabled={isGenerating}
              >
                <Text style={styles.saveButtonText}>
                  {isGenerating ? 'Creating...' : 'Generate Story'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* System Prompt Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={promptModalVisible}
        onRequestClose={() => setPromptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Story Settings</Text>
            <Text style={styles.modalSubtitle}>
              Customize how stories are generated for {user?.childName || 'your child'}
            </Text>

            <TextInput
              style={styles.promptInput}
              multiline
              numberOfLines={6}
              value={newPrompt}
              onChangeText={setNewPrompt}
              placeholder="Enter your story generation settings..."
              placeholderTextColor="#C8A2C8"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPromptModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateSystemPrompt}
              >
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Keep all the existing styles but add the new ones
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    lineHeight: 24,
  },
  childCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(221, 160, 221, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  childName: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
  },
  childAge: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#DDA0DD',
    backgroundColor: 'rgba(221, 160, 221, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  interests: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    flex: 1,
  },
  actionContainer: {
    gap: 16,
    marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(221, 160, 221, 0.5)',
  },
  secondaryButtonText: {
    color: '#DDA0DD',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
  storiesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
  },
  storyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(221, 160, 221, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storyThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
    marginBottom: 4,
  },
  storyPrompt: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    marginBottom: 8,
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#DDA0DD',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  completedBadge: {
    backgroundColor: '#4ECDC4',
  },
  processingBadge: {
    backgroundColor: '#FFE66D',
  },
  failedBadge: {
    backgroundColor: '#FF6B6B',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#DDA0DD',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#C8A2C8',
  },
  viewAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(221, 160, 221, 0.3)',
  },
  viewAllText: {
    color: '#FF69B4',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    textAlign: 'center',
    marginBottom: 20,
  },
  promptInput: {
    borderWidth: 2,
    borderColor: 'rgba(221, 160, 221, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(221, 160, 221, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#DDA0DD',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
});