import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { setCurrentStory } from '@/store/slices/storySlice';
import StoryCard from '@/components/StoryCard';
import { Colors } from '@/constants/Colors';
import { Library } from 'lucide-react-native';

export default function LibraryScreen() {
  const dispatch = useAppDispatch();
  const { stories } = useAppSelector((state) => state.stories);

  const handleStoryPress = (story: any) => {
    dispatch(setCurrentStory(story));
    router.push('/story-player');
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Story Library</Text>
        <Text style={styles.subtitle}>
          All your magical stories in one place
        </Text>
      </View>

      <FlatList
        data={stories}
        renderItem={renderStoryCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={stories.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
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
  },
});