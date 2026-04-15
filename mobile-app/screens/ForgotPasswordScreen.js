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

import { requestPasswordReset } from '../lib/api';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = useMemo(() => {
    if (!newPassword || !confirmPassword) return true;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 0 &&
      newPassword.trim().length >= 6 &&
      confirmPassword.trim().length >= 6 &&
      newPassword === confirmPassword
    );
  }, [confirmPassword, email, newPassword]);

  const scrollToFocusedInput = useCallback((target) => {
    if (!target || !scrollViewRef.current) {
      return;
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(target, 110, true);
    }, 120);
  }, []);

  const handleResetPassword = async () => {
    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await requestPasswordReset(
        email.trim(),
        newPassword,
        confirmPassword
      );

      Alert.alert(
        'Password updated',
        response?.message || 'Your password has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Reset failed', error?.message || 'Unable to update your password right now.');
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
          <Pressable hitSlop={10} style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.logoMark}>
              <Ionicons name="lock-closed" size={30} color={Colors.text} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and choose a new password to regain access.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={Colors.muted}
                style={styles.inputLeftIcon}
              />
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
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.muted}
                style={styles.inputLeftIcon}
              />
              <TextInput
                style={[styles.input, styles.inputWithRightIcon]}
                placeholder="New Password"
                placeholderTextColor={Colors.muted}
                value={newPassword}
                onChangeText={setNewPassword}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
              />
              <Pressable
                hitSlop={10}
                style={styles.inputRightIconBtn}
                onPress={() => setShowNewPassword((value) => !value)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.muted}
                />
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={Colors.muted}
                style={styles.inputLeftIcon}
              />
              <TextInput
                style={[styles.input, styles.inputWithRightIcon]}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
              />
              <Pressable
                hitSlop={10}
                style={styles.inputRightIconBtn}
                onPress={() => setShowConfirmPassword((value) => !value)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.muted}
                />
              </Pressable>
            </View>

            {!passwordsMatch ? (
              <Text style={styles.errorText}>Passwords do not match.</Text>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, canSubmit && !isSubmitting && styles.primaryBtnActive]}
              onPress={handleResetPassword}
              disabled={!canSubmit || isSubmitting}
            >
              <Text style={[styles.primaryBtnText, canSubmit && !isSubmitting && styles.primaryBtnTextActive]}>
                {isSubmitting ? 'Updating Password...' : 'Update Password'}
              </Text>
            </Pressable>
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
    paddingBottom: Spacing.xl + 120,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.chip,
    marginBottom: 16,
  },
  title: {
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
    lineHeight: 20,
  },
  form: {
    marginTop: Spacing.lg,
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
});

export default ForgotPasswordScreen;
