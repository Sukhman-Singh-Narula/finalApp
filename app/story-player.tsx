// app/story-player.tsx - UPDATED WITHOUT REDUX
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, type Story, type StoryScene } from '@/services/apiService';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, Play, Pause, SkipForward, RotateCcw, SkipBack, Volume2 } from 'lucide-react-native';

export default function StoryPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [story, setStory] = useState<Story | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    if (id) {
      loadStoryDetails();
    }
  }, [id]);

  useEffect(() => {
    // Load first scene audio when story data is available
    if (story?.scenes && story.scenes.length > 0) {
      loadSceneAudio(currentSceneIndex);
    }

    return () => {
      // Cleanup audio when component unmounts
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [story]);

  const loadStoryDetails = async () => {
    if (!id || !token) return;

    try {
      setIsLoading(true);
      console.log('📖 Loading story details for:', id);
      
      const response = await apiService.fetchStoryStatus(id);
      
      if (response.success && response.story) {
        const storyData: Story = {
          story_id: response.story.story_id || id,
          title: response.story.title || 'Unknown Story',
          user_prompt: response.story.user_prompt || '',
          created_at: response.story.generated_at || response.story.created_at || '',
          total_scenes: response.story.total_scenes || 0,
          total_duration: response.story.total_duration || 0,
          status: response.story.status || 'completed',
          thumbnail_url: response.story.thumbnail_url,
          scenes: response.story.scenes || [],
        };
        
        setStory(storyData);
        console.log('✅ Story loaded:', storyData.title);
      } else {
        Alert.alert('Error', 'Story not found');
        router.back();
      }
    } catch (error: any) {
      console.error('❌ Error loading story:', error);
      Alert.alert('Error', error.message || 'Failed to load story');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSceneAudio = async (sceneIndex: number) => {
    if (!story?.scenes || sceneIndex >= story.scenes.length) return;

    const scene = story.scenes[sceneIndex];

    if (!scene.audio_url) {
      console.warn('No audio URL for scene', sceneIndex);
      return;
    }

    try {
      // Unload previous audio
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      console.log('Loading audio from:', scene.audio_url);

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: scene.audio_url },
        { shouldPlay: false, volume: 1.0 },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      console.log('Audio loaded successfully for scene', sceneIndex);
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Audio Error', 'Failed to load audio for this scene.');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);

      // Auto-advance to next scene when current one finishes
      if (status.didJustFinish && story?.scenes && currentSceneIndex < story.scenes.length - 1) {
        handleNextScene();
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) {
      console.warn('No audio loaded');
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      Alert.alert('Playback Error', 'Failed to control audio playback.');
    }
  };

  const handleNextScene = async () => {
    if (story?.scenes && currentSceneIndex < story.scenes.length - 1) {
      const nextIndex = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIndex);
      await loadSceneAudio(nextIndex);
    }
  };

  const handlePreviousScene = async () => {
    if (currentSceneIndex > 0) {
      const prevIndex = currentSceneIndex - 1;
      setCurrentSceneIndex(prevIndex);
      await loadSceneAudio(prevIndex);
    }
  };

  const handleRestart = async () => {
    if (sound) {
      await sound.setPositionAsync(0);
      if (!isPlaying) {
        await sound.playAsync();
      }
    }
  };

  const handleSkipForward = async () => {
    if (sound) {
      const newPosition = Math.min(currentPosition + 10000, duration); // Skip 10 seconds
      await sound.setPositionAsync(newPosition);
    }
  };

  const handleSkipBackward = async () => {
    if (sound) {
      const newPosition = Math.max(currentPosition - 10000, 0); // Skip back 10 seconds
      await sound.setPositionAsync(newPosition);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCurrentScene = () => {
    return story?.scenes?.[currentSceneIndex];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Story...</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading story details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Story not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentScene = getCurrentScene();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Story Player</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.storyInfo}>
          <Text style={styles.storyTitle}>{story.title}</Text>
          <Text style={styles.storyDescription}>{story.user_prompt}</Text>

          {story.scenes && story.scenes.length > 0 && (
            <View style={styles.sceneInfo}>
              <Text style={styles.sceneCounter}>
                Scene {currentSceneIndex + 1} of {story.scenes.length}
              </Text>
            </View>
          )}
        </View>

        {/* Current scene image */}
        {currentScene?.image_url && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: currentScene.image_url }}
              style={styles.sceneImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Audio player controls */}
        <View style={styles.playerContainer}>
          {story.scenes && story.scenes.length > 0 ? (
            <>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: duration > 0 ? `${(currentPosition / duration) * 100}%` : '0%' }
                    ]}
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity
                  onPress={handlePreviousScene}
                  style={styles.controlButton}
                  disabled={currentSceneIndex === 0}
                >
                  <SkipBack size={28} color={currentSceneIndex === 0 ? Colors.textSecondary : Colors.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSkipBackward} style={styles.controlButton}>
                  <RotateCcw size={28} color={Colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePlayPause}
                  style={styles.playButton}
                  disabled={!sound}
                >
                  {isPlaying ? (
                    <Pause size={40} color={Colors.background} />
                  ) : (
                    <Play size={40} color={Colors.background} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSkipForward} style={styles.controlButton}>
                  <SkipForward size={28} color={Colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleNextScene}
                  style={styles.controlButton}
                  disabled={!story.scenes || currentSceneIndex === story.scenes.length - 1}
                >
                  <SkipForward size={28} color={(!story.scenes || currentSceneIndex === story.scenes.length - 1) ? Colors.textSecondary : Colors.text} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.noAudioContainer}>
              <Volume2 size={48} color={Colors.textSecondary} />
              <Text style={styles.noAudioText}>
                This story doesn't have audio content yet.
              </Text>
            </View>
          )}
        </View>

        {/* Current scene text */}
        <View style={styles.storyContent}>
          <Text style={styles.contentTitle}>
            {currentScene ? `Scene ${currentSceneIndex + 1}` : 'Story Content'}
          </Text>
          <Text style={styles.contentText}>
            {currentScene?.text || story.user_prompt || 'No content available.'}
          </Text>
        </View>

        {/* All scenes list */}
        {story.scenes && story.scenes.length > 1 && (
          <View style={styles.scenesContainer}>
            <Text style={styles.contentTitle}>All Scenes</Text>
            {story.scenes.map((scene, index) => (
              <TouchableOpacity
                key={scene.scene_number}
                style={[
                  styles.sceneItem,
                  index === currentSceneIndex && styles.sceneItemActive
                ]}
                onPress={() => {
                  setCurrentSceneIndex(index);
                  loadSceneAudio(index);
                }}
              >
                <Text style={[
                  styles.sceneNumber,
                  index === currentSceneIndex && styles.sceneNumberActive
                ]}>
                  {scene.scene_number}
                </Text>
                <Text style={[
                  styles.sceneText,
                  index === currentSceneIndex && styles.sceneTextActive
                ]} numberOfLines={2}>
                  {scene.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  storyInfo: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: Colors.secondary,
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  storyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  sceneInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  sceneCounter: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  imageContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sceneImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  playerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  noAudioContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAudioText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  storyContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  scenesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sceneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sceneItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sceneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 12,
    minWidth: 24,
  },
  sceneNumberActive: {
    color: Colors.background,
  },
  sceneText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  sceneTextActive: {
    color: Colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
});