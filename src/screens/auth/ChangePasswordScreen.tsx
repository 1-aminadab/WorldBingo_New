import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../components/ui/ThemeProvider';
import BlueButton from '../../components/ui/BlueButton';
import AuthField from '../../components/ui/AuthField';
import BlurBackground from '../../components/ui/BlurBackground';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import StatusModal from '../../components/ui/StatusModal';
import { useAuthStore } from '../../store/authStore';
import { ScreenNames } from '../../constants/ScreenNames';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { resetPassword, isLoading } = useAuthStore();

  const { phoneNumber, otp } = route.params as { phoneNumber: string; otp: string };
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{visible: boolean; variant: 'success'|'error'; title?: string; message?: string}>({visible:false, variant:'success'});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validate new password
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 4) {
      newErrors.newPassword = 'Password must be at least 4 characters';
    } else if (formData.newPassword.length > 20) {
      newErrors.newPassword = 'Password must be less than 20 characters';
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation for better UX
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    if (field === 'newPassword') {
      if (!value.trim()) {
        newErrors.newPassword = 'New password is required';
      } else if (value.length < 4) {
        newErrors.newPassword = 'Password must be at least 4 characters';
      } else if (value.length > 20) {
        newErrors.newPassword = 'Password must be less than 20 characters';
      } else {
        delete newErrors.newPassword;
      }

      // Re-validate confirm password if it exists
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else if (formData.confirmPassword && value === formData.confirmPassword) {
        delete newErrors.confirmPassword;
      }
    }

    if (field === 'confirmPassword') {
      if (!value.trim()) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.newPassword !== value) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setStatus((s)=>({ ...s, visible:false }));
    setIsSubmitting(true);

    try {
      const result = await resetPassword(phoneNumber, formData.newPassword, formData.confirmPassword);
      if (result.success) {
        setStatus({ 
          visible: true, 
          variant: 'success', 
          title: 'Password Changed Successfully', 
          message: 'Your password has been updated. You can now login with your new password.' 
        });
        // Close modal and navigate to login after 2 seconds
        setTimeout(() => {
          setStatus((s)=>({ ...s, visible:false }));
          setTimeout(() => {
            navigation.navigate(ScreenNames.LOGIN as never);
          }, 300); // Small delay to let modal close animation complete
        }, 2000);
      } else {
        setStatus({ 
          visible: true, 
          variant: 'error', 
          title: 'Password Change Failed', 
          message: result.message || 'Failed to change password. Please try again.' 
        });
      }
    } catch (error) {
      setStatus({ 
        visible: true, 
        variant: 'error', 
        title: 'Error', 
        message: 'An error occurred while changing password. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    validateField(key, value);
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <ImageBackground 
        source={require('../../assets/images/auth-bg.png')}
        style={styles.background}
        resizeMode="cover"
        blurRadius={6}
      >
        <BlurBackground intensity={6} />
      </ImageBackground>
      
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <ArrowLeft size={24} color="#ffffff" />
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.formContainer}>
            {/* Title and Description */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.description}>
                Please enter a new password for your account
              </Text>
            </View>

            <AuthField
              label="New Password*"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChangeText={(value) => updateFormData('newPassword', value)}
              secureTextEntry
              error={errors.newPassword}
            />

            <AuthField
              label="Confirm Password*"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <BlueButton
              title={(isLoading || isSubmitting) ? 'Changing...' : 'Change Password'}
              onPress={handleChangePassword}
              disabled={isLoading || isSubmitting || !formData.newPassword.trim() || !formData.confirmPassword.trim() || Object.keys(errors).length > 0}
            />

            <StatusModal 
              visible={status.visible} 
              variant={status.variant} 
              title={status.title} 
              message={status.message} 
              onDismiss={() => setStatus((s)=>({ ...s, visible:false }))} 
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <LoadingOverlay 
        visible={isLoading || isSubmitting} 
        message="Changing password..." 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
});