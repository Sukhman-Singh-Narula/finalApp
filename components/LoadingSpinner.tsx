// components/LoadingSpinner.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Sparkles } from 'lucide-react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  showIcon?: boolean;
  style?: any;
}

export default function LoadingSpinner({
  message,
  size = 'large',
  showIcon = true,
  style
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {showIcon && size === 'large' && (
          <View style={styles.iconContainer}>
            <Sparkles size={32} color={Colors.primary} />
          </View>
        )}

        <ActivityIndicator size={size} color={Colors.primary} />

        {message && (
          <Text style={[
            styles.message,
            size === 'small' ? styles.messageSmall : styles.messageLarge
          ]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    opacity: 0.8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
  messageLarge: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  messageSmall: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});