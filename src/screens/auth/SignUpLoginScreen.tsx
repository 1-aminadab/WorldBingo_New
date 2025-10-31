import React, { useState, useRef } from 'react';
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
  Animated,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
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
import { ScreenNames } from '../../constants/ScreenNames';
import BlurBackground from '../../components/ui/BlurBackground';

const { width, height } = Dimensions.get('window');

interface SignUpLoginScreenProps {
  isLogin?: boolean;
}

export const SignUpLoginScreen: React.FC<SignUpLoginScreenProps> = ({ isLogin = true }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { login, register, loginAsGuest, isLoading } = useAuthStore();
  const { showSuccess, showError } = useToast();
  
  // Get isLogin from route params or props
  const isLoginParam = (route.params as any)?.isLogin ?? isLogin;
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(isLoginParam ? 'login' : 'signup');
  const tabAnimation = useRef(new Animated.Value(isLoginParam ? 0 : 1)).current;
  
  // Sign In form
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [password, setPassword] = useState('');
  
  // Sign Up form
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    promoCode: '',
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<{visible: boolean; variant: 'success'|'error'; title?: string; message?: string}>({visible:false, variant:'success'});

  const switchTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    Animated.timing(tabAnimation, {
      toValue: tab === 'login' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const validateLoginForm = (): boolean => {
    if (!phoneNumber.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Missing phone number', message: 'Please enter your phone number' });
      return false;
    }
    if (!password.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Missing password', message: 'Please enter your password' });
      return false;
    }
    if (password.length < 6) {
      setStatus({ visible: true, variant: 'error', title: 'Weak password', message: 'Password must be at least 6 characters' });
      return false;
    }
    return true;
  };

  const validateSignUpForm = (): boolean => {
    if (!signupData.firstName.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'First name required', message: 'Please enter your first name' });
      return false;
    }
    if (!signupData.lastName.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Last name required', message: 'Please enter your last name' });
      return false;
    }
    if (!signupData.phoneNumber.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Phone number required', message: 'Please enter your phone number' });
      return false;
    }
    if (!signupData.password.trim()) {
      setStatus({ visible: true, variant: 'error', title: 'Password required', message: 'Please enter your password' });
      return false;
    }
    if (signupData.password.length < 6) {
      setStatus({ visible: true, variant: 'error', title: 'Weak password', message: 'Password must be at least 6 characters' });
      return false;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setStatus({ visible: true, variant: 'error', title: 'Passwords do not match', message: 'Please re-enter matching passwords' });
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) return;

    setStatus((s) => ({ ...s, visible: false }));
    setIsValidating(true);

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const result = await login(fullPhoneNumber, password);
      if (result.success) {
        if (result.requiresOtp) {
          setStatus({ visible: true, variant: 'success', title: 'OTP sent', message: 'Check your phone for the code' });
          setTimeout(() => (navigation as any).navigate(ScreenNames.OTP_VERIFICATION, { phoneNumber: fullPhoneNumber }), 1200);
        } else {
          setStatus({ visible: true, variant: 'success', title: 'Welcome back', message: 'Login successful! Redirecting...' });
          setTimeout(() => navigation.navigate(ScreenNames.MAIN as never), 1200);
        }
      } else {
        setStatus({ visible: true, variant: 'error', title: 'Login failed', message: result.message || 'Invalid credentials' });
      }
    } catch (error) {
      setStatus({ visible: true, variant: 'error', title: 'Login error', message: 'An error occurred during login' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateSignUpForm()) return;

    setStatus((s) => ({ ...s, visible: false }));
    setIsValidating(true);

    try {
      const fullName = `${signupData.firstName.trim()} ${signupData.lastName.trim()}`;
      const fullPhoneNumber = `${countryCode}${signupData.phoneNumber}`;
      const result = await register(fullName, fullPhoneNumber, signupData.password, signupData.confirmPassword, signupData.promoCode);
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

  const navigateToForgotPassword = () => {
    navigation.navigate(ScreenNames.FORGOT_PASSWORD as never);
  };

  const updateSignupData = (key: string, value: string) => {
    setSignupData(prev => ({ ...prev, [key]: value }));
    if (status.visible) {
      setStatus((s) => ({ ...s, visible: false }));
    }
  };

  const handleGuestLogin = async () => {
    console.log('Guest login clicked');
    await loginAsGuest();
    console.log('Guest login completed, navigating to splash...');
    // Navigate back to splash screen which will then route to main app
    navigation.navigate(ScreenNames.SPLASH as never);
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderLoadingOverlay = () => {
    if (isLoading || isValidating) {
      const message = activeTab === 'login' ? 'Signing in...' : 'Signing up...';
      return (
        <LoadingOverlay
          visible={true}
          message={message}
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
          {/* Header with Logo and Welcome Message */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/world-Bingo-Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.welcomeContainer}>
              <Text style={styles.title}>
                {activeTab === 'login' ? 'Welcome Back' : 'Join World Bingo'}
              </Text>
              <Text style={styles.subtitle}>
                {activeTab === 'login' 
                  ? 'Please sign in to your account'
                  : 'Create your account and start playing'
                }
              </Text>
            </View>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {activeTab === 'login' ? (
              // Sign In Form
              <>
                <PhoneField
                  label="Phone Number*"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onChangeCountryCode={setCountryCode}
                />

                <AuthField
                  label="Password*"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity onPress={navigateToForgotPassword} style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Tab Buttons */}
                <View style={styles.tabContainer}>
                  <Animated.View style={[
                    styles.tabButton,
                    styles.loginTab,
                    {
                      width: tabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['60%', '40%'],
                      }),
                      backgroundColor: tabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#7BC4FF', 'rgba(255,255,255,0.1)'],
                      }),
                    }
                  ]}>
                    <TouchableOpacity 
                      style={styles.tabButtonInner}
                      onPress={activeTab === 'login' ? handleLogin : () => switchTab('login')}
                    >
                      <Text style={[
                        styles.tabButtonText,
                        activeTab === 'login' && styles.activeTabText
                      ]}>Login</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  <Animated.View style={[
                    styles.tabButton,
                    styles.signUpTab,
                    {
                      width: tabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['40%', '60%'],
                      }),
                      backgroundColor: tabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(255,255,255,0.1)', '#7BC4FF'],
                      }),
                    }
                  ]}>
                    <TouchableOpacity 
                      style={styles.tabButtonInner}
                      onPress={activeTab === 'signup' ? handleSignUp : () => switchTab('signup')}
                    >
                      <Text style={[
                        styles.tabButtonText,
                        activeTab === 'signup' && styles.activeTabText
                      ]}>Sign Up</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </>
            ) : (
              // Sign Up Form
              <>
                <View style={styles.row}>
                  <AuthField
                    label="First Name*"
                    placeholder="First name"
                    value={signupData.firstName}
                    onChangeText={(value) => updateSignupData('firstName', value)}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                  />
                  <AuthField
                    label="Last Name*"
                    placeholder="Last name"
                    value={signupData.lastName}
                    onChangeText={(value) => updateSignupData('lastName', value)}
                    containerStyle={{ flex: 1, marginLeft: 8 }}
                  />
                </View>

                <PhoneField
                  label="Phone Number*"
                  placeholder="Enter your phone number"
                  value={signupData.phoneNumber}
                  onChangeText={(value) => updateSignupData('phoneNumber', value)}
                  onChangeCountryCode={setCountryCode}
                />

                <AuthField
                  label="Password*"
                  placeholder="Enter your password"
                  value={signupData.password}
                  onChangeText={(value) => updateSignupData('password', value)}
                  secureTextEntry
                />

                <AuthField
                  label="Confirm Password*"
                  placeholder="Confirm your password"
                  value={signupData.confirmPassword}
                  onChangeText={(value) => updateSignupData('confirmPassword', value)}
                  secureTextEntry
                />

                <AuthField
                  label="Promo Code (Optional)"
                  placeholder="Enter promo code"
                  value={signupData.promoCode}
                  onChangeText={(value) => updateSignupData('promoCode', value)}
                />

                {/* Tab Buttons */}
                <View style={styles.tabContainer}>
                  <Animated.View style={[
                    styles.tabButton,
                    styles.loginTab,
                    {
                      width: tabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['60%', '40%'],
                      }),
                      backgroundColor: tabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#7BC4FF', 'rgba(255,255,255,0.1)'],
                      }),
                    }
                  ]}>
                    <TouchableOpacity 
                      style={styles.tabButtonInner}
                      onPress={activeTab === 'login' ? handleLogin : () => switchTab('login')}
                    >
                      <Text style={[
                        styles.tabButtonText,
                        activeTab === 'login' && styles.activeTabText
                      ]}>Login</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  <Animated.View style={[
                    styles.tabButton,
                    styles.signUpTab,
                    {
                      width: tabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['40%', '60%'],
                      }),
                      backgroundColor: tabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(255,255,255,0.1)', '#7BC4FF'],
                      }),
                    }
                  ]}>
                    <TouchableOpacity 
                      style={styles.tabButtonInner}
                      onPress={activeTab === 'signup' ? handleSignUp : () => switchTab('signup')}
                    >
                      <Text style={[
                        styles.tabButtonText,
                        activeTab === 'signup' && styles.activeTabText
                      ]}>Sign Up</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </>
            )}

            <StatusModal visible={status.visible} variant={status.variant} title={status.title} message={status.message} onDismiss={() => setStatus((s)=>({ ...s, visible:false }))} />

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  logoContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 60,
  },
  welcomeContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    padding: 4,
    height: 56,
  },
  tabButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  loginTab: {
    marginRight: 2,
  },
  signUpTab: {
    marginLeft: 2,
  },
  tabButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  activeTabText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#7BC4FF',
    fontWeight: '500',
  },
  signInButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#7BC4FF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#7BC4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  guestButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});