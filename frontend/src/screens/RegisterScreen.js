import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'transparent', width: '0%' };
    if (password.length < 4)
      return { label: 'Weak', color: colors.error, width: '25%' };
    if (password.length < 6)
      return { label: 'Fair', color: colors.warning, width: '50%' };
    if (password.length < 8)
      return { label: 'Good', color: colors.blue, width: '75%' };
    return { label: 'Strong', color: colors.success, width: '100%' };
  };

  const strength = getPasswordStrength();

  const handleRegister = async () => {
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (/^\d+$/.test(name.trim())) {
      setError('Name cannot contain only numbers');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLoading(true);
    const result = await register(name.trim(), email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Background Decorative Circles */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo / Brand Section */}
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ scale: logoScale }] },
              ]}
            >
              <View style={styles.logoIcon}>
                <Ionicons name="car-sport" size={36} color={colors.primary} />
              </View>
              <Text style={styles.brandName}>RentGo</Text>
              <Text style={styles.tagline}>Find your perfect rental</Text>
            </Animated.View>

            {/* Form Card */}
            <View style={[styles.formCard, shadows.medium]}>
              <Text style={styles.welcomeText}>Create Account</Text>
              <Text style={styles.subtitleText}>
                Fill in your details to get started
              </Text>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} style={styles.errorIcon} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setError('');
                  }}
                  autoCapitalize="words"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Bar */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <Animated.View
                      style={[
                        styles.strengthBarFill,
                        {
                          width: strength.width,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.strengthLabel, { color: strength.color }]}
                  >
                    {strength.label}
                  </Text>
                </View>
              )}

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchContainer}>
                  <Ionicons
                    name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                    size={14}
                    color={password === confirmPassword ? colors.success : colors.error}
                    style={styles.matchIcon}
                  />
                  <Text
                    style={[
                      styles.matchText,
                      {
                        color:
                          password === confirmPassword
                            ? colors.success
                            : colors.error,
                      },
                    ]}
                  >
                    {password === confirmPassword
                      ? 'Passwords match'
                      : 'Passwords do not match'}
                  </Text>
                </View>
              )}

              {/* Register Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login Link */}
              <TouchableOpacity
                style={styles.loginLinkButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account?{' '}
                  <Text style={styles.loginLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    top: -60,
    left: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    bottom: 80,
    right: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(236, 72, 153, 0.03)',
    top: 300,
    right: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.secondaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.inputBorder,
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 42,
    textAlign: 'right',
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  matchIcon: {
    marginRight: 6,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.inputBorder,
  },
  dividerText: {
    color: colors.textMuted,
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  loginLinkButton: {
    alignItems: 'center',
  },
  loginLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default RegisterScreen;
