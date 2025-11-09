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
import { ArrowLeft, Eye, EyeOff, ChevronDown, Globe } from 'lucide-react-native';
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

// Language normalization
const translations = {
  en: {
    welcomeBack: 'Welcome Back',
    joinWorldBingo: 'Join World Bingo',
    signInToAccount: 'Please sign in to your account',
    createAccountStart: 'Create your account and start playing',
    phoneNumber: 'Phone Number*',
    phoneNumberPlaceholder: '(e.g. 912345678)',
    password: 'Password*',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot Password?',
    login: 'Login',
    signUp: 'Sign Up',
    firstName: 'First Name*',
    firstNamePlaceholder: 'First name',
    lastName: 'Last Name*',
    lastNamePlaceholder: 'Last name',
    confirmPassword: 'Confirm Password*',
    confirmPasswordPlaceholder: 'Confirm your password',
    promoCode: 'Promo Code (Optional)',
    promoCodePlaceholder: 'Enter promo code',
    or: 'OR',
    continueAsGuest: 'Continue as Guest',
    // Validation messages
    missingPhoneNumber: 'Missing phone number',
    enterPhoneNumber: 'Please enter your phone number',
    missingPassword: 'Missing password',
    enterPassword: 'Please enter your password',
    weakPassword: 'Weak password',
    passwordMinLength: 'Password must be at least 6 characters',
    firstNameRequired: 'First name required',
    enterFirstName: 'Please enter your first name',
    lastNameRequired: 'Last name required',
    enterLastName: 'Please enter your last name',
    phoneNumberRequired: 'Phone number required',
    passwordRequired: 'Password required',
    passwordsDoNotMatch: 'Passwords do not match',
    reenterPasswords: 'Please re-enter matching passwords',
    // Success messages
    otpSent: 'OTP sent',
    checkPhoneForCode: 'Check your phone for the code',
    welcomeBackMsg: 'Welcome back',
    loginSuccessful: 'Login successful! Redirecting...',
    accountCreated: 'Account created',
    redirecting: 'Redirecting...',
    // Error messages
    loginFailed: 'Login failed',
    invalidCredentials: 'Invalid credentials',
    loginError: 'Login error',
    loginErrorOccurred: 'An error occurred during login',
    signUpFailed: 'Sign up failed',
    signUpTryAgain: 'Please try again',
    signUpError: 'Sign up error',
    signUpErrorOccurred: 'An error occurred during sign up',
    // Loading messages
    signingIn: 'Signing in...',
    signingUp: 'Signing up...',
  },
  am: {
    welcomeBack: 'እንኳን ደህና መጡ',
    joinWorldBingo: 'ወርልድ ቢንጎ ተቀላቀሉ',
    signInToAccount: 'እባክዎ ወደ መለያዎ ይግቡ',
    createAccountStart: 'መለያዎን ይፍጠሩ እና መጫወት ይጀምሩ',
    phoneNumber: 'ስልክ ቁጥር*',
    phoneNumberPlaceholder: '(ምሳሌ 912345678)',
    password: 'የይለፍ ቃል*',
    passwordPlaceholder: 'የይለፍ ቃልዎን ያስገቡ',
    forgotPassword: 'የይለፍ ቃል ረሳህ?',
    login: 'ግባ',
    signUp: 'ተመዝገብ',
    firstName: 'የመጀመሪያ ስም*',
    firstNamePlaceholder: 'የመጀመሪያ ስም',
    lastName: 'የአባት ስም*',
    lastNamePlaceholder: 'የአባት ስም',
    confirmPassword: 'የይለፍ ቃል አረጋግጥ*',
    confirmPasswordPlaceholder: 'የይለፍ ቃልዎን ያረጋግጡ',
    promoCode: 'ፕሮሞ ኮድ (አማራጭ)',
    promoCodePlaceholder: 'ፕሮሞ ኮድ ያስገቡ',
    or: 'ወይም',
    continueAsGuest: 'እንደ እንግዳ ይቀጥሉ',
    // Validation messages
    missingPhoneNumber: 'ስልክ ቁጥር የለም',
    enterPhoneNumber: 'እባክዎ ስልክ ቁጥርዎን ያስገቡ',
    missingPassword: 'የይለፍ ቃል የለም',
    enterPassword: 'እባክዎ የይለፍ ቃልዎን ያስገቡ',
    weakPassword: 'ደካማ የይለፍ ቃል',
    passwordMinLength: 'የይለፍ ቃሉ ቢያንስ 6 ቁምፊዎች መሆን አለበት',
    firstNameRequired: 'የመጀመሪያ ስም ያስፈልጋል',
    enterFirstName: 'እባክዎ የመጀመሪያ ስምዎን ያስገቡ',
    lastNameRequired: 'የአባት ስም ያስፈልጋል',
    enterLastName: 'እባክዎ የአባት ስምዎን ያስገቡ',
    phoneNumberRequired: 'ስልክ ቁጥር ያስፈልጋል',
    passwordRequired: 'የይለፍ ቃል ያስፈልጋል',
    passwordsDoNotMatch: 'የይለፍ ቃሎች አይዛመዱም',
    reenterPasswords: 'እባክዎ የሚዛመዱ የይለፍ ቃሎችን እንደገና ያስገቡ',
    // Success messages
    otpSent: 'ኦቲፒ ተልኳል',
    checkPhoneForCode: 'ስልክዎን ለኮዱ ይመልከቱ',
    welcomeBackMsg: 'እንኳን ደህና መጡ',
    loginSuccessful: 'መግባት ተሳክቷል! ሪዳይሬክት ላይ...',
    accountCreated: 'መለያ ተፈጠረ',
    redirecting: 'ሪዳይሬክት ላይ...',
    // Error messages
    loginFailed: 'መግባት አልተሳካም',
    invalidCredentials: 'የተሳሳተ መታወቂያ',
    loginError: 'የመግቢያ ስህተት',
    loginErrorOccurred: 'በመግባት ወቅት ስህተት ተከስቷል',
    signUpFailed: 'መመዝገብ አልተሳካም',
    signUpTryAgain: 'እባክዎ እንደገና ይሞክሩ',
    signUpError: 'የመመዝገቢያ ስህተት',
    signUpErrorOccurred: 'በመመዝገብ ወቅት ስህተት ተከስቷል',
    // Loading messages
    signingIn: 'ግብ ላይ...',
    signingUp: 'መመዝገብ ላይ...',
  }
};

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
  
  // Language state
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'am'>('en');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  
  // Get current translation
  const t = translations[currentLanguage];
  
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

  const toggleLanguage = (lang: 'en' | 'am') => {
    setCurrentLanguage(lang);
    setDropdownVisible(false);
  };

  const validateLoginForm = (): boolean => {
    if (!phoneNumber.trim()) {
      setStatus({ visible: true, variant: 'error', title: t.missingPhoneNumber, message: t.enterPhoneNumber });
      return false;
    }
    if (!password.trim()) {
      setStatus({ visible: true, variant: 'error', title: t.missingPassword, message: t.enterPassword });
      return false;
    }
    if (password.length < 6) {
      setStatus({ visible: true, variant: 'error', title: t.weakPassword, message: t.passwordMinLength });
      return false;
    }
    return true;
  };

  const validateSignUpForm = (): boolean => {
    if (!signupData.firstName.trim()) {
      setStatus({ visible: true, variant: 'error', title: t.firstNameRequired, message: t.enterFirstName });
      return false;
    }
    if (!signupData.lastName.trim()) {
      setStatus({ visible: true, variant: 'error', title: t.lastNameRequired, message: t.enterLastName });
      return false;
    }
    if (!signupData.phoneNumber.trim()) {
      setStatus({ visible: true, variant: 'error', title: t.phoneNumberRequired, message: t.enterPhoneNumber });
      return false;
    }
    if (!signupData.password.trim()) {
      setStatus({ visible: true, variant: 'error', title: t.passwordRequired, message: t.enterPassword });
      return false;
    }
    if (signupData.password.length < 6) {
      setStatus({ visible: true, variant: 'error', title: t.weakPassword, message: t.passwordMinLength });
      return false;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setStatus({ visible: true, variant: 'error', title: t.passwordsDoNotMatch, message: t.reenterPasswords });
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
          setStatus({ visible: true, variant: 'success', title: t.otpSent, message: t.checkPhoneForCode });
          setTimeout(() => (navigation as any).navigate(ScreenNames.OTP_VERIFICATION, { phoneNumber: fullPhoneNumber }), 1200);
        } else {
          setStatus({ visible: true, variant: 'success', title: t.welcomeBackMsg, message: t.loginSuccessful });
          setTimeout(() => navigation.navigate(ScreenNames.MAIN as never), 1200);
        }
      } else {
        setStatus({ visible: true, variant: 'error', title: t.loginFailed, message: result.message || t.invalidCredentials });
      }
    } catch (error) {
      setStatus({ visible: true, variant: 'error', title: t.loginError, message: t.loginErrorOccurred });
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
          setStatus({ visible: true, variant: 'success', title: t.otpSent, message: t.checkPhoneForCode });
          setTimeout(() => (navigation as any).navigate(ScreenNames.OTP_VERIFICATION, { phoneNumber: fullPhoneNumber }), 1200);
        } else {
          setStatus({ visible: true, variant: 'success', title: t.accountCreated, message: t.redirecting });
          setTimeout(() => navigation.navigate(ScreenNames.MAIN as never), 1200);
        }
      } else {
        setStatus({ visible: true, variant: 'error', title: t.signUpFailed, message: result.message || t.signUpTryAgain });
      }
    } catch (error) {
      setStatus({ visible: true, variant: 'error', title: t.signUpError, message: t.signUpErrorOccurred });
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
      const message = activeTab === 'login' ? t.signingIn : t.signingUp;
      return (
        <LoadingOverlay
          visible={true}
          message={message}
        />
      );
    }
    return null;
  };

  const renderLanguageDropdown = () => (
    <View style={styles.languageDropdownContainer}>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setDropdownVisible(!dropdownVisible)}
      >
        <Globe size={16} color="#ffffff" />
        <Text style={styles.languageButtonText}>
          {currentLanguage === 'en' ? 'EN' : 'አማ'}
        </Text>
        <ChevronDown 
          size={14} 
          color="#ffffff" 
          style={{ 
            transform: [{ rotate: dropdownVisible ? '180deg' : '0deg' }] 
          }} 
        />
      </TouchableOpacity>
      
      {dropdownVisible && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={[styles.dropdownItem, currentLanguage === 'en' && styles.dropdownItemActive]}
            onPress={() => toggleLanguage('en')}
          >
            <Text style={[styles.dropdownItemText, currentLanguage === 'en' && styles.dropdownItemTextActive]}>
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, currentLanguage === 'am' && styles.dropdownItemActive]}
            onPress={() => toggleLanguage('am')}
          >
            <Text style={[styles.dropdownItemText, currentLanguage === 'am' && styles.dropdownItemTextActive]}>
              አማርኛ
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        {/* Language Dropdown at the very top */}
        {/* <View style={styles.topLanguageContainer}>
          {renderLanguageDropdown()}
        </View> */}

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
                {activeTab === 'login' ? t.welcomeBack : t.joinWorldBingo}
              </Text>
              <Text style={styles.subtitle}>
                {activeTab === 'login' 
                  ? t.signInToAccount
                  : t.createAccountStart
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
                  label={t.phoneNumber}
                  placeholder={t.phoneNumberPlaceholder}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onChangeCountryCode={setCountryCode}
                />

                <AuthField
                  label={t.password}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity onPress={navigateToForgotPassword} style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>{t.forgotPassword}</Text>
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
                      ]}>{t.login}</Text>
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
                      ]}>{t.signUp}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </>
            ) : (
              // Sign Up Form
              <>
                <View style={styles.row}>
                  <AuthField
                    label={t.firstName}
                    placeholder={t.firstNamePlaceholder}
                    value={signupData.firstName}
                    onChangeText={(value) => updateSignupData('firstName', value)}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                  />
                  <AuthField
                    label={t.lastName}
                    placeholder={t.lastNamePlaceholder}
                    value={signupData.lastName}
                    onChangeText={(value) => updateSignupData('lastName', value)}
                    containerStyle={{ flex: 1, marginLeft: 8 }}
                  />
                </View>

                <PhoneField
                  label={t.phoneNumber}
                  placeholder={t.phoneNumberPlaceholder}
                  value={signupData.phoneNumber}
                  onChangeText={(value) => updateSignupData('phoneNumber', value)}
                  onChangeCountryCode={setCountryCode}
                />

                <AuthField
                  label={t.password}
                  placeholder={t.passwordPlaceholder}
                  value={signupData.password}
                  onChangeText={(value) => updateSignupData('password', value)}
                  secureTextEntry
                />

                <AuthField
                  label={t.confirmPassword}
                  placeholder={t.confirmPasswordPlaceholder}
                  value={signupData.confirmPassword}
                  onChangeText={(value) => updateSignupData('confirmPassword', value)}
                  secureTextEntry
                />

                <AuthField
                  label={t.promoCode}
                  placeholder={t.promoCodePlaceholder}
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
                      ]}>{t.login}</Text>
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
                      ]}>{t.signUp}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </>
            )}

            <StatusModal visible={status.visible} variant={status.variant} title={status.title} message={status.message} onDismiss={() => setStatus((s)=>({ ...s, visible:false }))} />

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>{t.or}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
            >
              <Text style={styles.guestButtonText}>{t.continueAsGuest}</Text>
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
  topLanguageContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 1000,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 120,
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
  // Language dropdown styles
  languageDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  languageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 120,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(123,196,255,0.2)',
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#7BC4FF',
    fontWeight: '600',
  },
});