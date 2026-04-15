import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getMyProfile, getMyProfileStats } from '../lib/api';
import { ProfileScreenSkeleton } from '../components/Skeleton';
import { getProfileImageSource } from '../lib/profileImage';
import { signOutSupabaseSession } from '../lib/supabase';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [profileStats, setProfileStats] = useState({
    matches: 0,
    interests: 0,
    declined: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const showSkeleton = isLoading;
  const showError = !showSkeleton && Boolean(loadError) && !profile;

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileResult, statsResult] = await Promise.allSettled([
        getMyProfile(),
        getMyProfileStats(),
      ]);

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
        setLoadError('');
      } else {
        const error = profileResult.reason;
        if (error?.status === 404) {
          setProfile(null);
          setLoadError('');
        } else {
          setLoadError(error?.message || 'Unable to load your profile right now.');
        }
      }

      if (statsResult.status === 'fulfilled') {
        setProfileStats({
          matches: Number(statsResult.value?.matches) || 0,
          interests: Number(statsResult.value?.interests) || 0,
          declined: Number(statsResult.value?.declined) || 0,
        });
      } else {
        setProfileStats({ matches: 0, interests: 0, declined: 0 });
      }
    } catch (error) {
      if (error?.status === 404) {
        setProfile(null);
        setLoadError('');
      } else {
        setLoadError(error?.message || 'Unable to load your profile right now.');
      }
      setProfileStats({ matches: 0, interests: 0, declined: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const resetToWelcome = () => {
    let rootNavigation = navigation;
    while (rootNavigation.getParent?.()) {
      rootNavigation = rootNavigation.getParent();
    }

    rootNavigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await signOutSupabaseSession();
      resetToWelcome();
    } catch (error) {
      Alert.alert('Logout failed', error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const name = profile?.name || 'Complete your profile';
  const about = profile?.bio || 'Add your basic details so your profile is ready for matching.';
  const photoSource = getProfileImageSource(profile?.image);
  const fullLocation = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ');
  const summaryLine = useMemo(() => {
    const parts = [];
    if (profile?.age) parts.push(`${profile.age} yrs`);
    if (profile?.marital_status) parts.push(profile.marital_status);
    if (profile?.title) parts.push(profile.title);
    const location = [profile?.city, profile?.state].filter(Boolean).join(', ');
    if (location) parts.push(location);
    return parts.join(' • ');
  }, [profile]);

  const stats = useMemo(
    () => [
      { key: 'matches', value: String(profileStats.matches || 0), label: 'Matches' },
      { key: 'interests', value: String(profileStats.interests || 0), label: 'Interests' },
      { key: 'declined', value: String(profileStats.declined || 0), label: 'Declined' },
    ],
    [profileStats]
  );
  const basicDetails = [
    {
      key: 'age',
      icon: 'person-outline',
      label: 'Age',
      value: profile?.age ? `${profile.age} years` : '-',
    },
    {
      key: 'marital_status',
      icon: 'heart-outline',
      label: 'Marital Status',
      value: profile?.marital_status || '-',
    },
    {
      key: 'height',
      icon: 'resize-outline',
      label: 'Height',
      value: profile?.height || '-',
    },
    {
      key: 'profession',
      icon: 'briefcase-outline',
      label: 'Profession',
      value: profile?.title || '-',
    },
    {
      key: 'education',
      icon: 'school-outline',
      label: 'Education',
      value: profile?.education || '-',
    },
    {
      key: 'location',
      icon: 'location-outline',
      label: 'Location',
      value: fullLocation || '-',
    },
    {
      key: 'religion',
      icon: 'flower-outline',
      label: 'Religion',
      value: profile?.religion || '-',
    },
    {
      key: 'caste',
      icon: 'layers-outline',
      label: 'Caste',
      value: profile?.caste || '-',
    },
    {
      key: 'profile_visibility',
      icon: 'eye-outline',
      label: 'Who Can See Photo',
      value: profile?.profile_visibility || 'Public',
    },
    {
      key: 'phone',
      icon: 'call-outline',
      label: 'Phone',
      value: profile?.phone || '-',
    },
  ];

  const options = [
    { key: 'upload', label: 'Upload Photos', icon: 'images-outline', onPress: () => navigation.navigate('UploadPhotos') },
    { key: 'prefs', label: 'Preferences', icon: 'options-outline', onPress: () => navigation.navigate('Preferences') },
    // { key: 'sub', label: 'Subscription', icon: 'diamond-outline', onPress: () => navigation.navigate('Subscription') },
    { key: 'notif', label: 'Notifications', icon: 'notifications-outline', onPress: () => navigation.navigate('Notifications') },
    // { key: 'blocked', label: 'Blocked Users', icon: 'shield-outline', onPress: () => navigation.navigate('BlockedUsers') },
    {
      key: 'logout',
      label: isLoggingOut ? 'Logging out...' : 'Logout',
      icon: 'log-out-outline',
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Pressable
            hitSlop={10}
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Preferences')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showSkeleton ? <ProfileScreenSkeleton /> : null}

          {showError ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable style={styles.retryBtn} onPress={loadProfile}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          ) : null}

          {!showSkeleton ? (
            <>
          <View style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.avatarRing}>
                <Image
                  source={photoSource}
                  style={styles.avatar}
                  blurRadius={profile?.photo_blurred ? 18 : 0}
                />
              </View>

              <View style={styles.statsRow}>
                {stats.map(stat => (
                  <View key={stat.key} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.online} style={styles.verified} />
            </View>

            <Text style={styles.about} numberOfLines={4}>
              {about}
            </Text>

            {summaryLine ? (
              <Text style={styles.summaryLine}>{summaryLine}</Text>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={[styles.actionText, styles.actionTextPrimary]}>Edit Profile</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.actionSecondary]}
                onPress={() => navigation.navigate('Preferences')}
              >
                <Text style={styles.actionText}>Preferences</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.actionSecondary]}
                onPress={() => navigation.navigate('UploadPhotos')}
              >
                <Text style={styles.actionText}>Photos</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.actionIcon]}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={20} color={Colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.sectionBody}>{about}</Text>
          </View>

          <View style={styles.basicCard}>
            <Text style={styles.basicTitle}>Basic Details</Text>
            {profile ? (
              <View style={styles.basicList}>
                {basicDetails.map((item, index) => (
                  <View
                    key={item.key}
                    style={[styles.basicRow, index !== 0 && styles.basicRowBorder]}
                  >
                    <View style={styles.basicLeft}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={Colors.muted}
                        style={styles.basicIcon}
                      />
                      <Text style={styles.basicLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.basicValue} numberOfLines={2}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.sectionBody}>
                No profile details yet. Tap Edit Profile to add them.
              </Text>
            )}
          </View>

            <View style={styles.optionList}>
              {options.map((opt, idx) => (
                <Pressable
                  key={opt.key}
                  style={[styles.optionRow, idx !== 0 && styles.optionRowBorder]}
                  onPress={opt.onPress}
                >
                  <View style={[styles.optionIconWrap, opt.danger && styles.optionIconDanger]}>
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={opt.danger ? Colors.danger : Colors.text}
                    />
                  </View>
                  <Text style={[styles.optionLabel, opt.danger && styles.optionLabelDanger]}>{opt.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
                </Pressable>
              ))}
            </View>
            </>
          ) : null}
        </ScrollView>
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
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 80,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    marginBottom: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 4,
    borderWidth: 3,
    borderColor: Colors.danger,
    marginRight: Spacing.lg,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    backgroundColor: Colors.chip,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  verified: {
    marginLeft: 8,
    marginTop: 2,
  },
  about: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 22,
  },
  summaryLine: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
  },
  actionsRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    flex: 1.2,
    backgroundColor: Colors.text,
    marginRight: 10,
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: Colors.chip,
    marginRight: 10,
  },
  actionIcon: {
    width: 46,
    backgroundColor: Colors.chip,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  actionTextPrimary: {
    color: Colors.surface,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 22,
  },
  basicCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 22,
    ...Shadows.card,
    marginBottom: Spacing.lg,
  },
  basicTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
  },
  basicList: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  basicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  basicRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  basicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  basicIcon: {
    width: 28,
    textAlign: 'center',
    marginRight: 12,
  },
  basicLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.muted,
  },
  basicValue: {
    flexShrink: 1,
    maxWidth: '58%',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  optionList: {
    marginTop: 14,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
  },
  optionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: Colors.chip,
  },
  optionIconDanger: {
    backgroundColor: 'rgba(255, 90, 95, 0.12)',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  optionLabelDanger: {
    color: Colors.danger,
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
    marginBottom: Spacing.lg,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.chip,
  },
  retryBtnText: {
    color: Colors.text,
    fontWeight: '800',
  },
});

export default ProfileScreen;
