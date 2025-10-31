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
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import AuthField from '../../components/ui/AuthField';
import PhoneField from '../../components/ui/PhoneField';
import BlueButton from '../../components/ui/BlueButton';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useToast } from '../../components/ui/Toast/ToastProvider';
import { useAuthStore } from '../../store/authStore';
import StatusModal from '../../components/ui/StatusModal';
import BlurBackground from '../../components/ui/BlurBackground';
import { ScreenNames } from '../../constants/ScreenNames';

const { width, height } = Dimensions.get('window');

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { register, isLoading } = useAuthStore();
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    promoCode: '',
  });
  const [countryCode, setCountryCode] = useState('+251'); // Ethiopia default
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<{visible: boolean; variant: 'success'|'error'; title?: string; message?: string}>({visible:false, variant:'success'});

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'First name required', message: 'Please enter your first name' });
      return false;
    }
    if (formData.firstName.trim().length < 2) {
      setStatus({ visible: true, variant: 'error', title: 'Name too short', message: 'First name must be at least 2 characters' });
      return false;
    }
    if (!formData.lastName.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Last name required', message: 'Please enter your last name' });
      return false;
    }
    if (formData.lastName.trim().length < 2) {
      setStatus({ visible: true, variant: 'error', title: 'Name too short', message: 'Last name must be at least 2 characters' });
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Phone number required', message: 'Please enter your phone number' });
      return false;
    }
    if (!formData.password.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Password required', message: 'Please enter your password' });
      return false;
    }
    if (formData.password.length < 6) {
      setStatus({ visible: true, variant: 'error', title: 'Weak password', message: 'Password must be at least 6 characters' });
      return false;
    }
    if (!formData.confirmPassword.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Confirm password', message: 'Please confirm your password' });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setStatus({ visible: true, variant: 'error', title: 'Passwords do not match', message: 'Please re-enter matching passwords' });
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setStatus((s)=>({ ...s, visible:false }));
    setIsValidating(true);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const fullPhoneNumber = `${countryCode}${formData.phoneNumber}`;
      const result = await register(fullName, fullPhoneNumber, formData.password, formData.confirmPassword, formData.promoCode);
      if (result.success) {
        if (result.requiresOtp) {
          setStatus({ visible: true, variant: 'success', title: 'OTP sent', message: 'Check your phone for the code' });
          setTimeout(() => (navigation as any).navigate(ScreenNames.OTP_VERIFICATION, { phoneNumber: fullPhoneNumber }), 1200);
        } else {
          setStatus({ visible: true, variant: 'success', title: 'Account created', message: 'Redirecting...' });
          setTimeout(() => navigation.navigate(ScreenNames.MAIN as never), 1200);
        }
      } else {
        setStatus({ visible: true, variant: 'error', title: 'Sign up failed', message: result.message || 'Please try again' });
      }
    } catch (error) {
      setStatus({ visible: true, variant: 'error', title: 'Sign up error', message: 'An error occurred during sign up' });
    } finally {
      setIsValidating(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  const goBack = () => {
    navigation.goBack();
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Only clear status if it's currently visible to avoid unnecessary re-renders
    if (status.visible) {
      setStatus((s)=>({ ...s, visible:false }));
    }
  };

  const renderLoadingOverlay = () => {
    if (isLoading || isValidating) {
      return (
        <LoadingOverlay
          visible={true}
          message="Creating account..."
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
            <View style={styles.row}>
              <AuthField
                label="First Name*"
                placeholder="First name"
                value={formData.firstName}
                onChangeText={(value) => updateFormData('firstName', value)}
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <AuthField
                label="Last Name*"
                placeholder="Last name"
                value={formData.lastName}
                onChangeText={(value) => updateFormData('lastName', value)}
                containerStyle={{ flex: 1, marginLeft: 8 }}
              />
            </View>

            <PhoneField
              label="Phone Number*"
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => updateFormData('phoneNumber', value)}
              onChangeCountryCode={setCountryCode}
            />

            <AuthField
              label="Password*"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
            />

            <AuthField
              label="Confirm Password*"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
            />

            <AuthField
              label="Promo Code (Optional)"
              placeholder="Enter promo code"
              value={formData.promoCode}
              onChangeText={(value) => updateFormData('promoCode', value)}
            />

            <StatusModal visible={status.visible} variant={status.variant} title={status.title} message={status.message} onDismiss={() => setStatus((s)=>({ ...s, visible:false }))} />

            <BlueButton
              title={isLoading || isValidating ? 'Creating...' : 'Register'}
              onPress={handleSignUp}
              disabled={isLoading || isValidating}
            />

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>
                Already have an account? 
              </Text>
              <TouchableOpacity onPress={navigateToLogin}>
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
  formContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
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
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    bottom: 16,
    justifyContent: 'center',
  },
  registerButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#7BC4FF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
  registerButtonText: {
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