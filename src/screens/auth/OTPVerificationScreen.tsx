import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import AuthField from '../../components/ui/AuthField';
import BlueButton from '../../components/ui/BlueButton';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useToast } from '../../components/ui/Toast/ToastProvider';
import StatusModal from '../../components/ui/StatusModal';
import BlurBackground from '../../components/ui/BlurBackground';
import { useAuthStore } from '../../store/authStore';
import { ScreenNames } from '../../constants/ScreenNames';

const { width, height } = Dimensions.get('window');

export const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { verifyOtp, verifyResetOtp, forgotPassword, isLoading } = useAuthStore();
  const { showSuccess, showError } = useToast();

  const { phoneNumber, type = 'verification' } = route.params as { phoneNumber: string; type?: string };
  const OTP_LENGTH = 4;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<{visible: boolean; variant: 'success'|'error'; title?: string; message?: string}>({visible:false, variant:'success'});
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input when screen loads
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    // If user pasted the entire code (from SMS or clipboard), it often arrives in one field
    if (value && value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const filled = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < digits.length; i++) {
        filled[i] = digits[i];
      }
      setOtp(filled);
      // Auto-verify when all digits provided
      if (digits.length === OTP_LENGTH) {
        setTimeout(() => handleVerifyOTP(), 50);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error when user starts typing
    setStatus((s)=>({ ...s, visible:false }));

    // Auto focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      setStatus({ visible: true, variant: 'error', title: 'Incomplete code', message: `Please enter the complete ${OTP_LENGTH}-digit code` });
      return;
    }

    setStatus((s)=>({ ...s, visible:false }));
    setIsValidating(true);

    try {
      // Use different API endpoints based on verification type
      const result = type === 'password_reset' 
        ? await verifyResetOtp(phoneNumber, otpString)
        : await verifyOtp(phoneNumber, otpString);
        
      if (result.success) {
        setStatus({ visible: true, variant: 'success', title: 'Verified', message: 'Redirecting...' });
        setTimeout(() => {
          setStatus((s)=>({ ...s, visible:false }));
          setTimeout(() => {
            if (type === 'password_reset') {
              navigation.navigate(ScreenNames.CHANGE_PASSWORD as never, { 
                phoneNumber, 
                otp: otpString 
              });
            } else {
              navigation.navigate(ScreenNames.MAIN as never);
            }
          }, 300); // Small delay to let modal close animation complete
        }, 1500);
      } else {
        setStatus({ visible: true, variant: 'error', title: 'Invalid code', message: result.message || 'Please try again' });
      }
    } catch (error) {
      setStatus({ visible: true, variant: 'error', title: 'Verification error', message: 'An error occurred during verification' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      const result = await forgotPassword(phoneNumber);
      if (result.success) {
        showSuccess('New verification code sent!');
        setResendCooldown(60); // 60 second cooldown
        setOtp(Array(OTP_LENGTH).fill('')); // Clear current OTP
        inputRefs.current[0]?.focus();
      } else {
        showError('Failed to resend code. Please try again.');
      }
    } catch (error) {
      showError('An error occurred while resending code');
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
          message="Verifying code..."
        />
      );
    }
    return null;
  };

  const otpString = otp.join('');
  const isOtpComplete = otpString.length === OTP_LENGTH;

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
            {/* Title and Description */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>
                {type === 'password_reset' ? 'Reset Password' : 'Verify Your Phone'}
              </Text>
              <Text style={styles.description}>
                {type === 'password_reset' 
                  ? `Enter the 4-digit code sent to ${phoneNumber}`
                  : `We've sent a 4-digit verification code to ${phoneNumber}`
                }
              </Text>
            </View>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                (status.visible && status.variant === 'error') && styles.otpInputError,
              ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  blurOnSubmit={false}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  importantForAutofill="yes"
                  returnKeyType={index === OTP_LENGTH - 1 ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (index === OTP_LENGTH - 1) handleVerifyOTP();
                  }}
                />
              ))}
            </View>

            <StatusModal visible={status.visible} variant={status.variant} title={status.title} message={status.message} onDismiss={() => setStatus((s)=>({ ...s, visible:false }))} />

            <BlueButton
              title="Verify Code"
              onPress={handleVerifyOTP}
              disabled={!isOtpComplete || isLoading || isValidating}
            />

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code? 
              </Text>
              <TouchableOpacity 
                onPress={handleResendCode}
                disabled={resendCooldown > 0}
                style={styles.resendButton}
              >
                <Text style={[
                  styles.resendLink,
                  resendCooldown > 0 && styles.resendDisabled
                ]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </Text>
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
  emailText: {
    color: '#9AFF9A',
    fontWeight: '600',
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
    gap: 12,
  },
  otpInput: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginHorizontal: 6,
  },
  otpInputFilled: {
    borderColor: '#6AB3FF',
    backgroundColor: 'rgba(106,179,255,0.1)',
  },
  otpInputError: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  verifyButton: {
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
    opacity: 0.5,
    backgroundColor: 'rgba(106,179,255,0.3)',
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  resendButton: {
    marginLeft: 4,
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7BC4FF',
  },
  resendDisabled: {
    color: 'rgba(106,179,255,0.5)',
  },
});