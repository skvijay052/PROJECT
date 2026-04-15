import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import {
  getProfileById,
  getMatches,
  getProfilePhotos,
  getReceivedInterests,
  getSentInterests,
  isApiConfigured,
  sendInterest,
  updateInterestStatus,
} from '../lib/api';
import { getProfileImageSource, hasProfileImage } from '../lib/profileImage';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const FALLBACK_PROFILE = {
  name: 'Profile',
  age: '',
  marital_status: '',
  profile_visibility: 'Public',
  photo_blurred: false,
  height: '',
  title: '',
  profession: '',
  city: '',
  state: '',
  country: '',
  bio: '',
  image: '',
  isOnline: false,
};

const EMPTY_RELATION = {
  type: 'none',
  status: null,
  interestId: null,
};

const HERO_WIDTH = Dimensions.get('window').width;

function resolveInterestRelation(targetProfileId, sentResponse, receivedResponse, matchesResponse) {
  const matchedItem = (matchesResponse?.items || []).find(
    (item) => item?.profile?.id === targetProfileId
  );
  if (matchedItem) {
    return {
      type: 'matched',
      status: 'matched',
      interestId: null,
    };
  }

  const sentInterest = (sentResponse?.items || []).find(
    (item) => item?.receiver_id === targetProfileId && item?.status !== 'withdrawn'
  );
  const receivedInterest = (receivedResponse?.items || []).find(
    (item) => item?.sender_id === targetProfileId && item?.status !== 'withdrawn'
  );

  const candidate = sentInterest || receivedInterest;
  if (!candidate) {
    return EMPTY_RELATION;
  }

  if (candidate.status === 'matched') {
    return {
      type: 'matched',
      status: 'matched',
      interestId: candidate.id || null,
    };
  }

  return {
    type: sentInterest ? 'sent' : 'received',
    status: candidate.status || null,
    interestId: candidate.id || null,
  };
}

