// components/StoryCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Story } from '@/store/slices/storySlice';
import { formatDistanceToNow } from '@/utils/dateUtils';
import {
  BookOpen,
  Clock,
  Play,
  AlertCircle,
  CheckCircle,
  Loader,
  Music,
  Image as ImageIcon
} from 'lucide-react-native';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export default function StoryCard({ story, onPress }: StoryCardProps) {
  const getStatusIcon = () => {
    switch (story.status) {
      case 'processing':
        return <Loader size={16} color={Colors.warning} />;
      case 'completed':
        return <CheckCircle size={16} color={Colors.success} />;
      case 'failed':
        return <AlertCircle size={16} color={Colors.error} />;
      default:
        return <CheckCircle size={16} color={Colors.success} />;
    }
  };

  const getStatusText = () => {
    switch (story.status) {
      case 'processing':
        return 'Generating...';
      case 'completed':
        return 'Ready to play';
      case 'failed':
        return 'Generation failed';
      default:
        return 'Ready to play';
    }
  };

  const getStatusColor = () => {
    switch (story.status) {
      case 'processing':
        return Colors.warning;
      case 'completed':
        return Colors.success;
      case 'failed':
        return Colors.error;
      default:
        return Colors.success;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Unknown';

    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const hasScenes = story.scenes && story.scenes.length > 0;
  const isInteractive = story.status === 'completed' || hasScenes;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        story.status === 'processing' && styles.cardProcessing,
        story.status === 'failed' && styles.cardFailed
      ]}
      onPress={onPress}
      activeOpacity={isInteractive ? 0.8 : 0.9}
      disabled={story.status === 'processing'}
    >
      <View style={styles.cardContent}>
        {/* Thumbnail or placeholder */}
        <View style={styles.thumbnailContainer}>
          {story.thumbnail ? (
            <Image source={{ uri: story.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <BookOpen size={24} color={Colors.primary} />
            </View>
          )}

          {/* Status overlay */}
          <View style={[styles.statusOverlay, { backgroundColor: getStatusColor() }]}>
            {getStatusIcon()}
          </View>
        </View>

        {/* Story info */}
        <View style={styles.storyInfo}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {story.title}
            </Text>

            {isInteractive && (
              <TouchableOpacity style={styles.playButton}>
                <Play size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.description} numberOfLines={3}>
            {story.description}
          </Text>

          {/* Story metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataRow}>
              <View style={styles.statusContainer}>
                {getStatusIcon()}
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>

              {story.duration && story.duration > 0 && (
                <View style={styles.durationContainer}>
                  <Music size={12} color={Colors.textSecondary} />
                  <Text style={styles.durationText}>
                    {formatDuration(story.duration)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.metadataRow}>
              <View style={styles.timeContainer}>
                <Clock size={12} color={Colors.textSecondary} />
                <Text style={styles.time}>
                  {formatDistanceToNow(new Date(story.generatedTime))}
                </Text>
              </View>

              {hasScenes && (
                <View style={styles.scenesContainer}>
                  <ImageIcon size={12} color={Colors.textSecondary} />
                  <Text style={styles.scenesText}>
                    {story.scenes.length} scene{story.scenes.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Progress bar for processing stories */}
      {story.status === 'processing' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardProcessing: {
    borderColor: Colors.warning,
    backgroundColor: '#FFFAF0',
  },
  cardFailed: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 16,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  storyInfo: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  playButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    gap: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scenesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scenesText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E5E5',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: Colors.warning,
    borderRadius: 1.5,
  },
});