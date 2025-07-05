import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import {
    ArrowLeft,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    RotateCcw,
    RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, type Story, type StoryScene } from '@/services/apiService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StoryPlayerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { token } = useAuth();

    const [story, setStory] = useState<Story | null>(null);
    const [currentScene, setCurrentScene] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioPosition, setAudioPosition] = useState(0);
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioLoadError, setAudioLoadError] = useState<string | null>(null);
    
    const positionUpdateInterval = useRef<NodeJS.Timeout>();
    const pollInterval = useRef<NodeJS.Timeout>();

    // Configure audio settings on component mount
    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                    allowsRecordingIOS: false,
                    interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
                    interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
                });
                console.log('✅ Audio mode configured successfully');
            } catch (error) {
                console.error('❌ Failed to configure audio mode:', error);
            }
        };

        configureAudio();
    }, []);

    useEffect(() => {
        if (id) {
            fetchStoryDetails();
        }
    }, [id]);

    useEffect(() => {
        return () => {
            if (sound) {
                console.log('🧹 Cleaning up audio...');
                sound.unloadAsync();
            }
            if (positionUpdateInterval.current) {
                clearInterval(positionUpdateInterval.current);
            }
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [sound]);

    const fetchStoryDetails = async () => {
        if (!id) return;

        try {
            setLoading(true);
            console.log('📖 Fetching story details for:', id);
            
            const response = await apiService.fetchStoryStatus(id);
            console.log('📖 Story response:', response);

            if (response.success && response.story) {
                setStory(response.story);
                
                // If story is still processing, poll for updates
                if (response.story.status === 'processing') {
                    startPolling();
                }
            } else if (response.status === 'processing') {
                // Story is still being generated
                setStory({
                    story_id: id,
                    title: response.title || 'Generating...',
                    user_prompt: '',
                    status: 'processing',
                    total_scenes: 0,
                    total_duration: 0,
                    created_at: new Date().toISOString(),
                    scenes: [],
                });
                startPolling();
            } else {
                Alert.alert('Error', response.message || 'Story not found');
            }
        } catch (error: any) {
            console.error('❌ Error fetching story:', error);
            Alert.alert('Error', error.message || 'Failed to fetch story details');
        } finally {
            setLoading(false);
        }
    };

    const startPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
        }

        pollInterval.current = setInterval(async () => {
            try {
                const response = await apiService.fetchStoryStatus(id!);
                
                if (response.success && response.story) {
                    setStory(response.story);
                    
                    if (response.story.status === 'completed') {
                        clearInterval(pollInterval.current!);
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000); // Poll every 5 seconds
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStoryDetails();
        setRefreshing(false);
    };

    const loadAudio = async (audioUrl: string) => {
        try {
            console.log('🎵 Loading audio from:', audioUrl);
            setAudioLoading(true);
            setAudioLoadError(null);

            if (sound) {
                await sound.unloadAsync();
            }

            if (!audioUrl || !audioUrl.startsWith('http')) {
                throw new Error('Invalid audio URL');
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                {
                    shouldPlay: false,
                    volume: 1.0,
                    isMuted: false,
                    rate: 1.0,
                    shouldCorrectPitch: true,
                }
            );

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    setAudioDuration(status.durationMillis || 0);
                    setAudioPosition(status.positionMillis || 0);

                    if (status.didJustFinish) {
                        console.log('🎵 Audio finished, moving to next scene');
                        handleNext();
                    }
                } else if (status.error) {
                    console.error('❌ Audio playback error:', status.error);
                    setAudioLoadError('Failed to play audio');
                }
            });

            setSound(newSound);
            setAudioLoading(false);
            console.log('✅ Audio loaded successfully');
        } catch (error: any) {
            console.error('❌ Error loading audio:', error);
            setAudioLoading(false);
            setAudioLoadError(`Failed to load audio: ${error.message}`);
            Alert.alert(
                'Audio Error',
                'Failed to load audio. Please check your internet connection and try again.',
                [
                    { text: 'OK', style: 'default' },
                    { text: 'Retry', onPress: () => loadAudio(audioUrl) }
                ]
            );
        }
    };

    useEffect(() => {
        if (story && story.scenes && story.scenes[currentScene]?.audio_url) {
            const audioUrl = story.scenes[currentScene].audio_url;
            console.log('🔄 Scene changed, loading new audio:', audioUrl);
            loadAudio(audioUrl);
        }
    }, [story, currentScene]);

    const handlePlayPause = async () => {
        if (!sound) {
            console.warn('⚠️ No sound loaded');
            return;
        }

        try {
            if (isPlaying) {
                console.log('⏸️ Pausing audio');
                await sound.pauseAsync();
                setIsPlaying(false);
                if (positionUpdateInterval.current) {
                    clearInterval(positionUpdateInterval.current);
                }
            } else {
                console.log('▶️ Playing audio');
                await sound.playAsync();
                setIsPlaying(true);

                positionUpdateInterval.current = setInterval(async () => {
                    if (sound) {
                        const status = await sound.getStatusAsync();
                        if (status.isLoaded) {
                            setAudioPosition(status.positionMillis || 0);
                        }
                    }
                }, 100);
            }
        } catch (error) {
            console.error('❌ Error playing/pausing audio:', error);
            Alert.alert('Playback Error', 'Failed to play audio. Please try again.');
        }
    };

    const handleNext = () => {
        if (story && story.scenes && currentScene < story.scenes.length - 1) {
            console.log('⏭️ Moving to next scene');
            setCurrentScene(prev => prev + 1);
            setIsPlaying(false);
            if (positionUpdateInterval.current) {
                clearInterval(positionUpdateInterval.current);
            }
        } else {
            console.log('🏁 Reached end of story');
            setIsPlaying(false);
            if (positionUpdateInterval.current) {
                clearInterval(positionUpdateInterval.current);
            }
        }
    };

    const handlePrevious = () => {
        if (currentScene > 0) {
            console.log('⏮️ Moving to previous scene');
            setCurrentScene(prev => prev - 1);
            setIsPlaying(false);
            if (positionUpdateInterval.current) {
                clearInterval(positionUpdateInterval.current);
            }
        }
    };

    const handleRestart = async () => {
        console.log('🔁 Restarting current scene');
        if (sound) {
            try {
                await sound.setPositionAsync(0);
                setAudioPosition(0);
            } catch (error) {
                console.error('❌ Error restarting audio:', error);
            }
        }
    };

    const formatTime = (milliseconds: number) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <LinearGradient
                colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
                style={styles.loadingContainer}
            >
                <ActivityIndicator size="large" color="#FF69B4" />
                <Text style={styles.loadingText}>Loading story...</Text>
            </LinearGradient>
        );
    }

    if (!story) {
        return (
            <LinearGradient
                colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
                style={styles.loadingContainer}
            >
                <Text style={styles.errorText}>Story not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    if (story.status === 'processing') {
        return (
            <LinearGradient
                colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.processingContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#FF69B4" />
                    </TouchableOpacity>

                    <View style={styles.processingContent}>
                        <ActivityIndicator size="large" color="#FF69B4" />
                        <Text style={styles.processingTitle}>Creating Your Story</Text>
                        <Text style={styles.processingSubtitle}>
                            "{story.title}" is being generated with magical AI
                        </Text>
                        <Text style={styles.processingText}>
                            This usually takes 30-60 seconds. Pull down to refresh!
                        </Text>
                        
                        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                            <RefreshCw size={20} color="#FF69B4" />
                            <Text style={styles.refreshButtonText}>Check Progress</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        );
    }

    if (story.status === 'failed') {
        return (
            <LinearGradient
                colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
                style={styles.loadingContainer}
            >
                <Text style={styles.errorText}>Story generation failed</Text>
                <Text style={styles.errorSubtext}>Please try generating a new story</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    const scene = story.scenes?.[currentScene];

    if (!scene) {
        return (
            <LinearGradient
                colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
                style={styles.loadingContainer}
            >
                <Text style={styles.errorText}>Scene not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#FF69B4" />
                </TouchableOpacity>
                <Text style={styles.storyTitle} numberOfLines={1}>
                    {story.title}
                </Text>
                <View style={styles.sceneIndicator}>
                    <Text style={styles.sceneText}>
                        {currentScene + 1}/{story.scenes?.length || 0}
                    </Text>
                </View>
            </View>

            {/* Story Image */}
            <View style={styles.imageContainer}>
                {scene?.image_url ? (
                    <Image
                        source={{ uri: scene.image_url }}
                        style={styles.storyImage}
                        onError={(error) => {
                            console.error('❌ Image load error:', error);
                        }}
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>Loading image...</Text>
                    </View>
                )}
            </View>

            {/* Story Text */}
            <View style={styles.textContainer}>
                <Text style={styles.sceneTextContent}>{scene?.text}</Text>
            </View>

            {/* Audio Error Message */}
            {audioLoadError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorMessage}>{audioLoadError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => scene?.audio_url && loadAudio(scene.audio_url)}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: audioDuration > 0 ? `${(audioPosition / audioDuration) * 100}%` : '0%',
                            },
                        ]}
                    />
                </View>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(audioPosition)}</Text>
                    <Text style={styles.timeText}>{formatTime(audioDuration)}</Text>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[styles.controlButton, currentScene === 0 && styles.disabledButton]}
                    onPress={handlePrevious}
                    disabled={currentScene === 0}
                >
                    <SkipBack size={28} color={currentScene === 0 ? '#C8A2C8' : '#FF69B4'} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={handleRestart}>
                    <RotateCcw size={24} color="#FF69B4" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.playButton, (audioLoading || audioLoadError) && styles.disabledButton]}
                    onPress={handlePlayPause}
                    disabled={audioLoading || !!audioLoadError}
                >
                    {audioLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : audioLoadError ? (
                        <Text style={styles.errorIcon}>!</Text>
                    ) : isPlaying ? (
                        <Pause size={32} color="white" />
                    ) : (
                        <Play size={32} color="white" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton}>
                    <Volume2 size={24} color="#FF69B4" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        currentScene === (story.scenes?.length || 0) - 1 && styles.disabledButton,
                    ]}
                    onPress={handleNext}
                    disabled={currentScene === (story.scenes?.length || 0) - 1}
                >
                    <SkipForward
                        size={28}
                        color={
                            currentScene === (story.scenes?.length || 0) - 1 ? '#C8A2C8' : '#FF69B4'
                        }
                    />
                </TouchableOpacity>
            </View>

            {/* Scene Navigation */}
            <View style={styles.sceneNavigation}>
                {story.scenes?.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.sceneDot,
                            index === currentScene && styles.activeSceneDot,
                        ]}
                        onPress={() => {
                            console.log(`📍 Navigating to scene ${index + 1}`);
                            setCurrentScene(index);
                            setIsPlaying(false);
                        }}
                    />
                ))}
            </View>
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
        paddingHorizontal: 20,
    },
    processingContainer: {
        flex: 1,
        paddingTop: 100,
        paddingHorizontal: 20,
    },
    processingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    processingTitle: {
        fontSize: 24,
        fontFamily: 'Nunito-Bold',
        color: '#FF69B4',
        marginTop: 24,
        textAlign: 'center',
    },
    processingSubtitle: {
        fontSize: 18,
        fontFamily: 'Nunito-SemiBold',
        color: '#8B7D8B',
        marginTop: 8,
        textAlign: 'center',
    },
    processingText: {
        fontSize: 16,
        fontFamily: 'Nunito-Regular',
        color: '#8B7D8B',
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginTop: 24,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 105, 180, 0.3)',
    },
    refreshButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito-SemiBold',
        color: '#FF69B4',
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Nunito-Regular',
        color: '#FF69B4',
        marginTop: 16,
    },
    errorText: {
        fontSize: 18,
        fontFamily: 'Nunito-SemiBold',
        color: '#FF6B6B',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        fontFamily: 'Nunito-Regular',
        color: '#8B7D8B',
        marginBottom: 16,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: '#FF69B4',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
    backButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito-SemiBold',
        color: 'white',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyTitle: {
        flex: 1,
        fontSize: 20,
        fontFamily: 'Nunito-Bold',
        color: '#FF69B4',
        textAlign: 'center',
        marginHorizontal: 16,
    },
    sceneIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    sceneText: {
        fontSize: 14,
        fontFamily: 'Nunito-SemiBold',
        color: '#FF69B4',
    },
    imageContainer: {
        flex: 1,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    storyImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(221, 160, 221, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 16,
        fontFamily: 'Nunito-Regular',
        color: '#DDA0DD',
    },
    textContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(221, 160, 221, 0.3)',
    },
    sceneTextContent: {
        fontSize: 16,
        fontFamily: 'Nunito-Regular',
        color: '#333',
        lineHeight: 24,
        textAlign: 'center',
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    errorMessage: {
        fontSize: 14,
        fontFamily: 'Nunito-Regular',
        color: '#FF6B6B',
        flex: 1,
    },
    retryButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 14,
        fontFamily: 'Nunito-SemiBold',
        color: 'white',
    },
    progressContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(221, 160, 221, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF69B4',
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    timeText: {
        fontSize: 12,
        fontFamily: 'Nunito-Regular',
        color: '#8B7D8B',
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 20,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(221, 160, 221, 0.3)',
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF69B4',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.5,
    },
    errorIcon: {
        fontSize: 24,
        fontFamily: 'Nunito-Bold',
        color: 'white',
    },
    sceneNavigation: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 8,
    },
    sceneDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(221, 160, 221, 0.5)',
    },
    activeSceneDot: {
        backgroundColor: '#FF69B4',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});