// app/(tabs)/library.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { loadUserStories, setCurrentStory, setCurrentServerStory, refreshStories } from '@/store/slices/storySlice';
import StoryCard from '@/components/StoryCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import CustomButton from '@/components/CustomButton';
import { Colors } from '@/constants/Colors';
import { Library, RefreshCw } from 'lucide-react-native';

export default function LibraryScreen() {
  const dispatch = useAppDispatch();
  const { stories, isLoadingStories } = useAppSelector((state) => state.stories);
  const { firebase_token } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // Load stories when component mounts
  useEffect(() => {
    if (firebase_token && stories.length === 0) {
      dispatch(loadUserStories(firebase_token));
    }
  }, [firebase_token, dispatch]);

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
        // Story is just metadata, set current story and let player load details
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
      Alert.alert('Refresh Failed', 'Unable to refresh stories. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await handleRefresh();
  };

  const renderStoryCard = ({ item }: { item: any }) => (
    <StoryCard story={item} onPress={() => handleStoryPress(item)} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Library size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Stories Yet</Text>
      <Text style={styles.emptyText}>
        Your generated stories will appear here. Start creating magical adventures!
      </Text>
      {firebase_token && (
        <CustomButton
          title="Load Stories"
          onPress={() => dispatch(loadUserStories(firebase_token))}
          style={styles.loadButton}
          disabled={isLoadingStories}
        />
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <LoadingSpinner message="Loading your magical stories..." />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Story Library</Text>
        <Text style={styles.subtitle}>
          All your magical stories in one place
        </Text>
        {stories.length > 0 && (
          <Text style={styles.storyCount}>
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} created
          </Text>
        )}
      </View>
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
  );

  if (isLoadingStories && stories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={stories}
        renderItem={renderStoryCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={stories.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: Colors.secondary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  storyCount: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  refreshButton: {
    minWidth: 80,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    marginBottom: 24,
  },
  loadButton: {
    minWidth: 120,
  },
  separator: {
    height: 8,
  },
});