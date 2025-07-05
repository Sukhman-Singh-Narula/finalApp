import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Search,
    BookOpen,
    Clock,
    Play,
    Plus,
    Calendar,
    Trash2,
    RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, type Story } from '@/services/apiService';

export default function StoriesListScreen() {
    const router = useRouter();
    const { user, token } = useAuth();

    const [stories, setStories] = useState<Story[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'duration' | 'title'>('date');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 20;

    useEffect(() => {
        if (token) {
            fetchStories(true);
        }
    }, [token]);

    const fetchStories = async (reset: boolean = false) => {
        if (!token) return;

        try {
            if (reset) {
                setLoading(true);
                setOffset(0);
            } else {
                setLoadingMore(true);
            }

            const currentOffset = reset ? 0 : offset;
            const response = await apiService.getUserStories(token, limit, currentOffset);

            if (response.success && response.stories) {
                if (reset) {
                    setStories(response.stories);
                } else {
                    setStories(prev => [...prev, ...response.stories]);
                }
                
                setHasMore(response.has_more || false);
                setOffset(currentOffset + limit);
            }
        } catch (error: any) {
            console.error('Error fetching stories:', error);
            Alert.alert('Error', 'Failed to fetch stories');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStories(true);
        setRefreshing(false);
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchStories(false);
        }
    };

    const deleteStory = async (storyId: string) => {
        if (!token) return;

        Alert.alert(
            'Delete Story',
            'Are you sure you want to delete this story? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.deleteUserStory(storyId, token);
                            if (response.success) {
                                setStories(prev => prev.filter(s => s.story_id !== storyId));
                                Alert.alert('Success', 'Story deleted successfully');
                            } else {
                                Alert.alert('Error', response.message || 'Failed to delete story');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete story');
                        }
                    }
                }
            ]
        );
    };

    const filteredStories = stories
        .filter(story =>
            story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            story.user_prompt.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
                case 'duration':
                    return b.total_duration - a.total_duration;
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

    const handleStoryPress = (story: Story) => {
        if (story.status === 'completed') {
            router.push(`/story/${story.story_id}`);
        } else if (story.status === 'processing') {
            Alert.alert(
                'Story Still Generating',
                'This story is still being created. Would you like to check its progress?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Check Progress', onPress: () => router.push(`/story/${story.story_id}`) }
                ]
            );
        } else {
            Alert.alert('Story Failed', 'This story failed to generate. Please try creating a new one.');
        }
    };

    const handleCreateNewStory = () => {
        router.push('/(tabs)'); // Go to home tab where story creation is
    };

    const formatTime = (milliseconds: number): string => {
        const minutes = Math.floor(milliseconds / 60000);
        if (minutes < 1) return 'Less than 1 minute';
        if (minutes === 1) return '1 minute';
        return `${minutes} minutes`;
    };

    const formatDate = (date: string): string => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const renderStoryItem = ({ item }: { item: Story }) => (
        <TouchableOpacity
            style={styles.storyCard}
            onPress={() => handleStoryPress(item)}
        >
            <View style={styles.storyImageContainer}>
                {item.thumbnail_url ? (
                    <Image source={{ uri: item.thumbnail_url }} style={styles.storyImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <BookOpen size={24} color="#DDA0DD" />
                    </View>
                )}
                <View style={[styles.statusOverlay, 
                    item.status === 'completed' ? styles.completedOverlay : 
                    item.status === 'processing' ? styles.processingOverlay : styles.failedOverlay
                ]}>
                    {item.status === 'completed' ? (
                        <Play size={16} color="white" />
                    ) : item.status === 'processing' ? (
                        <ActivityIndicator size={16} color="white" />
                    ) : (
                        <Text style={styles.failedIcon}>!</Text>
                    )}
                </View>
            </View>

            <View style={styles.storyContent}>
                <Text style={styles.storyTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.storyPrompt} numberOfLines={2}>
                    {item.user_prompt}
                </Text>

                <View style={styles.storyMeta}>
                    <View style={styles.metaItem}>
                        <BookOpen size={14} color="#DDA0DD" />
                        <Text style={styles.metaText}>{item.total_scenes} scenes</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Clock size={14} color="#DDA0DD" />
                        <Text style={styles.metaText}>
                            {formatTime(item.total_duration)}
                        </Text>
                    </View>
                    {item.created_at && (
                        <View style={styles.metaItem}>
                            <Calendar size={14} color="#DDA0DD" />
                            <Text style={styles.metaText}>
                                {formatDate(item.created_at)}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={[styles.statusBadge, 
                    item.status === 'completed' ? styles.completedBadge : 
                    item.status === 'processing' ? styles.processingBadge : styles.failedBadge
                ]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.actionButtons}>
                {item.status === 'completed' && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            deleteStory(item.story_id);
                        }}
                    >
                        <Trash2 size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                )}
                {item.status === 'processing' && (
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleStoryPress(item);
                        }}
                    >
                        <RefreshCw size={16} color="#FFE66D" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <BookOpen size={64} color="#DDA0DD" />
            <Text style={styles.emptyStateTitle}>No Stories Yet!</Text>
            <Text style={styles.emptyStateSubtitle}>
                Create your first magical story for {user?.childName || 'your child'}
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateNewStory}>
                <Plus size={20} color="white" />
                <Text style={styles.createButtonText}>Create Story</Text>
            </TouchableOpacity>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={20} color="#DDA0DD" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search stories..."
                    placeholderTextColor="#C8A2C8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Sort Options */}
            <View style={styles.sortContainer}>
                <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
                    onPress={() => setSortBy('date')}
                >
                    <Calendar size={16} color={sortBy === 'date' ? 'white' : '#DDA0DD'} />
                    <Text style={[styles.sortText, sortBy === 'date' && styles.activeSortText]}>
                        Date
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'duration' && styles.activeSortButton]}
                    onPress={() => setSortBy('duration')}
                >
                    <Clock size={16} color={sortBy === 'duration' ? 'white' : '#DDA0DD'} />
                    <Text style={[styles.sortText, sortBy === 'duration' && styles.activeSortText]}>
                        Duration
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'title' && styles.activeSortButton]}
                    onPress={() => setSortBy('title')}
                >
                    <BookOpen size={16} color={sortBy === 'title' ? 'white' : '#DDA0DD'} />
                    <Text style={[styles.sortText, sortBy === 'title' && styles.activeSortText]}>
                        Title
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Stories Count */}
            <Text style={styles.storiesCount}>
                {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
            </Text>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#FF69B4" />
                <Text style={styles.loadingText}>Loading more stories...</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <LinearGradient
                colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
                style={styles.loadingContainer}
            >
                <ActivityIndicator size="large" color="#FF69B4" />
                <Text style={styles.loadingText}>Loading your stories...</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={styles.title}>My Stories</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleCreateNewStory}>
                    <Plus size={24} color="#FF69B4" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredStories}
                renderItem={renderStoryItem}
                keyExtractor={(item) => item.story_id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FF69B4']}
                        tintColor="#FF69B4"
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 32,
        fontFamily: 'Nunito-Bold',
        color: '#FF69B4',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 105, 180, 0.3)',
    },
    listContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    headerContainer: {
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(221, 160, 221, 0.3)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontFamily: 'Nunito-Regular',
        color: '#333',
    },
    sortContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(221, 160, 221, 0.3)',
    },
    activeSortButton: {
        backgroundColor: '#FF69B4',
    },
    sortText: {
        fontSize: 14,
        fontFamily: 'Nunito-SemiBold',
        color: '#DDA0DD',
    },
    activeSortText: {
        color: 'white',
    },
    storiesCount: {
        fontSize: 14,
        fontFamily: 'Nunito-Regular',
        color: '#8B7D8B',
        textAlign: 'center',
    },
    storyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(221, 160, 221, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    storyImageContainer: {
        position: 'relative',
        marginRight: 16,
    },
    storyImage: {
        width: 80,
        height: 80,
        borderRadius: 15,
    },
    placeholderImage: {
        width: 80,
        height: 80,
        borderRadius: 15,
        backgroundColor: 'rgba(221, 160, 221, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusOverlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedOverlay: {
        backgroundColor: 'rgba(78, 205, 196, 0.8)',
    },
    processingOverlay: {
        backgroundColor: 'rgba(255, 230, 109, 0.8)',
    },
    failedOverlay: {
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
    },
    failedIcon: {
        fontSize: 16,
        fontFamily: 'Nunito-Bold',
        color: 'white',
    },
    storyContent: {
        flex: 1,
    },
    storyTitle: {
        fontSize: 18,
        fontFamily: 'Nunito-Bold',
        color: '#FF69B4',
        marginBottom: 4,
    },
    storyPrompt: {
        fontSize: 14,
        fontFamily: 'Nunito-Regular',
        color: '#8B7D8B',
        marginBottom: 12,
        lineHeight: 20,
    },
    storyMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
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
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
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
    actionButtons: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 230, 109, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontFamily: 'Nunito-Bold',
        color: '#DDA0DD',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 16,
        fontFamily: 'Nunito-Regular',
        color: '#C8A2C8',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF69B4',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Nunito-SemiBold',
    },
    loadingFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: 'Nunito-Regular',
        color: '#8B7D8B',
    },
});