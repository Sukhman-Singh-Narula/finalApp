import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { updateStoryPlayback } from '@/store/slices/storySlice';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, Play, Pause, SkipForward, RotateCcw } from 'lucide-react-native';

export default function StoryPlayerScreen() {
  const dispatch = useAppDispatch();
  const { currentStory } = useAppSelector((state) => state.stories);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration] = useState(180); // Mock duration in seconds

  useEffect(() => {
    if (currentStory) {
      setIsPlaying(currentStory.isPlaying || false);
      setCurrentPosition(currentStory.currentPosition || 0);
    }
  }, [currentStory]);

  const handlePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    
    if (currentStory) {
      dispatch(updateStoryPlayback({
        id: currentStory.id,
        isPlaying: newIsPlaying,
        currentPosition,
      }));
    }
  };

  const handleSkipForward = () => {
    const newPosition = Math.min(currentPosition + 30, duration);
    setCurrentPosition(newPosition);
    
    if (currentStory) {
      dispatch(updateStoryPlayback({
        id: currentStory.id,
        isPlaying,
        currentPosition: newPosition,
      }));
    }
  };

  const handleRestart = () => {
    setCurrentPosition(0);
    setIsPlaying(true);
    
    if (currentStory) {
      dispatch(updateStoryPlayback({
        id: currentStory.id,
        isPlaying: true,
        currentPosition: 0,
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentStory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Story not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.storyTitle}>{currentStory.title}</Text>
          <Text style={styles.storyDescription}>{currentStory.description}</Text>
        </View>

        <View style={styles.playerContainer}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(currentPosition / duration) * 100}%` }
                ]} 
              />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={handleRestart} style={styles.controlButton}>
              <RotateCcw size={32} color={Colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
              {isPlaying ? (
                <Pause size={40} color={Colors.background} />
              ) : (
                <Play size={40} color={Colors.background} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleSkipForward} style={styles.controlButton}>
              <SkipForward size={32} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.storyContent}>
          <Text style={styles.contentTitle}>Story Content</Text>
          <Text style={styles.contentText}>{currentStory.content}</Text>
        </View>
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
  storyInfo: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
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
    gap: 32,
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
  storyContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
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