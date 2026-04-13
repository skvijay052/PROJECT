import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />

        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <Ionicons name="heart" size={34} color={Colors.text} />
          </View>
          <Text style={styles.brand}>Bandhanaa</Text>
          <Text style={styles.tagline}>WHERE HEARTS UNITE</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Find Your Life Partner</Text>
          <Text style={styles.subtitle}>
            Connect with genuine profiles and begin your journey today.
          </Text>

          <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryBtnText}>Login</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </Pressable>
        </View>
      </View>
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
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  blobOne: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.chip,
    top: -60,
    right: -70,
    opacity: 0.6,
  },
  blobTwo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.chip,
    bottom: -40,
    left: -50,
    opacity: 0.5,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  primaryBtn: {
    height: 58,
    borderRadius: Radii.xl,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: Colors.surface,
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryBtn: {
    height: 58,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
});

export default WelcomeScreen;
