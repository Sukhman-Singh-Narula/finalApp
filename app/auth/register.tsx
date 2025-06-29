import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppDispatch } from '@/hooks';
import { loginStart, loginSuccess } from '@/store/slices/authSlice';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { X } from 'lucide-react-native';

const interests = [
  'Adventures', 'Animals', 'Magic', 'Science', 'Space', 'Pirates',
  'Princesses', 'Dragons', 'Dinosaurs', 'Fairy Tales', 'Sports', 'Music'
];

export default function RegisterScreen() {
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    parentName: '',
    parentPhone: '',
    defaultSystemPrompt: '',
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

    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Phone number is required';
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
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    dispatch(loginStart());

    try {
      // Mock registration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const userData = {
        id: Date.now().toString(),
        childName: formData.childName,
        childAge: parseInt(formData.childAge),
        childInterests: selectedInterests,
        parentEmail: email,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        defaultSystemPrompt: formData.defaultSystemPrompt || 
          `Create magical, educational stories suitable for ${formData.childName}, a ${formData.childAge}-year-old child who loves ${selectedInterests.join(', ')}.`,
      };

      dispatch(loginSuccess(userData));
      router.replace('/(tabs)');
    } catch (error) {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Creating your account..." />
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
              onChangeText={(text) => setFormData(prev => ({ ...prev, childName: text }))}
              placeholder="Enter your child's name"
              error={errors.childName}
            />

            <CustomInput
              label="Child's Age"
              value={formData.childAge}
              onChangeText={(text) => setFormData(prev => ({ ...prev, childAge: text }))}
              placeholder="Enter age (3-12)"
              keyboardType="numeric"
              error={errors.childAge}
            />

            <View style={styles.interestsSection}>
              <Text style={styles.label}>Child's Interests</Text>
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

            <CustomInput
              label="Parent Name"
              value={formData.parentName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, parentName: text }))}
              placeholder="Enter your name"
              error={errors.parentName}
            />

            <CustomInput
              label="Phone Number"
              value={formData.parentPhone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, parentPhone: text }))}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              error={errors.parentPhone}
            />

            <CustomInput
              label="Custom Story Instructions (Optional)"
              value={formData.defaultSystemPrompt}
              onChangeText={(text) => setFormData(prev => ({ ...prev, defaultSystemPrompt: text }))}
              placeholder="Any special instructions for story generation..."
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />

            <CustomButton
              title="Create Account"
              onPress={handleRegister}
              style={styles.registerButton}
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
  interestsSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
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
  registerButton: {
    marginTop: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 4,
  },
});