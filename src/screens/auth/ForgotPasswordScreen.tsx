import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import AuthField from '../../components/ui/AuthField';
import PhoneField from '../../components/ui/PhoneField';
import BlueButton from '../../components/ui/BlueButton';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { SuccessMessage } from '../../components/ui/SuccessMessage';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useToast } from '../../components/ui/Toast/ToastProvider';
import { useAuthStore } from '../../store/authStore';
import StatusModal from '../../components/ui/StatusModal';
import BlurBackground from '../../components/ui/BlurBackground';
import { ScreenNames } from '../../constants/ScreenNames';

const { width, height } = Dimensions.get('window');

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { forgotPassword, isLoading } = useAuthStore();
  const { showSuccess, showError } = useToast();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<{visible: boolean; variant: 'success'|'error'; title?: string; message?: string}>({visible:false, variant:'success'});

  const validate = (): boolean => {
    if (!phoneNumber.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Phone number required', message: 'Please enter your phone number' });
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    setStatus((s)=>({ ...s, visible:false }));
    setIsValidating(true);

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const result = await forgotPassword(fullPhoneNumber);
      if (result.success) {
        setStatus({ visible: true, variant: 'success', title: 'Code sent', message: 'Check your phone for the reset code' });
        setTimeout(() => {
          navigation.navigate(ScreenNames.OTP_VERIFICATION as never, { 
            phoneNumber: fullPhoneNumber,
            type: 'password_reset'
          });
        }, 2000);
      } else {
        setStatus({ visible: true, variant: 'error', title: 'Failed', message: result.message || 'Failed to send reset code' });
      }
    } catch (error) {
      setStatus({ visible: true, variant: 'error', title: 'Error', message: 'An error occurred while sending reset code' });
    } finally {
      setIsValidating(false);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderLoadingOverlay = () => {
    if (isLoading || isValidating) {
      return (
        <LoadingOverlay
          visible={true}
          message="Sending reset code..."
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Form */}
          <View style={styles.formContainer}>
            <PhoneField
              label="Phone Number*"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              onChangeCountryCode={setCountryCode}
            />

            <StatusModal visible={status.visible} variant={status.variant} title={status.title} message={status.message} onDismiss={() => setStatus((s)=>({ ...s, visible:false }))} />

            <BlueButton
              title={isLoading || isValidating ? 'Sending...' : 'Send Code'}
              onPress={handleResetPassword}
              disabled={isLoading || isValidating}
            />

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>
                Already have an account? 
              </Text>
              <TouchableOpacity onPress={goBack}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {renderLoadingOverlay()}
      </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
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
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sendCodeButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#7BC4FF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#7BC4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sendCodeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7BC4FF',
    marginLeft: 4,
  },
});