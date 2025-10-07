import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

const { width, height } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { login, loginAsGuest, isLoading } = useAuthStore();
  
  // Initialize Firebase Auth state listener
  useFirebaseAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {email?: string; password?: string} = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const success = await login(email, password);
      if (!success) {
        Alert.alert('Error', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login');
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp' as never);
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleGuestLogin = () => {
    console.log('Guest login clicked');
    loginAsGuest();
    console.log('Guest login completed, navigating to splash...');
    // Navigate back to splash screen which will then route to main app
    navigation.navigate('Splash' as never);
  };

  return (
    <View style={styles.container}>
      {/* Beautiful Background */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/world-Bingo-Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Please sign in to your account</Text>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
                <Mail size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <Input
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
                <Lock size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <Input
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity onPress={navigateToForgotPassword} style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.orText, { color: theme.colors.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.guestButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
              onPress={handleGuestLogin}
            >
              <User size={20} color={theme.colors.textSecondary} style={styles.guestIcon} />
              <Text style={[styles.guestButtonText, { color: theme.colors.text }]}>Continue as Guest</Text>
            </TouchableOpacity>

            <View style={styles.signupPrompt}>
              <Text style={[styles.signupText, { color: theme.colors.textSecondary }]}>
                Don't have an account? 
              </Text>
              <TouchableOpacity onPress={navigateToSignUp}>
                <Text style={[styles.signupLink, { color: theme.colors.primary }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '400',
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
   
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  guestIcon: {
    marginRight: 8,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
    fontWeight: '400',
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
});