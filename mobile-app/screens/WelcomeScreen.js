import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const fallbackAvatar = require('../assets/default-profile-photo.png');
const avatarNodes = [
  {
    id: 'top',
    size: 104,
    source: 'https://i.pravatar.cc/240?img=48',
    wrapperStyle: { top: 22, left: '50%', marginLeft: -52 },
  },
  {
    id: 'leftTop',
    size: 92,
    source: 'https://i.pravatar.cc/220?img=31',
    wrapperStyle: { top: 134, left: 34 },
  },
  {
    id: 'rightTop',
    size: 92,
    source: 'https://i.pravatar.cc/220?img=15',
    wrapperStyle: { top: 142, right: 34 },
  },
  {
    id: 'leftBottom',
    size: 88,
    source: 'https://i.pravatar.cc/220?img=12',
    wrapperStyle: { top: 250, left: 18 },
  },
  {
    id: 'rightBottom',
    size: 88,
    source: 'https://i.pravatar.cc/220?img=45',
    wrapperStyle: { top: 262, right: 18 },
  },
];

const WelcomeScreen = ({ navigation }) => {
  const [failedAvatarIds, setFailedAvatarIds] = useState({});

  const handleAvatarError = useCallback((avatarId) => {
    setFailedAvatarIds((current) => (
      current[avatarId]
        ? current
        : { ...current, [avatarId]: true }
    ));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardGlow} />
          <View style={[styles.cardGlow, styles.cardGlowBottom]} />

          <View style={styles.cluster}>
            <View style={[styles.branch, styles.branchLeft]} />
            <View style={[styles.branch, styles.branchCenter]} />
            <View style={[styles.branch, styles.branchRight]} />

            {avatarNodes.map((avatar) => (
              <View
                key={avatar.id}
                style={[
                  styles.avatarShell,
                  avatar.wrapperStyle,
                  {
                    width: avatar.size,
                    height: avatar.size,
                    borderRadius: avatar.size / 2,
                  },
                ]}
              >
                <Image
                  source={failedAvatarIds[avatar.id] ? fallbackAvatar : { uri: avatar.source }}
                  defaultSource={fallbackAvatar}
                  onError={() => handleAvatarError(avatar.id)}
                  style={styles.avatarImage}
                />
              </View>
            ))}
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>Love is One{'\n'}Swipe Away</Text>
            <Text style={styles.subtitle}>
              Seamlessly access our services by signing in or create an account to unlock
              exciting features.
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionBtn, styles.primaryBtn]} onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.actionText, styles.primaryBtnText]}>Join Now</Text>
            </Pressable>

            <Pressable style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.actionText, styles.secondaryBtnText]}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    minHeight: 680,
    ...Shadows.card,
  },
  cardGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: 144,
    left: 20,
    backgroundColor: 'rgba(174, 241, 233, 0.28)',
  },
  cardGlowBottom: {
    width: 190,
    height: 190,
    borderRadius: 95,
    top: 286,
    right: 24,
    backgroundColor: 'rgba(246, 236, 180, 0.2)',
  },
  cluster: {
    height: 404,
    marginBottom: 8,
  },
  branch: {
    position: 'absolute',
    width: 18,
    borderRadius: 999,
    backgroundColor: Colors.accentSoft,
    opacity: 0.96,
  },
  branchLeft: {
    top: 126,
    left: 106,
    height: 218,
  },
  branchCenter: {
    top: 84,
    left: '50%',
    marginLeft: -9,
    width: 20,
    height: 280,
  },
  branchRight: {
    top: 134,
    right: 106,
    height: 218,
  },
  avatarShell: {
    position: 'absolute',
    padding: 6,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    ...Shadows.chip,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  copyBlock: {
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.8,
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif-black',
      default: 'system',
    }),
  },
  subtitle: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.muted,
    paddingRight: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    height: 58,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    marginRight: 12,
    backgroundColor: '#050505',
  },
  secondaryBtn: {
    backgroundColor: Colors.accent,
    ...Shadows.chip,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif-medium',
      default: 'system',
    }),
  },
  primaryBtnText: {
    color: Colors.surface,
  },
  secondaryBtnText: {
    color: Colors.surface,
  },
});

export default WelcomeScreen;
