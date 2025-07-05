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
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, User, Calendar, Heart, BookOpen, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    childName: '',
    childAge: '',
    interests: '',
    storyPrompt: '',
  });
  const [childImage, setChildImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setChildImage(result.assets[0].uri);
    }
  };

  const handleSignUp = async () => {
    if (!formData.email || !formData.password || !formData.childName || !formData.childAge) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const age = parseInt(formData.childAge);
    if (isNaN(age) || age < 1 || age > 18) {
      Alert.alert('Error', 'Please enter a valid age between 1 and 18');
      return;
    }

    setLoading(true);
    try {
      const interests = formData.interests.split(',').map(i => i.trim()).filter(i => i.length > 0);
      const userData = {
        childName: formData.childName,
        childAge: age,
        childInterests: interests,
        storyPrompt: formData.storyPrompt || `Create magical stories for ${formData.childName}, a ${age} year old who loves ${interests.join(', ')}.`,
        ...(childImage && { childImageUrl: childImage }),
      };

      await signUp(formData.email, formData.password, userData);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Sign Up Failed', error.message || 'Failed to create account');
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
          >
            <ArrowLeft size={24} color="#FF69B4" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Tell us about your little one</Text>

            <View style={styles.formContainer}>
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
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#C8A2C8"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

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

              <View style={styles.inputContainer}>
                <BookOpen size={20} color="#DDA0DD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Story prompt (optional)"
                  placeholderTextColor="#C8A2C8"
                  value={formData.storyPrompt}
                  onChangeText={(value) => handleInputChange('storyPrompt', value)}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={styles.imagePickerContainer}
                onPress={pickImage}
                disabled={loading}
              >
                <Camera size={24} color="#DDA0DD" />
                <Text style={styles.imagePickerText}>
                  {childImage ? 'Change Photo' : 'Add Child\'s Photo (Optional)'}
                </Text>
              </TouchableOpacity>

              {childImage && (
                <Image source={{ uri: childImage }} style={styles.selectedImage} />
              )}

              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.disabledButton]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.signUpButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
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
  imagePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: 'rgba(221, 160, 221, 0.5)',
    borderStyle: 'dashed',
    gap: 10,
  },
  imagePickerText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#DDA0DD',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#FFB6C1',
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
});