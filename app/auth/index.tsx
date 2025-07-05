import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Sparkles } from 'lucide-react-native';

export default function AuthWelcome() {
  const router = useRouter();

  const handleGetStarted = () => {
    console.log('📝 Navigating to signup...');
    router.push('/auth/signup');
  };

  const handleSignIn = () => {
    console.log('🔐 Navigating to login...');
    router.push('/auth/login');
  };

  return (
    <LinearGradient
      colors={['#FFE4E1', '#E6E6FA', '#F0F8FF']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <BookOpen size={64} color="#FF69B4" />
          <Sparkles size={32} color="#DDA0DD" style={styles.sparkle} />
        </View>
        
        <Text style={styles.title}>Story Magic</Text>
        <Text style={styles.subtitle}>
          Create magical stories for your little one
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.signUpButton]}
            onPress={handleGetStarted}
          >
            <Text style={styles.signUpButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={handleSignIn}
          >
            <Text style={styles.loginButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  sparkle: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButton: {
    backgroundColor: '#FF69B4',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#DDA0DD',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
  },
  loginButtonText: {
    color: '#DDA0DD',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
});