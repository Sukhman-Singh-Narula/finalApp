// app/auth/signup.tsx - UPDATED VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, User, Calendar, Heart, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    childName: '',
    childAge: '',
    parentName: '',
    interests: '',
    storyPrompt: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword, childName, childAge, parentName } = formData;

    // Required fields
    if (!email || !password || !childName || !childAge || !parentName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Age validation
    const age = parseInt(childAge);
    if (isNaN(age) || age < 1 || age > 18) {
      Alert.alert('Error', 'Please enter a valid age between 1 and 18');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('📝 Starting signup process...');
      
      // Parse interests
      const interests = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      // Prepare user data
      const userData = {
        childName: formData.childName.trim(),
        childAge: parseInt(formData.childAge),
        childInterests: interests,
        parentName: formData.parentName.trim(),
        storyPrompt: formData.storyPrompt.trim() || 
          `Create magical stories for ${formData.childName}, a ${formData.childAge} year old who loves ${interests.join(', ')}.`,
      };

      console.log('📝 Signup data prepared:', userData);

      await signUp(formData.email.toLowerCase().trim(), formData.password, userData);
      
      console.log('✅ Signup successful, navigating to main app');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle specific error messages
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email') && msg.includes('exists')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (msg.includes('weak') || msg.includes('password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (msg.includes('invalid') && msg.includes('email')) {
          errorMessage = 'Invalid email address. Please check and try again.';
        } else if (msg.includes('network') || msg.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFE4E1', '#E6E6FA']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <ArrowLeft size={24} color="#FF69B4" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Tell us about your little one</Text>

            <View style={styles.formContainer}>
              {/* Account Information */}
              <Text style={styles.sectionTitle}>Account Information</Text>
              
              <View style={styles.inputContainer}>
                <Mail size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your Email"
                  placeholderTextColor="#C8A2C8"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor="#C8A2C8"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#DDA0DD" />
                  ) : (
                    <Eye size={20} color="#DDA0DD" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#C8A2C8"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#DDA0DD" />
                  ) : (
                    <Eye size={20} color="#DDA0DD" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Parent Information */}
              <Text style={styles.sectionTitle}>Parent Information</Text>
              
              <View style={styles.inputContainer}>
                <User size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your Name"
                  placeholderTextColor="#C8A2C8"
                  value={formData.parentName}
                  onChangeText={(value) => handleInputChange('parentName', value)}
                  editable={!loading}
                />
              </View>

              {/* Child Information */}
              <Text style={styles.sectionTitle}>Child Information</Text>
              
              <View style={styles.inputContainer}>
                <User size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Child's Name"
                  placeholderTextColor="#C8A2C8"
                  value={formData.childName}
                  onChangeText={(value) => handleInputChange('childName', value)}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Calendar size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Child's Age"
                  placeholderTextColor="#C8A2C8"
                  value={formData.childAge}
                  onChangeText={(value) => handleInputChange('childAge', value)}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Heart size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Interests (separated by commas)"
                  placeholderTextColor="#C8A2C8"
                  value={formData.interests}
                  onChangeText={(value) => handleInputChange('interests', value)}
                  multiline
                  editable={!loading}
                />
              </View>

              <Text style={styles.helperText}>
                Example: dinosaurs, princesses, space, animals
              </Text>

              {/* Optional Story Preferences */}
              <Text style={styles.sectionTitle}>Story Preferences (Optional)</Text>
              
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Custom story instructions (optional)"
                  placeholderTextColor="#C8A2C8"
                  value={formData.storyPrompt}
                  onChangeText={(value) => handleInputChange('storyPrompt', value)}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>

              <Text style={styles.helperText}>
                Leave blank to use smart defaults based on your child's age and interests.
              </Text>

              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.disabledButton]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.signUpButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/auth/login')}
                  disabled={loading}
                >
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 120,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#FF69B4',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF69B4',
    marginTop: 10,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(221, 160, 221, 0.3)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#333',
  },
  eyeButton: {
    padding: 4,
  },
  textAreaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(221, 160, 221, 0.3)',
    padding: 16,
  },
  textArea: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
    fontStyle: 'italic',
    marginTop: -8,
    marginBottom: 8,
  },
  signUpButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#8B7D8B',
  },
  loginLink: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF69B4',
  },
});