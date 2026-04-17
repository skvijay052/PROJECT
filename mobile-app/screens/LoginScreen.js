import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { syncAuthenticatedProfile } from '../lib/api';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from '../lib/supabase';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const LoginScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buttonLabel = useMemo(() => (
    method === 'email' ? 'Login with Email' : 'Login with OTP'
  ), [method]);

  const canSubmit = useMemo(() => {
    if (method === 'email') return email.trim().length > 0 && password.trim().length > 0;
    return phone.trim().length > 0 && otp.trim().length > 0;
  }, [email, password, phone, otp, method]);
  const isAuthReady = isSupabaseConfigured;

  const scrollToFocusedInput = useCallback((target) => {
    if (!target || !scrollViewRef.current) {
      return;
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(target, 110, true);
    }, 120);
  }, []);

  const handleLogin = async () => {
    if (!canSubmit || isSubmitting) return;

    if (!isAuthReady) {
      Alert.alert('Setup required', SUPABASE_CONFIG_ERROR_MESSAGE);
      return;
    }

    if (method !== 'email') {
      Alert.alert('Not ready yet', 'Phone OTP login is not wired yet. Please use email login.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Login failed', error.message);
        return;
      }

      try {
        await syncAuthenticatedProfile();
      } catch (syncError) {
        Alert.alert(
          'Logged in',
          `Authentication worked, but profile sync failed: ${syncError.message}`
        );
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 24}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoArea}>
            <View style={styles.logoMark}>
              <Ionicons name="heart" size={34} color={Colors.text} />
            </View>
            <Text style={styles.brand}>Bandhanaa</Text>
            <Text style={styles.tagline}>WHERE HEARTS UNITE</Text>
          </View>

          {/* <View style={styles.switchWrap}>
            <View style={styles.switchContainer}>
              <Pressable
                style={[styles.switchBtn, method === 'email' && styles.switchBtnActive]}
                onPress={() => setMethod('email')}
              >
                <Ionicons name="mail-outline" size={18} color={Colors.text} style={styles.switchIcon} />
                <Text style={styles.switchText}>Email</Text>
              </Pressable>

              <Pressable
                style={[styles.switchBtn, method === 'phone' && styles.switchBtnActive]}
                onPress={() => setMethod('phone')}
              >
                <Ionicons name="call-outline" size={18} color={Colors.text} style={styles.switchIcon} />
                <Text style={styles.switchText}>Phone OTP</Text>
              </Pressable>
            </View>
          </View> */}

          <View style={styles.form}>
            {!isAuthReady && (
              <View style={styles.noticeCard}>
                <Ionicons name="cloud-offline-outline" size={18} color={Colors.accent} />
                <Text style={styles.noticeText}>
                  This build is missing the Supabase environment variables. Add them in EAS and
                  rebuild before using login.
                </Text>
              </View>
            )}

            {method === 'email' ? (
              <>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={Colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={(event) => scrollToFocusedInput(event.target)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
                  <TextInput
                    style={[styles.input, styles.inputWithRightIcon]}
                    placeholder="Password"
                    placeholderTextColor={Colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={(event) => scrollToFocusedInput(event.target)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                  />
                  <Pressable
                    hitSlop={10}
                    style={styles.inputRightIconBtn}
                    onPress={() => setShowPassword(v => !v)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.muted}
                    />
                  </Pressable>
                </View>

                <Pressable
                  hitSlop={10}
                  style={styles.forgotBtn}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.inputWrap}>
                  <Ionicons name="call-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={Colors.muted}
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={(event) => scrollToFocusedInput(event.target)}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Ionicons name="key-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="OTP"
                    placeholderTextColor={Colors.muted}
                    value={otp}
                    onChangeText={setOtp}
                    onFocus={(event) => scrollToFocusedInput(event.target)}
                    keyboardType="number-pad"
                  />
                </View>
              </>
            )}

            <Pressable
              style={[
                styles.primaryBtn,
                canSubmit && !isSubmitting && isAuthReady && styles.primaryBtnActive,
              ]}
              onPress={handleLogin}
              disabled={!canSubmit || isSubmitting || !isAuthReady}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  canSubmit && !isSubmitting && isAuthReady && styles.primaryBtnTextActive,
                ]}
              >
                {isSubmitting ? 'Signing In...' : buttonLabel}
              </Text>
            </Pressable>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.bottomLink}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 180,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: 42,
    paddingBottom: 22,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.chip,
    marginBottom: 14,
  },
  brand: {
    color: Colors.text,
    fontSize: 42,
    fontWeight: '600',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'serif', default: 'serif' }),
    marginBottom: 6,
  },
  tagline: {
    color: Colors.muted,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  switchWrap: {
    marginTop: Spacing.xl,
  },
  switchContainer: {
    backgroundColor: Colors.chip,
    borderRadius: Radii.xl,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadows.chip,
  },
  switchIcon: {
    marginRight: 10,
  },
  switchText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  form: {
    marginTop: Spacing.xl,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(160, 45, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(160, 45, 255, 0.16)',
    marginBottom: 18,
  },
  noticeText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  inputWrap: {
    height: 62,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 14,
    marginBottom: 16,
  },
  inputLeftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
  },
  inputWithRightIcon: {
    paddingRight: 10,
  },
  inputRightIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 18,
  },
  forgotText: {
    color: Colors.text,
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  primaryBtn: {
    height: 64,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.chip,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.muted,
  },
  primaryBtnTextActive: {
    color: Colors.text,
  },
  orRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    marginHorizontal: 14,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.muted,
  },
  bottomRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomText: {
    fontSize: 14,
    color: Colors.muted,
  },
  bottomLink: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
