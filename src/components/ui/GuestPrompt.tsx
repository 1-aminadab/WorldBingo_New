import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeProvider';
import { Button } from './Button';
import { useAuthStore } from '../../store/authStore';

interface GuestPromptProps {
  onDismiss?: () => void;
  showCloseButton?: boolean;
}

export const GuestPrompt: React.FC<GuestPromptProps> = ({
  onDismiss,
  showCloseButton = true,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isGuest } = useAuthStore();

  if (!isGuest) return null;

  const handleCreateAccount = () => {
    navigation.getParent()?.navigate('Profile' as never);
    onDismiss?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.info }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔔</Text>
        <View style={styles.textContent}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.message}>
            Save your progress and unlock more features by creating a free account!
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            title="Create Account"
            onPress={handleCreateAccount}
            variant="secondary"
            size="sm"
          />
          {showCloseButton && onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 8,
    padding: 4,
  },
  closeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
});