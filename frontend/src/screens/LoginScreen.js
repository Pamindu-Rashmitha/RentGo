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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
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

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
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
    const result = await login(email.trim(), password);
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
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={colors.error} style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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

            {/* Login Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Link */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
    top: 200,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
    bottom: 100,
    right: -30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
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
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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
    marginBottom: 14,
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
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default LoginScreen;
