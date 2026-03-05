import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing, Fonts } from '../theme';

type AuthMode = 'login' | 'register' | 'forgot';

// ─── Validation Helpers ───────────────────────────────

const validateEmail = (email: string): string | null => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return 'Email is required';
  if (!re.test(email.trim())) return 'Invalid email format';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must include an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Must include a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Must include a number';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'Must include a special character';
  return null;
};

const validateUsername = (username: string): string | null => {
  if (!username.trim()) return 'Username is required';
  if (username.trim().length < 3) return 'Username must be at least 3 characters';
  if (username.trim().length > 20) return 'Username must be under 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
    return 'Only letters, numbers, and underscores allowed';
  return null;
};

// ─── Component ────────────────────────────────────────

const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-level errors
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirmPassword('');
    setErrors({});
    setShowPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    clearForm();
    setMode(newMode);
  };

  // ─── Login ──────────────────────────────────────────

  const handleLogin = async () => {
    const emailErr = validateEmail(email);
    if (emailErr || !password) {
      setErrors({
        email: emailErr,
        password: !password ? 'Password is required' : null,
      });
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      if (msg.includes('Invalid login credentials')) {
        Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
      } else if (msg.includes('Email not confirmed')) {
        Alert.alert('Email Not Verified', 'Please check your inbox and verify your email before logging in.');
      } else {
        Alert.alert('Login Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Register ───────────────────────────────────────

  const handleRegister = async () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const usernameErr = validateUsername(username);
    const confirmErr =
      !confirmPassword
        ? 'Please confirm your password'
        : password !== confirmPassword
        ? 'Passwords do not match'
        : null;

    const newErrors = {
      email: emailErr,
      password: passwordErr,
      username: usernameErr,
      confirmPassword: confirmErr,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e !== null)) return;

    setLoading(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert(
        'Account Created',
        'Welcome to Uncut! If email confirmation is enabled, please check your inbox.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      const msg = err?.message || 'Registration failed';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        Alert.alert('Email Taken', 'An account with this email already exists. Try logging in instead.');
      } else {
        Alert.alert('Registration Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password ───────────────────────────────

  const handleForgotPassword = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrors({ email: emailErr });
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Reset Link Sent',
        'If an account exists with this email, you will receive a password reset link.',
        [{ text: 'OK', onPress: () => switchMode('login') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoIconCircle}>
            <Ionicons name="film" size={32} color={Colors.accent} />
          </View>
          <Text style={styles.logo}>UNCUT</Text>
          <Text style={styles.tagline}>
            {mode === 'login'
              ? 'Welcome back'
              : mode === 'register'
              ? 'Create your account'
              : 'Reset your password'}
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* ─── Register: Username ──── */}
          {mode === 'register' && (
            <InputField
              icon="person-outline"
              placeholder="Username"
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                if (errors.username) setErrors((e) => ({ ...e, username: null }));
              }}
              error={errors.username}
              autoCapitalize="none"
            />
          )}

          {/* ─── Email ──── */}
          <InputField
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: null }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* ─── Password ──── */}
          {mode !== 'forgot' && (
            <InputField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: null }));
              }}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              }
            />
          )}

          {/* ─── Register: Confirm Password ──── */}
          {mode === 'register' && (
            <InputField
              icon="lock-closed-outline"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (errors.confirmPassword)
                  setErrors((e) => ({ ...e, confirmPassword: null }));
              }}
              error={errors.confirmPassword}
              secureTextEntry={!showPassword}
            />
          )}

          {/* ─── Password strength hint (register) ──── */}
          {mode === 'register' && password.length > 0 && (
            <PasswordStrength password={password} />
          )}

          {/* ─── Forgot password link (login) ──── */}
          {mode === 'login' && (
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => switchMode('forgot')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* ─── Submit Button ──── */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={
              mode === 'login'
                ? handleLogin
                : mode === 'register'
                ? handleRegister
                : handleForgotPassword
            }
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'login'
                  ? 'SIGN IN'
                  : mode === 'register'
                  ? 'CREATE ACCOUNT'
                  : 'SEND RESET LINK'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        {mode === 'register' && (
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.accent} />
            <Text style={styles.infoBannerText}>
              Your data is secure. We never share your information.
            </Text>
          </View>
        )}

        {/* ─── Toggle Mode ──── */}
        <View style={styles.toggleSection}>
          {mode === 'forgot' ? (
            <TouchableOpacity onPress={() => switchMode('login')}>
              <Text style={styles.toggleText}>
                ← Back to <Text style={styles.toggleHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
            >
              <Text style={styles.toggleText}>
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.toggleHighlight}>
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Input Field Sub-Component ────────────────────────

interface InputFieldProps {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  rightIcon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  rightIcon,
}) => (
  <View style={styles.inputWrapper}>
    <View style={[styles.inputContainer, error ? styles.inputError : null]}>
      <Ionicons name={icon} size={18} color={error ? Colors.error : Colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {rightIcon}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Password Strength Indicator ──────────────────────

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = [Colors.error, '#E8873C', Colors.warning, '#5BA37C', Colors.success];
  const index = Math.max(0, score - 1);

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBarBg}>
        <View
          style={[
            styles.strengthBarFill,
            { width: `${(score / 5) * 100}%`, backgroundColor: colors[index] },
          ]}
        />
      </View>
      <Text style={[styles.strengthLabel, { color: colors[index] }]}>
        {labels[index]}
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: Spacing.xxl,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    fontSize: 40,
    fontFamily: Fonts.black,
    color: Colors.accent,
    letterSpacing: 6,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: Spacing.sm,
    fontFamily: Fonts.medium,
  },

  // Form Card
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Input
  inputWrapper: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 50,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.regular,
    marginLeft: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginTop: 6,
    marginLeft: Spacing.md,
  },

  // Forgot link
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    color: Colors.accent,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },

  // Submit
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
    letterSpacing: 1,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoBannerText: {
    color: Colors.accent,
    fontSize: 13,
    fontFamily: Fonts.medium,
    marginLeft: Spacing.sm,
    flex: 1,
  },

  // Password strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    minWidth: 70,
    textAlign: 'right',
  },

  // Toggle
  toggleSection: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  toggleHighlight: {
    color: Colors.accent,
    fontFamily: Fonts.bold,
  },
});

export default AuthScreen;
