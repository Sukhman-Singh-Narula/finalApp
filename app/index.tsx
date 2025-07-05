// app/index.tsx - UPDATED VERSION
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';

export default function IndexPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [healthCheck, setHealthCheck] = useState<string>('checking');

  useEffect(() => {
    // Perform health check when app starts
    checkServerHealth();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user && token) {
        console.log('✅ User authenticated, navigating to main app');
        router.replace('/(tabs)');
      } else {
        console.log('❌ User not authenticated, navigating to auth');
        router.replace('/auth');
      }
    }
  }, [user, token, loading, router]);

  const checkServerHealth = async () => {
    try {
      console.log('🏥 Checking server health...');
      const response = await apiService.healthCheck();
      
      if (response.status === 'healthy') {
        setHealthCheck('healthy');
        console.log('✅ Server is healthy');
      } else {
        setHealthCheck('unhealthy');
        console.warn('⚠️ Server health check returned unhealthy status');
      }
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      setHealthCheck('unhealthy');
    }
  };

  const getStatusMessage = () => {
    if (loading) {
      return 'Loading your account...';
    }
    
    switch (healthCheck) {
      case 'checking':
        return 'Connecting to Story Magic servers...';
      case 'unhealthy':
        return 'Having trouble connecting to servers...';
      case 'healthy':
        if (user && token) {
          return `Welcome back, ${user.childName}'s parent!`;
        } else {
          return 'Ready to create magical stories!';
        }
      default:
        return 'Starting Story Magic...';
    }
  };

  const getStatusColor = () => {
    switch (healthCheck) {
      case 'unhealthy':
        return '#FF6B6B';
      case 'healthy':
        return '#4ECDC4';
      default:
        return '#FFB6C1';
    }
  };

  return (
    <LinearGradient
      colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Story Magic</Text>
        <Text style={styles.subtitle}>Creating magical stories for your little one</Text>
        
        <ActivityIndicator 
          size="large" 
          color={getStatusColor()} 
          style={styles.spinner}
        />
        
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusMessage()}
        </Text>
        
        {healthCheck === 'unhealthy' && (
          <Text style={styles.errorHint}>
            Please check your internet connection and try again
          </Text>
        )}
        
        {user && (
          <Text style={styles.userInfo}>
            Stories for {user.childName}, age {user.childAge}
          </Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  spinner: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userInfo: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#DDA0DD',
    textAlign: 'center',
    marginTop: 20,
  },
});