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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { syncAuthenticatedProfile } from '../lib/api';
import Alert from '../lib/alert';
import {
  authRedirectUrl,
  getSupabaseClient,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from '../lib/supabase';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const RegisterScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = useMemo(() => {
    if (!password || !confirmPassword) return true;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const canSubmit = useMemo(() => {
    if (!name.trim() || !email.trim() || !phone.trim() || !gender) return false;
    if (!password.trim() || !confirmPassword.trim()) return false;
    return password === confirmPassword;
  }, [name, email, phone, gender, password, confirmPassword]);
  const isAuthReady = isSupabaseConfigured;

  const scrollToFocusedInput = useCallback((target) => {
    if (!target || !scrollViewRef.current) {
      return;
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(target, 110, true);
    }, 120);
  }, []);

  const handleRegister = async () => {
    if (!canSubmit || isSubmitting) return;

    if (!isAuthReady) {
      Alert.alert('Setup required', SUPABASE_CONFIG_ERROR_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await getSupabaseClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: authRedirectUrl,
          data: {
            full_name: name.trim(),
            phone: phone.trim(),
            gender,
          },
        },
      });

      if (error) {
        Alert.alert('Signup failed', error.message);
        return;
      }

      if (data.session) {
        let syncMessage = '';

        try {
          await syncAuthenticatedProfile({
            name: name.trim(),
            phone: phone.trim(),
            gender,
          });
        } catch (syncError) {
          syncMessage = `Signup worked, but initial profile sync failed: ${syncError.message}`;
        }

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'CompleteProfile',
              params: {
                onboarding: true,
                registeredName: name.trim(),
                registeredPhone: phone.trim(),
                registeredGender: gender,
                syncMessage,
              },
            },
          ],
        });
        return;
      }

      Alert.alert(
        'Verify email',
        'Your account was created. Please verify your email and then log in.'
      );
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Signup failed', error.message);
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
          <View style={styles.hero}>
            <View style={styles.logoMark}>
              <Ionicons name="heart" size={34} color={Colors.text} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to find your perfect match</Text>
          </View>

          <View style={styles.form}>
            {!isAuthReady && (
              <View style={styles.noticeCard}>
                <Ionicons name="cloud-offline-outline" size={18} color={Colors.accent} />
                <Text style={styles.noticeText}>
                  This build is missing the Supabase environment variables. Add them in EAS and
                  rebuild before creating accounts.
                </Text>
              </View>
            )}

            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={Colors.muted}
                value={name}
                onChangeText={setName}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                autoCorrect={false}
                textContentType="name"
              />
            </View>

            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
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

            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
              <Text style={styles.phonePrefix}>+91</Text>
              <View style={styles.phoneDivider} />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.muted}
                value={phone}
                onChangeText={setPhone}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
              />
            </View>

            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[styles.genderBtn, styles.genderBtnLeft, gender === 'male' && styles.genderBtnActive]}
                onPress={() => setGender('male')}
              >
                <Ionicons name="male-outline" size={18} color={Colors.muted} style={styles.genderIcon} />
                <Text style={styles.genderText}>Male</Text>
              </Pressable>

              <Pressable
                style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                onPress={() => setGender('female')}
              >
                <Ionicons name="female-outline" size={18} color={Colors.muted} style={styles.genderIcon} />
                <Text style={styles.genderText}>Female</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
              <TextInput
                style={[styles.input, styles.inputWithRightIcon]}
                placeholder="Enter password"
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

            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
              <TextInput
                style={[styles.input, styles.inputWithRightIcon]}
                placeholder="Confirm password"
                placeholderTextColor={Colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
              />
              <Pressable
                hitSlop={10}
                style={styles.inputRightIconBtn}
                onPress={() => setShowConfirmPassword(v => !v)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.muted}
                />
              </Pressable>
            </View>

            {!passwordsMatch && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            <Pressable
              style={[
                styles.primaryBtn,
                canSubmit && !isSubmitting && isAuthReady && styles.primaryBtnActive,
              ]}
              onPress={handleRegister}
              disabled={!canSubmit || isSubmitting || !isAuthReady}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  canSubmit && !isSubmitting && isAuthReady && styles.primaryBtnTextActive,
                ]}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Text>
            </Pressable>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.bottomLink}>Sign In</Text>
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
  hero: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 22,
  },
  title: {
    marginTop: 14,
    fontSize: 34,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    marginTop: Spacing.lg,
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
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  inputWrap: {
    height: 62,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 14,
    marginBottom: 18,
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
  phonePrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginRight: 10,
  },
  phoneDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
    marginRight: 10,
  },
  genderRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  genderBtn: {
    flex: 1,
    height: 62,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnLeft: {
    marginRight: 14,
  },
  genderBtnActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.chip,
  },
  genderIcon: {
    marginRight: 10,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 12,
    color: Colors.danger,
    fontWeight: '700',
  },
  primaryBtn: {
    height: 64,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.chip,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.muted,
  },
  primaryBtnTextActive: {
    color: Colors.text,
  },
  bottomRow: {
    marginTop: 18,
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
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
