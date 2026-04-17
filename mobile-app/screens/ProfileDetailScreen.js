import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Modal,
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
import { Colors, Radii, Shadows } from '../theme/theme';

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

const PAGE_GUTTER = 18;
const HERO_WIDTH = Dimensions.get('window').width - PAGE_GUTTER * 2;
const VIEWER_WIDTH = Dimensions.get('window').width;

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
  const heroScrollRef = useRef(null);
  const viewerScrollRef = useRef(null);
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
  const [isViewerVisible, setIsViewerVisible] = useState(false);
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
    const parts = [profile.city, profile.state, profile.country].filter(Boolean);
    return parts.join(', ');
  }, [profile.city, profile.country, profile.state]);

  const locationSubText = useMemo(() => {
    const parts = [profile.country].filter(Boolean);
    return parts.join(', ');
  }, [profile.country]);

  const heroLocationLine = useMemo(
    () => {
      const parts = [cityText || districtText, profile.state, profile.country].filter(Boolean);
      return parts.join(', ') || locationText || locationSubText;
    },
    [cityText, districtText, locationSubText, locationText, profile.country, profile.state]
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
        label: 'Profession',
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
        label: 'Photo Access',
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

  const summaryStats = useMemo(
    () => [
      {
        key: 'age',
        label: 'Age',
        value: profile.age ? `${profile.age}` : '-',
      },
      {
        key: 'height',
        label: 'Height',
        value: profile.height || '-',
      },
    ],
    [profile.age, profile.height]
  );

  const highlightTags = useMemo(
    () =>
      [
        professionText,
        profile.education,
        profile.religion,
        profile.marital_status,
        cityText || districtText,
        profile.state,
      ]
        .filter(Boolean)
        .slice(0, 6),
    [
      cityText,
      districtText,
      professionText,
      profile.education,
      profile.marital_status,
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
        headline: 'You are already connected',
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
        headline: 'Someone is interested in you',
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
        headline: 'Your interest is in progress',
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
        headline: 'This profile accepted your interest',
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
        headline: 'This connection is closed for now',
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
      headline: 'Ready to start the conversation?',
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

  const handleViewerScrollEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / VIEWER_WIDTH);
    setActivePhotoIndex(nextIndex);
  };

  const handleThumbnailPress = (index) => {
    setActivePhotoIndex(index);
    heroScrollRef.current?.scrollTo({
      x: index * HERO_WIDTH,
      animated: true,
    });
  };

  const openPhotoViewer = (index = activePhotoIndex) => {
    setActivePhotoIndex(index);
    setIsViewerVisible(true);
  };

  const closePhotoViewer = () => {
    setIsViewerVisible(false);
  };

  useEffect(() => {
    if (!isViewerVisible) {
      return;
    }

    const timer = setTimeout(() => {
      viewerScrollRef.current?.scrollTo({
        x: activePhotoIndex * VIEWER_WIDTH,
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [activePhotoIndex, isViewerVisible]);

  useEffect(() => {
    if (isViewerVisible) {
      return;
    }

    const timer = setTimeout(() => {
      heroScrollRef.current?.scrollTo({
        x: activePhotoIndex * HERO_WIDTH,
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [activePhotoIndex, isViewerVisible]);

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
      <StatusBar style={isViewerVisible ? 'light' : 'dark'} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable hitSlop={10} style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerEyebrow}>Profile Detail</Text>
            <Text style={styles.headerTitle}>Modern Match View</Text>
          </View>

          <View style={styles.headerBadge}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.accent} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <View style={styles.heroGlowMint} />
            <View style={styles.heroGlowLavender} />

            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleHeroScrollEnd}
            >
              {photoUrls.map((photoUrl, index) => (
                <View key={`${photoUrl}-${index}`} style={styles.heroSlideWrap}>
                  <Pressable style={styles.heroTapArea} onPress={() => openPhotoViewer(index)}>
                    <Image
                      source={getProfileImageSource(photoUrl)}
                      style={styles.heroSlide}
                      blurRadius={profile.photo_blurred ? 24 : 0}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <View style={styles.heroShadeTop} />
            <View style={styles.heroShadeBottom} />

            <View style={styles.heroTopRow}>
              <View style={styles.heroGlassPill}>
                <Ionicons name="images-outline" size={14} color={Colors.surface} />
                <Text style={styles.heroGlassText}>
                  {activePhotoIndex + 1}/{photoUrls.length}
                </Text>
              </View>

              {profile.isOnline ? (
                <View style={[styles.heroGlassPill, styles.heroOnlinePill]}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.heroGlassText}>Online</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.heroBottom}>
              <Text style={styles.heroName} numberOfLines={1}>
                {profile.name}
                {profile.age ? <Text style={styles.heroAge}> , {profile.age}</Text> : null}
              </Text>

              {professionText ? (
                <Text style={styles.heroSubtitle} numberOfLines={1}>
                  {professionText}
                </Text>
              ) : null}

              {heroLocationLine ? (
                <View style={styles.heroInfoRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.surface} />
                  <Text style={styles.heroInfoText} numberOfLines={1}>
                    {heroLocationLine}
                  </Text>
                </View>
              ) : null}

              {profile.photo_blurred ? (
                <View style={styles.blurNotice}>
                  <Ionicons name="lock-closed-outline" size={14} color={Colors.surface} />
                  <Text style={styles.blurNoticeText}>Photo protected until connection</Text>
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

          {photoUrls.length > 1 ? (
            <View style={styles.thumbnailRail}>
              {photoUrls.map((photoUrl, index) => (
                <Pressable
                  key={`${photoUrl}-thumb-${index}`}
                  onPress={() => handleThumbnailPress(index)}
                  style={[
                    styles.thumbnailBtn,
                    index === activePhotoIndex && styles.thumbnailBtnActive,
                  ]}
                >
                  <Image
                    source={getProfileImageSource(photoUrl)}
                    style={styles.thumbnailImage}
                    blurRadius={profile.photo_blurred ? 14 : 0}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.summaryCard}>
            <View style={styles.summaryAuraOne} />
            <View style={styles.summaryAuraTwo} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>First Impression</Text>
              {relationMeta.pillLabel ? (
                <View style={[styles.statusPill, relationMeta.pillStyle]}>
                  <Text style={styles.statusPillText}>{relationMeta.pillLabel}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.summaryTitle}>{profile.name || 'Profile'}</Text>
            <Text style={styles.summaryLocation}>
              {heroLocationLine || 'Location not shared yet'}
            </Text>

            <View style={styles.statsRow}>
              {summaryStats.map((item, index) => (
                <View
                  key={item.key}
                  style={[styles.statCard, index === summaryStats.length - 1 && styles.statCardLast]}
                >
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {highlightTags.length > 0 ? (
              <View style={styles.tagWrap}>
                {highlightTags.map((tag, index) => (
                  <View key={`${tag}-${index}`} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.actionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Connection</Text>
              {isInterestStatusLoading ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : null}
            </View>

            <Text style={styles.actionHeadline}>{relationMeta.headline}</Text>
            <Text style={styles.relationHelperText}>
              {isInterestStatusLoading ? 'Checking connection status...' : relationMeta.helperText}
            </Text>

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
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>About</Text>
            </View>
            <Text style={styles.cardTitle}>A little more about {profile.name || 'them'}</Text>
            <Text style={styles.cardBody}>
              {profile.bio || 'This profile has not added a bio yet.'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Profile Snapshot</Text>
            </View>
            <Text style={styles.cardTitle}>Everything at a glance</Text>
            <View style={styles.detailGrid}>
              {details.map((row) => (
                <View key={row.key} style={styles.detailTile}>
                  <View style={styles.detailIconWrap}>
                    <Ionicons name={row.icon} size={18} color={Colors.text} />
                  </View>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={3}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={isViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closePhotoViewer}
      >
        <View style={styles.viewerBackdrop}>
          <View style={styles.viewerHeader}>
            <View style={styles.viewerCountPill}>
              <Ionicons name="images-outline" size={15} color={Colors.surface} />
              <Text style={styles.viewerCountText}>
                {activePhotoIndex + 1}/{photoUrls.length}
              </Text>
            </View>

            <Pressable style={styles.viewerCloseBtn} onPress={closePhotoViewer}>
              <Ionicons name="close" size={24} color={Colors.surface} />
            </Pressable>
          </View>

          <ScrollView
            ref={viewerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleViewerScrollEnd}
            style={styles.viewerScroll}
          >
            {photoUrls.map((photoUrl, index) => (
              <View key={`${photoUrl}-viewer-${index}`} style={styles.viewerSlide}>
                <Image
                  source={getProfileImageSource(photoUrl)}
                  style={styles.viewerImage}
                  blurRadius={profile.photo_blurred ? 24 : 0}
                />
              </View>
            ))}
          </ScrollView>

          {photoUrls.length > 1 ? (
            <View style={styles.viewerHintWrap}>
              <Text style={styles.viewerHintText}>Swipe left or right to view next photo</Text>
            </View>
          ) : null}
        </View>
      </Modal>
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
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: 6,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Shadows.chip,
  },
  headerTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.accent,
  },
  headerTitle: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif-medium',
      default: 'system',
    }),
  },
  headerBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  scrollContent: {
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom: 124,
  },
  heroWrap: {
    position: 'relative',
    width: HERO_WIDTH,
    height: 510,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    ...Shadows.card,
  },
  heroGlowMint: {
    position: 'absolute',
    width: 180,
    height: 180,
    top: 42,
    left: -40,
    borderRadius: 90,
    backgroundColor: 'rgba(173, 240, 233, 0.28)',
    zIndex: 1,
  },
  heroGlowLavender: {
    position: 'absolute',
    width: 200,
    height: 200,
    bottom: -30,
    right: -34,
    borderRadius: 100,
    backgroundColor: 'rgba(218, 204, 255, 0.34)',
    zIndex: 1,
  },
  heroSlideWrap: {
    width: HERO_WIDTH,
    height: 510,
  },
  heroSlide: {
    width: HERO_WIDTH,
    height: 510,
    resizeMode: 'cover',
  },
  heroTapArea: {
    flex: 1,
  },
  heroShadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(7, 9, 14, 0.12)',
  },
  heroShadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    backgroundColor: 'rgba(7, 9, 14, 0.42)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(11, 15, 24, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroOnlinePill: {
    backgroundColor: 'rgba(23, 120, 79, 0.72)',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  heroGlassText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 13,
  },
  heroBottom: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 22,
  },
  heroName: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.surface,
    letterSpacing: -1,
  },
  heroAge: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.surface,
    opacity: 0.95,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
  },
  heroInfoRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfoText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  blurNotice: {
    alignSelf: 'flex-start',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  blurNoticeText: {
    marginLeft: 8,
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 18,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 22,
    borderRadius: 999,
    backgroundColor: Colors.surface,
  },
  thumbnailRail: {
    marginTop: 14,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailBtn: {
    width: 64,
    height: 64,
    marginRight: 12,
    padding: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  thumbnailBtnActive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.accentSoft,
    transform: [{ scale: 1.04 }],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 11, 0.96)',
  },
  viewerHeader: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewerCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  viewerCountText: {
    marginLeft: 8,
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  viewerCloseBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  viewerScroll: {
    flex: 1,
  },
  viewerSlide: {
    width: VIEWER_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  viewerImage: {
    width: '100%',
    height: '78%',
    borderRadius: 30,
    resizeMode: 'contain',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  viewerHintWrap: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    alignItems: 'center',
  },
  viewerHintText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: 18,
    padding: 22,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Shadows.card,
  },
  summaryAuraOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    top: -34,
    right: -24,
    borderRadius: 75,
    backgroundColor: 'rgba(245, 234, 177, 0.34)',
  },
  summaryAuraTwo: {
    position: 'absolute',
    width: 140,
    height: 140,
    bottom: -30,
    left: -24,
    borderRadius: 70,
    backgroundColor: 'rgba(201, 241, 233, 0.3)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.accent,
  },
  summaryTitle: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.9,
  },
  summaryLocation: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.muted,
    fontWeight: '700',
  },
  statsRow: {
    marginTop: 18,
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    minHeight: 80,
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardLast: {
    marginRight: 0,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '900',
    color: Colors.text,
  },
  statLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tagWrap: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    marginRight: 10,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1,
    borderColor: 'rgba(202, 165, 255, 0.35)',
  },
  tagChipText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  actionCard: {
    marginTop: 18,
    padding: 22,
    borderRadius: 32,
    backgroundColor: '#0C1017',
    ...Shadows.card,
  },
  card: {
    marginTop: 18,
    padding: 22,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Shadows.card,
  },
  statusPill: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: Radii.pill,
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
    fontSize: 12,
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  primaryBtn: {
    flex: 1.1,
    height: 58,
    marginRight: 12,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
  },
  primaryBtnDisabled: {
    backgroundColor: '#6B5E80',
  },
  primaryBtnText: {
    color: Colors.surface,
    fontWeight: '900',
    fontSize: 15,
  },
  secondaryBtn: {
    flex: 1,
    height: 58,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  secondaryBtnDisabled: {
    opacity: 0.5,
  },
  secondaryBtnText: {
    color: Colors.surface,
    fontWeight: '900',
    fontSize: 14,
  },
  relationHelperText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.76)',
    lineHeight: 22,
  },
  actionHeadline: {
    marginTop: 12,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: Colors.surface,
    letterSpacing: -0.7,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.7,
  },
  cardBody: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 24,
    fontWeight: '600',
  },
  detailGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailTile: {
    width: '48%',
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    color: Colors.text,
  },
});

export default ProfileDetailScreen;
