// components/StoryCard.tsx - ENHANCED VERSION
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Story } from '@/services/apiService';
import {
  BookOpen,
  Clock,
  Play,
  AlertCircle,
  CheckCircle,
  Loader,
  Calendar,
  Music,
  Zap
} from 'lucide-react-native';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export default function StoryCard({ story, onPress }: StoryCardProps) {
  const getStatusIcon = () => {
    switch (story.status) {
      case 'processing':
        return <Loader size={16} color="#FFE66D" />;
      case 'completed':
        return <CheckCircle size={16} color="#4ECDC4" />;
      case 'failed':
        return <AlertCircle size={16} color="#FF6B6B" />;
      default:
        return <CheckCircle size={16} color="#4ECDC4" />;
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
        return '#FFE66D';
      case 'completed':
        return '#4ECDC4';
      case 'failed':
        return '#FF6B6B';
      default:
        return '#4ECDC4';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration || duration === 0) return 'Unknown duration';

    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDistanceToNow = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Unknown time';
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
        {/* Left side - Story icon/thumbnail placeholder */}
        <View style={styles.iconContainer}>
          {story.thumbnail_url ? (
            <Image source={{ uri: story.thumbnail_url }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.iconPlaceholder, { backgroundColor: getStatusColor() + '20' }]}>
              <BookOpen size={24} color={getStatusColor()} />
            </View>
          )}

          {/* Status indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
            {getStatusIcon()}
          </View>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Title and play button */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {story.title || 'Untitled Story'}
            </Text>
            
            {isInteractive && (
              <TouchableOpacity style={styles.playButton}>
                <Play size={16} color="#FF69B4" fill="#FF69B4" />
              </TouchableOpacity>
            )}
          </View>

          {/* User prompt/description */}
          <Text style={styles.description} numberOfLines={2}>
            {story.user_prompt || 'No description available'}
          </Text>

          {/* Metadata row */}
          <View style={styles.metadataRow}>
            {/* Status */}
            <View style={styles.metadataItem}>
              {getStatusIcon()}
              <Text style={[styles.metadataText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>

            {/* Time created */}
            <View style={styles.metadataItem}>
              <Calendar size={12} color="#8B7D8B" />
              <Text style={styles.metadataText}>
                {formatDistanceToNow(story.created_at)}
              </Text>
            </View>
          </View>

          {/* Additional info row */}
          <View style={styles.metadataRow}>
            {/* Duration */}
            {story.total_duration && story.total_duration > 0 && (
              <View style={styles.metadataItem}>
                <Music size={12} color="#8B7D8B" />
                <Text style={styles.metadataText}>
                  {formatDuration(story.total_duration)}
                </Text>
              </View>
            )}

            {/* Scenes count */}
            {story.total_scenes && story.total_scenes > 0 && (
              <View style={styles.metadataItem}>
                <Zap size={12} color="#8B7D8B" />
                <Text style={styles.metadataText}>
                  {story.total_scenes} scene{story.total_scenes !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Progress bar for processing stories */}
      {story.status === 'processing' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>Generating your magical story...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(221, 160, 221, 0.2)',
    overflow: 'hidden',
  },
  cardProcessing: {
    borderColor: '#FFE66D',
    backgroundColor: 'rgba(255, 230, 109, 0.05)',
  },
  cardFailed: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  iconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
  },
  statusIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  playButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    lineHeight: 18,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
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
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: '#FFE66D',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#FFE66D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});