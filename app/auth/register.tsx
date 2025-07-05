// app/auth/register.tsx - UPDATED TO USE AUTH CONTEXT
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { Colors } from '@/constants/Colors';
import { X } from 'lucide-react-native';

const interests = [
  'Adventures', 'Animals', 'Magic', 'Science', 'Space', 'Pirates',
  'Princesses', 'Dragons', 'Dinosaurs', 'Fairy Tales', 'Sports', 'Music'
];

export default function RegisterScreen() {
  const { email, password } = useLocalSearchParams<{
    email: string;
    password: string;
  }>();

  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    parentName: '',
    parentPhone: '',
    storyPrompt: '',
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.childName.trim()) {
      newErrors.childName = 'Child name is required';
    }

    const age = parseInt(formData.childAge);
    if (!formData.childAge.trim() || isNaN(age) || age < 3 || age > 12) {
      newErrors.childAge = 'Please enter a valid age between 3-12';
    }

    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Parent name is required';
    }

    if (selectedInterests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );

    // Clear interests error if they select one
    if (errors.interests && !selectedInterests.includes(interest)) {
      setErrors(prev => ({ ...prev, interests: '' }));
    }
  };

  const generateSystemPrompt = () => {
    const interests_str = selectedInterests.join(', ');
    return formData.storyPrompt ||
      `Create magical, educational stories suitable for ${formData.childName}, a ${formData.childAge}-year-old child who loves ${interests_str}. Use age-appropriate language with simple, engaging stories that build imagination and confidence.`;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log('🔐 Starting registration process...');
      
      // Prepare user data for AuthContext signUp method
      const userData = {
        childName: formData.childName.trim(),
        childAge: parseInt(formData.childAge),
        childInterests: selectedInterests,
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        storyPrompt: generateSystemPrompt(),
      };

      console.log('📝 Registration data prepared:', userData);

      // Use AuthContext signUp method which handles both Firebase auth and profile creation
      await signUp(email!, password!, userData);

      // Success! Show success message and redirect
      Alert.alert(
        'Welcome to Story Magic!',
        `Profile created successfully for ${formData.childName}. Let's start creating magical stories!`,
        [
          {
            text: 'Start Creating Stories',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);

      // Show user-friendly error message
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email') && msg.includes('exists')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (msg.includes('weak') && msg.includes('password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (msg.includes('invalid') && msg.includes('email')) {
          errorMessage = 'Invalid email address. Please check and try again.';
        } else if (msg.includes('network') || msg.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Creating your magical story account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Tell Us About Your Child</Text>
          <Text style={styles.subtitle}>
            This helps us create personalized stories that your child will love!
          </Text>

          <View style={styles.form}>
            <CustomInput
              label="Child's Name"
              value={formData.childName}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, childName: text }));
                if (errors.childName) {
                  setErrors(prev => ({ ...prev, childName: '' }));
                }
              }}
              placeholder="Enter your child's name"
              error={errors.childName}
            />

            <CustomInput
              label="Child's Age"
              value={formData.childAge}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, childAge: text }));
                if (errors.childAge) {
                  setErrors(prev => ({ ...prev, childAge: '' }));
                }
              }}
              placeholder="Enter age (3-12)"
              keyboardType="numeric"
              error={errors.childAge}
            />

            <View style={styles.interestsSection}>
              <Text style={styles.label}>Child's Interests</Text>
              <Text style={styles.helperText}>Select all that apply:</Text>
              <View style={styles.interestsGrid}>
                {interests.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestChip,
                      selectedInterests.includes(interest) && styles.interestChipSelected
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[
                      styles.interestText,
                      selectedInterests.includes(interest) && styles.interestTextSelected
                    ]}>
                      {interest}
                    </Text>
                    {selectedInterests.includes(interest) && (
                      <X size={16} color={Colors.background} style={styles.removeIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {errors.interests && <Text style={styles.errorText}>{errors.interests}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parent Information</Text>

              <CustomInput
                label="Your Name"
                value={formData.parentName}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, parentName: text }));
                  if (errors.parentName) {
                    setErrors(prev => ({ ...prev, parentName: '' }));
                  }
                }}
                placeholder="Enter your name"
                error={errors.parentName}
              />

              <CustomInput
                label="Email Address"
                value={email || ''}
                editable={false}
                style={styles.readOnlyInput}
              />

              <CustomInput
                label="Phone Number (Optional)"
                value={formData.parentPhone}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, parentPhone: text }));
                }}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Story Preferences (Optional)</Text>

              <CustomInput
                label="Custom Story Instructions"
                value={formData.storyPrompt}
                onChangeText={(text) => setFormData(prev => ({ ...prev, storyPrompt: text }))}
                placeholder="Any special instructions for story generation..."
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              <Text style={styles.helperText}>
                Leave blank to use our smart defaults based on {formData.childName || "your child"}'s age and interests.
              </Text>
            </View>

            <CustomButton
              title="Complete Registration"
              onPress={handleRegister}
              style={styles.registerButton}
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  interestsSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  interestChipSelected: {
    backgroundColor: Colors.primary,
  },
  interestText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  interestTextSelected: {
    color: Colors.background,
  },
  removeIcon: {
    marginLeft: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
  },
  registerButton: {
    marginTop: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 4,
  },
});