const ProfileDetailScreen = ({ navigation, route }) => {
  const routeProfile = route?.params?.profile;
  const targetProfileId = routeProfile?.id;
  const [profileData, setProfileData] = useState(() => ({
    ...FALLBACK_PROFILE,
    ...(routeProfile || {}),
    isOnline: routeProfile?.isOnline ?? routeProfile?.is_online ?? false,
  }));

  const [photoUrls, setPhotoUrls] = useState(() => {
    const initialPhotos = Array.isArray(routeProfile?.photos)
      ? routeProfile.photos
          .map((photo) => (typeof photo === 'string' ? photo : photo?.image_url || photo?.image))
          .filter(Boolean)
      : [];

    if (initialPhotos.length > 0) return initialPhotos;
    if (routeProfile?.image) return [routeProfile.image];
    return [''];
  });
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isInterestActionLoading, setIsInterestActionLoading] = useState(false);
  const [isInterestStatusLoading, setIsInterestStatusLoading] = useState(false);
  const [interestRelation, setInterestRelation] = useState(EMPTY_RELATION);

  const hasBackendProfileId =
    typeof targetProfileId === 'string' && /^[0-9a-f-]{32,}$/i.test(targetProfileId);

  const profile = useMemo(
    () => ({
      ...FALLBACK_PROFILE,
      ...(routeProfile || {}),
      ...(profileData || {}),
      isOnline:
        profileData?.isOnline ??
        profileData?.is_online ??
        routeProfile?.isOnline ??
        routeProfile?.is_online ??
        false,
    }),
    [profileData, routeProfile]
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (event.data?.action?.type !== 'GO_BACK') return;
    });

    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadProfileDetail = async () => {
        if (!isApiConfigured || !hasBackendProfileId) {
          return;
        }

        try {
          const response = await getProfileById(targetProfileId);
          if (!isMounted || !response) {
            return;
          }

          setProfileData((current) => ({
            ...current,
            ...response,
            isOnline: response.isOnline ?? response.is_online ?? current?.isOnline ?? false,
          }));

          if (
            response.image &&
            (photoUrls.length === 0 ||
              (photoUrls.length === 1 && !hasProfileImage(photoUrls[0])))
          ) {
            setPhotoUrls([response.image]);
            setActivePhotoIndex(0);
          }
        } catch (error) {
          // Keep using the route profile if the backend detail request fails.
        }
      };

      loadProfileDetail();

      return () => {
        isMounted = false;
      };
    }, [hasBackendProfileId, photoUrls, targetProfileId])
  );

  useEffect(() => {
    let isMounted = true;

    const loadPhotos = async () => {
      if (!isApiConfigured || !routeProfile?.id) return;

      try {
        const response = await getProfilePhotos(routeProfile.id);
        const nextPhotos = (response?.items || [])
          .map((photo) => photo?.image_url)
          .filter(Boolean);

        if (isMounted && nextPhotos.length > 0) {
          setPhotoUrls(nextPhotos);
          setActivePhotoIndex(0);
        }
      } catch (error) {
        // Keep the passed-in image as a fallback if backend photos are unavailable.
      }
    };

    loadPhotos();

    return () => {
      isMounted = false;
    };
  }, [routeProfile?.id]);

  const loadInterestRelation = useCallback(async () => {
    if (!isApiConfigured || !hasBackendProfileId) {
      setInterestRelation(EMPTY_RELATION);
      return;
    }

    try {
      setIsInterestStatusLoading(true);
      const [sentResponse, receivedResponse, matchesResponse] = await Promise.all([
        getSentInterests({ limit: 100 }),
        getReceivedInterests({ limit: 100 }),
        getMatches({ limit: 100 }),
      ]);

      setInterestRelation(
        resolveInterestRelation(targetProfileId, sentResponse, receivedResponse, matchesResponse)
      );
    } catch (error) {
      setInterestRelation(EMPTY_RELATION);
    } finally {
      setIsInterestStatusLoading(false);
    }
  }, [hasBackendProfileId, targetProfileId]);

  useFocusEffect(
    useCallback(() => {
      loadInterestRelation();
    }, [loadInterestRelation])
  );

  const professionText = profile.title || profile.profession || '';
  const cityText = profile.city_name || profile.city_label || profile.city_locality || profile.locality || '';
  const districtText = profile.district || profile.city || '';
  const locationText = useMemo(() => {
    const parts = [profile.city, profile.state].filter(Boolean);
    return parts.join(', ');
  }, [profile.city, profile.state]);

  const locationSubText = useMemo(() => {
    const parts = [profile.country].filter(Boolean);
    return parts.join(', ');
  }, [profile.country]);

  const heroLocationLine = useMemo(
    () => locationText || locationSubText,
    [locationText, locationSubText]
  );

  const details = useMemo(
    () => [
      {
        key: 'age',
        icon: 'person-outline',
        label: 'Age',
        value: profile.age ? `${profile.age} years` : '-',
      },
      {
        key: 'marital_status',
        icon: 'heart-outline',
        label: 'Marital Status',
        value: profile.marital_status || '-',
      },
      {
        key: 'height',
        icon: 'resize-outline',
        label: 'Height',
        value: profile.height || '-',
      },
      {
        key: 'profession',
        icon: 'briefcase-outline',
        label: 'Professional',
        value: professionText || '-',
      },
      {
        key: 'location',
        icon: 'earth-outline',
        label: 'Location',
        value: locationSubText || locationText || '-',
      },
      {
        key: 'city',
        icon: 'business-outline',
        label: 'City',
        value: cityText || '-',
      },
      {
        key: 'education',
        icon: 'school-outline',
        label: 'Education',
        value: profile.education || '-',
      },
      {
        key: 'state',
        icon: 'map-outline',
        label: 'State',
        value: profile.state || '-',
      },
      {
        key: 'district',
        icon: 'location-outline',
        label: 'District',
        value: districtText || '-',
      },
      {
        key: 'profile_visibility',
        icon: 'eye-outline',
        label: 'Who Can See Photo',
        value: profile.profile_visibility || 'Public',
      },
      {
        key: 'religion',
        icon: 'leaf-outline',
        label: 'Religion',
        value: profile.religion || '-',
      },
    ],
    [
      cityText,
      districtText,
      locationSubText,
      locationText,
      professionText,
      profile.age,
      profile.marital_status,
      profile.education,
      profile.height,
      profile.profile_visibility,
      profile.religion,
      profile.state,
    ]
  );

  const relationMeta = useMemo(() => {
    if (interestRelation.type === 'matched' || interestRelation.status === 'matched') {
      return {
        pillLabel: 'Interest Accepted',
        pillStyle: styles.statusPillMatched,
        primaryLabel: 'Accepted',
        primaryAction: null,
        primaryDisabled: true,
        secondaryLabel: 'Message',
        secondaryAction: 'chat',
        secondaryDisabled: false,
        helperText: 'This connection is already accepted. You can message now.',
      };
    }

    if (interestRelation.type === 'received' && interestRelation.status === 'pending') {
      return {
        pillLabel: 'Received Interest',
        pillStyle: styles.statusPillPending,
        primaryLabel: 'Accept Interest',
        primaryAction: 'accept',
        primaryDisabled: false,
        secondaryLabel: 'Decline',
        secondaryAction: 'reject',
        secondaryDisabled: false,
        helperText: `${profile.name || 'This profile'} has already sent you an interest.`,
      };
    }

    if (interestRelation.type === 'sent' && interestRelation.status === 'pending') {
      return {
        pillLabel: 'Interest Sent',
        pillStyle: styles.statusPillPending,
        primaryLabel: 'Awaiting Response',
        primaryAction: null,
        primaryDisabled: true,
        secondaryLabel: 'Contact Number',
        secondaryAction: 'contact',
        secondaryDisabled: false,
        helperText: 'Interest already sent. Wait for their response.',
      };
    }

    if (interestRelation.status === 'accepted') {
      return {
        pillLabel: 'Interest Accepted',
        pillStyle: styles.statusPillAccepted,
        primaryLabel: 'Accepted',
        primaryAction: null,
        primaryDisabled: true,
        secondaryLabel: 'Message',
        secondaryAction: 'chat',
        secondaryDisabled: false,
        helperText: `${profile.name || 'This profile'} accepted your interest.`,
      };
    }

    if (interestRelation.status === 'rejected') {
      return {
        pillLabel: 'Interest Rejected',
        pillStyle: styles.statusPillRejected,
        primaryLabel: 'Rejected',
        primaryAction: null,
        primaryDisabled: true,
        secondaryLabel: 'Contact Number',
        secondaryAction: 'contact',
        secondaryDisabled: false,
        helperText: 'This interest has already been rejected.',
      };
    }

    return {
      pillLabel: null,
      pillStyle: null,
      primaryLabel: 'Send Interest',
      primaryAction: 'send',
      primaryDisabled: false,
      secondaryLabel: 'Contact Number',
      secondaryAction: 'contact',
      secondaryDisabled: false,
      helperText: 'Send an interest to start the connection.',
    };
  }, [interestRelation, profile.name]);

  const isPrimaryButtonDisabled =
    isInterestActionLoading ||
    isInterestStatusLoading ||
    !isApiConfigured ||
    !hasBackendProfileId ||
    relationMeta.primaryDisabled;

  const isSecondaryButtonDisabled =
    isInterestActionLoading ||
    isInterestStatusLoading ||
    relationMeta.secondaryDisabled;

  const handleHeroScrollEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / HERO_WIDTH);
    setActivePhotoIndex(nextIndex);
  };

  const openChat = () => {
    if (!hasBackendProfileId) {
      Alert.alert('Profile not ready', 'Chat will be available once this profile is synced.');
      return;
    }

    navigation.navigate('ChatDetail', {
      profileId: targetProfileId,
      name: profile.name,
      avatar: profile.image,
      photoBlurred: profile.photo_blurred,
      isOnline: profile.isOnline,
    });
  };

  const handleSendInterest = async () => {
    try {
      setIsInterestActionLoading(true);
      const response = await sendInterest(targetProfileId);
      await loadInterestRelation();

      if (response?.match) {
        Alert.alert("It's a match", `You and ${profile.name || 'this profile'} are now matched.`);
        return;
      }

      Alert.alert('Interest sent', `Your interest was sent to ${profile.name || 'this profile'}.`);
    } catch (error) {
      Alert.alert('Unable to send interest', error?.message || 'Please try again.');
    } finally {
      setIsInterestActionLoading(false);
    }
  };

  const handleUpdateInterest = async (nextStatus) => {
    if (!interestRelation.interestId) {
      Alert.alert('Interest not found', 'Refresh the page and try again.');
      return;
    }

    try {
      setIsInterestActionLoading(true);
      const response = await updateInterestStatus(interestRelation.interestId, nextStatus);
      await loadInterestRelation();

      if (response?.match || response?.interest?.status === 'matched') {
        Alert.alert("It's a match", `You and ${profile.name || 'this profile'} are now matched.`);
        return;
      }

      if (nextStatus === 'rejected') {
        Alert.alert('Interest declined', `You declined ${profile.name || 'this profile'}.`);
      }
    } catch (error) {
      Alert.alert('Unable to update interest', error?.message || 'Please try again.');
    } finally {
      setIsInterestActionLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!isApiConfigured) {
      Alert.alert('Backend not configured', 'Add your API base URL in mobile-app/.env first.');
      return;
    }

    if (!hasBackendProfileId) {
      Alert.alert(
        'Profile not ready',
        'This profile is not synced with the backend yet, so interest sending is unavailable here.'
      );
      return;
    }

    if (relationMeta.primaryAction === 'send') {
      await handleSendInterest();
      return;
    }

    if (relationMeta.primaryAction === 'accept') {
      await handleUpdateInterest('accepted');
    }
  };

  const handleSecondaryAction = async () => {
    if (relationMeta.secondaryAction === 'reject') {
      await handleUpdateInterest('rejected');
      return;
    }

    if (relationMeta.secondaryAction === 'chat') {
      openChat();
      return;
    }

    Alert.alert(
      'Contact number',
      'Contact details can be shared after both users connect.'
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable hitSlop={10} style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>

          <Text style={styles.brand}>Bandhanaa</Text>

          <View style={styles.headerBtnPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleHeroScrollEnd}
            >
              {photoUrls.map((photoUrl, index) => (
                <Image
                  key={`${photoUrl}-${index}`}
                  source={getProfileImageSource(photoUrl)}
                  style={styles.heroSlide}
                  blurRadius={profile.photo_blurred ? 24 : 0}
                />
              ))}
            </ScrollView>

            <View style={styles.heroOverlay} />

            {profile.isOnline && (
              <View style={styles.onlinePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}

            <View style={styles.heroBottom}>
              <Text style={styles.heroName} numberOfLines={1}>
                {profile.name}
                {profile.age ? <Text style={styles.heroAge}>, {profile.age} Yrs</Text> : null}
              </Text>

              {professionText ? (
                <View style={styles.heroInfoRow}>
                  <Ionicons
                    name="briefcase-outline"
                    size={16}
                    color={Colors.surface}
                    style={styles.heroInfoIcon}
                  />
                  <Text style={styles.heroInfoText}>{professionText}</Text>
                </View>
              ) : null}

              {heroLocationLine ? (
                <View style={styles.heroInfoRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={Colors.surface}
                    style={styles.heroInfoIcon}
                  />
                  <Text style={styles.heroInfoText}>{heroLocationLine}</Text>
                </View>
              ) : null}
            </View>

            {photoUrls.length > 1 ? (
              <View style={styles.dotsRow}>
                {photoUrls.map((photoUrl, index) => (
                  <View
                    key={`${photoUrl}-dot-${index}`}
                    style={[styles.dot, index === activePhotoIndex && styles.dotActive]}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              {relationMeta.pillLabel ? (
                <View style={[styles.statusPill, relationMeta.pillStyle]}>
                  <Text style={styles.statusPillText}>{relationMeta.pillLabel}</Text>
                </View>
              ) : null}

              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.primaryBtn, isPrimaryButtonDisabled && styles.primaryBtnDisabled]}
                  disabled={isPrimaryButtonDisabled}
                  onPress={handlePrimaryAction}
                >
                  {isInterestActionLoading ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{relationMeta.primaryLabel}</Text>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.secondaryBtn, isSecondaryButtonDisabled && styles.secondaryBtnDisabled]}
                  disabled={isSecondaryButtonDisabled}
                  onPress={handleSecondaryAction}
                >
                  <Text style={styles.secondaryBtnText}>{relationMeta.secondaryLabel}</Text>
                </Pressable>
              </View>

              <Text style={styles.relationHelperText}>
                {isInterestStatusLoading ? 'Checking connection status...' : relationMeta.helperText}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>About Me</Text>
              <Text style={styles.cardBody}>{profile.bio || '-'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Basic Details</Text>
              <View style={styles.detailList}>
                {details.map((row, index) => (
                  <View key={row.key} style={[styles.detailRow, index !== 0 && styles.detailRowBorder]}>
                    <View style={styles.detailLeft}>
                      <View style={styles.detailIconWrap}>
                        <Ionicons name={row.icon} size={18} color={Colors.text} />
                      </View>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                    </View>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 44,
    height: 44,
  },
  brand: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: '600',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'serif', default: 'serif' }),
  },
  scrollContent: {
    paddingBottom: Spacing.xl + 90,
  },
  heroWrap: {
    height: 460,
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  heroSlide: {
    width: HERO_WIDTH,
    height: 460,
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  onlinePill: {
    position: 'absolute',
    top: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors.online,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surface,
    marginRight: 8,
    opacity: 0.95,
  },
  onlineText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 14,
  },
  heroBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: 18,
    paddingBottom: 20,
  },
  heroName: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.surface,
  },
  heroAge: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.surface,
    opacity: 0.95,
  },
  heroInfoRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfoIcon: {
    marginRight: 10,
    opacity: 0.95,
  },
  heroInfoText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
    opacity: 0.95,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 18,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 20,
    borderRadius: 999,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    marginBottom: Spacing.lg,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 14,
  },
  statusPillPending: {
    backgroundColor: '#FFF3DA',
  },
  statusPillAccepted: {
    backgroundColor: '#E7F6EE',
  },
  statusPillMatched: {
    backgroundColor: '#E7F6EE',
  },
  statusPillRejected: {
    backgroundColor: '#FDEBEC',
  },
  statusPillText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 1.2,
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.muted,
  },
  primaryBtnText: {
    color: Colors.surface,
    fontWeight: '900',
    fontSize: 15,
  },
  secondaryBtn: {
    flex: 1,
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnDisabled: {
    opacity: 0.5,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontWeight: '900',
    fontSize: 14,
  },
  relationHelperText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 22,
    fontWeight: '600',
  },
  detailList: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.muted,
  },
  detailValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '900',
    color: Colors.text,
    maxWidth: '58%',
    textAlign: 'right',
  },
});

export default ProfileDetailScreen;
