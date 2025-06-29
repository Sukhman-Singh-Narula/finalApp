import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Story } from '@/store/slices/storySlice';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { BookOpen, Clock } from 'lucide-react-native';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export default function StoryCard({ story, onPress }: StoryCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <BookOpen size={20} color={Colors.primary} />
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
      </View>
      
      <Text style={styles.description} numberOfLines={3}>
        {story.description}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.timeContainer}>
          <Clock size={14} color={Colors.textSecondary} />
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(story.generatedTime))}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});