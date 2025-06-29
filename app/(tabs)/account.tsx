import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { updateUser, logout } from '@/store/slices/authSlice';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { Colors } from '@/constants/Colors';
import { User, CreditCard as Edit3, LogOut, Save, X } from 'lucide-react-native';

const interests = [
  'Adventures', 'Animals', 'Magic', 'Science', 'Space', 'Pirates',
  'Princesses', 'Dragons', 'Dinosaurs', 'Fairy Tales', 'Sports', 'Music'
];

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    childName: user?.childName || '',
    childAge: user?.childAge?.toString() || '',
    parentName: user?.parentName || '',
    parentPhone: user?.parentPhone || '',
    defaultSystemPrompt: user?.defaultSystemPrompt || '',
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.childInterests || []);

  const handleSave = () => {
    const updatedData = {
      ...formData,
      childAge: parseInt(formData.childAge),
      childInterests: selectedInterests,
    };

    dispatch(updateUser(updatedData));
    setIsEditing(false);
    Alert.alert('Success', 'Your information has been updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      childName: user?.childName || '',
      childAge: user?.childAge?.toString() || '',
      parentName: user?.parentName || '',
      parentPhone: user?.parentPhone || '',
      defaultSystemPrompt: user?.defaultSystemPrompt || '',
    });
    setSelectedInterests(user?.childInterests || []);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <User size={48} color={Colors.primary} />
          <Text style={styles.title}>Account Settings</Text>
          <Text style={styles.subtitle}>
            Manage your profile and story preferences
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Child Information</Text>
              {!isEditing ? (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                  <Edit3 size={20} color={Colors.primary} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <X size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                    <Save size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <CustomInput
              label="Child's Name"
              value={formData.childName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, childName: text }))}
              editable={isEditing}
              style={!isEditing && styles.readOnlyInput}
            />

            <CustomInput
              label="Child's Age"
              value={formData.childAge}
              onChangeText={(text) => setFormData(prev => ({ ...prev, childAge: text }))}
              keyboardType="numeric"
              editable={isEditing}
              style={!isEditing && styles.readOnlyInput}
            />

            <View style={styles.interestsSection}>
              <Text style={styles.label}>Child's Interests</Text>
              <View style={styles.interestsGrid}>
                {interests.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestChip,
                      selectedInterests.includes(interest) && styles.interestChipSelected,
                      !isEditing && styles.interestChipDisabled
                    ]}
                    onPress={() => isEditing && toggleInterest(interest)}
                    disabled={!isEditing}
                  >
                    <Text style={[
                      styles.interestText,
                      selectedInterests.includes(interest) && styles.interestTextSelected
                    ]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent Information</Text>
            
            <CustomInput
              label="Parent Name"
              value={formData.parentName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, parentName: text }))}
              editable={isEditing}
              style={!isEditing && styles.readOnlyInput}
            />

            <CustomInput
              label="Email"
              value={user?.parentEmail || ''}
              editable={false}
              style={styles.readOnlyInput}
            />

            <CustomInput
              label="Phone Number"
              value={formData.parentPhone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, parentPhone: text }))}
              keyboardType="phone-pad"
              editable={isEditing}
              style={!isEditing && styles.readOnlyInput}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Story Preferences</Text>
            
            <CustomInput
              label="Default Story Instructions"
              value={formData.defaultSystemPrompt}
              onChangeText={(text) => setFormData(prev => ({ ...prev, defaultSystemPrompt: text }))}
              multiline
              numberOfLines={3}
              editable={isEditing}
              style={[styles.textArea, !isEditing && styles.readOnlyInput]}
            />
          </View>

          <View style={styles.actions}>
            <CustomButton
              title="Sign Out"
              onPress={handleLogout}
              variant="outline"
              style={styles.logoutButton}
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: Colors.secondary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  readOnlyInput: {
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
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
  interestChipDisabled: {
    opacity: 0.7,
  },
  interestText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  interestTextSelected: {
    color: Colors.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 32,
  },
  logoutButton: {
    borderColor: Colors.error,
  },
});