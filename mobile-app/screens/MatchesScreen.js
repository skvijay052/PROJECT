import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import Alert from '../lib/alert';
import {
  getMatches,
  getReceivedInterests,
  getSentInterests,
  updateInterestStatus,
} from '../lib/api';
import { MatchesFeedSkeleton } from '../components/Skeleton';
import { getProfileImageSource } from '../lib/profileImage';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const TABS = [
  { key: 'received', label: 'Received' },
  { key: 'sent', label: 'Sent' },
];

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function buildMatchedProfileIds(matchResponse) {
  return new Set(
    (matchResponse?.items || [])
      .map((match) => match?.profile?.id)
      .filter(Boolean)
  );
}

function normalizeInterestItem(interest, matchedProfileIds) {
  const profile = interest?.profile || {};
  const isMatched = profile?.id && matchedProfileIds.has(profile.id);
  const status = isMatched ? 'matched' : interest?.status || 'pending';

  return {
    id: interest?.id,
    status,
    createdAt: interest?.created_at,
    updatedAt: interest?.updated_at,
    timeAgo: formatTimeAgo(interest?.updated_at || interest?.created_at),
    likedAgo: formatTimeAgo(interest?.created_at),
    sentAgo: formatTimeAgo(interest?.updated_at || interest?.created_at),
    profile: {
      ...profile,
      image: profile?.image || '',
      isOnline: profile?.isOnline ?? profile?.is_online ?? false,
    },
  };
}

function buildStatusMeta(status) {
  if (status === 'matched') {
    return {
      label: 'Matched!',
      icon: 'checkmark-circle',
      color: Colors.online,
      pillStyle: styles.statusPillMatched,
      textStyle: styles.statusTextMatched,
    };
  }

  if (status === 'rejected') {
    return {
      label: 'Rejected',
      icon: 'close-circle',
      color: Colors.danger,
      pillStyle: styles.statusPillRejected,
      textStyle: styles.statusTextRejected,
    };
  }

  return {
    label: 'Pending',
    icon: 'time-outline',
    color: '#D58B00',
    pillStyle: styles.statusPillPending,
    textStyle: styles.statusTextPending,
  };
}

const MatchesScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedItems, setReceivedItems] = useState([]);
  const [sentItems, setSentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionInterestId, setActionInterestId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const loadData = useCallback(async () => {
    try {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const [receivedResponse, sentResponse, matchesResponse] = await Promise.all([
        getReceivedInterests({ limit: 50 }),
        getSentInterests({ limit: 50 }),
        getMatches({ limit: 50 }),
      ]);

      const matchedProfileIds = buildMatchedProfileIds(matchesResponse);

      const nextReceivedItems = (receivedResponse?.items || [])
        .map((interest) => normalizeInterestItem(interest, matchedProfileIds))
        .filter((item) => item.status !== 'rejected');

      const nextSentItems = (sentResponse?.items || [])
        .map((interest) => normalizeInterestItem(interest, matchedProfileIds))
        .filter((item) => item.status !== 'withdrawn');

      setReceivedItems(nextReceivedItems);
      setSentItems(nextSentItems);
      hasLoadedOnceRef.current = true;
      setLoadError('');
    } catch (error) {
      setLoadError(error?.message || 'Unable to load interests right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const receivedCount = receivedItems.length;
  const sentCount = sentItems.length;

  const data = useMemo(() => {
    return activeTab === 'sent' ? sentItems : receivedItems;
  }, [activeTab, receivedItems, sentItems]);
  const hasAnyItems = receivedItems.length > 0 || sentItems.length > 0;
  const showSkeleton = isLoading || isRefreshing;

  const handleInterestAction = async (interestId, nextStatus, profileName) => {
    try {
      setActionInterestId(interestId);
      const response = await updateInterestStatus(interestId, nextStatus);

      if (response?.match) {
        Alert.alert("It's a match", `You and ${profileName || 'this profile'} are now matched.`);
      }

      await loadData();
    } catch (error) {
      Alert.alert('Action failed', error?.message || 'Please try again.');
    } finally {
      setActionInterestId(null);
    }
  };

  const openProfile = (item) => {
    if (!item?.profile?.id) return;
    navigation.navigate('ProfileDetail', { profile: item.profile });
  };

  const renderReceivedCard = ({ item }) => {
    const profile = item.profile;
    const isPending = item.status === 'pending';
    const isMatched = item.status === 'matched';
    const isBusy = actionInterestId === item.id;

    return (
      <View style={styles.card}>
        <ImageBackground
          source={getProfileImageSource(profile.image)}
          style={styles.hero}
          imageStyle={styles.heroImage}
          blurRadius={profile.photo_blurred ? 22 : 0}
        >
          <View style={styles.heroOverlay} />

          {profile.isOnline && (
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          )}

          <View style={styles.heroBottom}>
            <Text style={styles.heroName} numberOfLines={1}>
              {profile.name || 'Profile'}
              {profile.age ? <Text style={styles.heroAge}>, {profile.age}</Text> : null}
            </Text>

            {profile.title ? (
              <View style={styles.heroInfoRow}>
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={Colors.surface}
                  style={styles.heroInfoIcon}
                />
                <Text style={styles.heroInfoText}>{profile.title}</Text>
              </View>
            ) : null}

            {(profile.city || profile.state || profile.country) ? (
              <View style={styles.heroInfoRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={Colors.surface}
                  style={styles.heroInfoIcon}
                />
                <Text style={styles.heroInfoText}>
                  {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
        </ImageBackground>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            {profile.height ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="resize-outline"
                  size={18}
                  color={Colors.muted}
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText}>{profile.height}</Text>
              </View>
            ) : null}

            <View style={styles.metaItem}>
              <Ionicons
                name={isMatched ? 'checkmark-circle-outline' : 'time-outline'}
                size={18}
                color={Colors.muted}
                style={styles.metaIcon}
              />
              <Text style={styles.metaText}>
                {isMatched ? `Matched ${item.timeAgo}` : `Interest ${item.likedAgo}`}
              </Text>
            </View>
          </View>

          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio || 'Open the profile to see more details.'}
          </Text>

          <View style={styles.actionsRow}>
            <Pressable
              hitSlop={10}
              style={[styles.circleBtn, !isPending && styles.circleBtnDisabled]}
              disabled={!isPending || isBusy}
              onPress={() => handleInterestAction(item.id, 'rejected', profile.name)}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Ionicons name="close" size={22} color={Colors.text} />
              )}
            </Pressable>

            <Pressable style={styles.viewBtn} onPress={() => openProfile(item)}>
              <Ionicons
                name="person-outline"
                size={18}
                color={Colors.text}
                style={styles.viewIcon}
              />
              <Text style={styles.viewText}>View Full Profile</Text>
            </Pressable>

            <Pressable
              hitSlop={10}
              style={[
                styles.circleBtn,
                isMatched && styles.circleBtnMatched,
                !isPending && !isMatched && styles.circleBtnDisabled,
              ]}
              disabled={(!isPending && !isMatched) || isBusy}
              onPress={() => {
                if (isPending) {
                  handleInterestAction(item.id, 'accepted', profile.name);
                }
              }}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Ionicons
                  name={isMatched ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isMatched ? Colors.online : Colors.text}
                />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderSentRow = ({ item }) => {
    const profile = item.profile;
    const statusMeta = buildStatusMeta(item.status);

    return (
      <Pressable style={styles.sentCard} onPress={() => openProfile(item)}>
        <Image
          source={getProfileImageSource(profile.image)}
          style={styles.sentAvatar}
          blurRadius={profile.photo_blurred ? 18 : 0}
        />

        <View style={styles.sentBody}>
          <View style={styles.sentTopRow}>
            <Text style={styles.sentName} numberOfLines={1}>
              {profile.name || 'Profile'}
            </Text>
            <View style={[styles.statusPill, statusMeta.pillStyle]}>
              <Ionicons
                name={statusMeta.icon}
                size={14}
                color={statusMeta.color}
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, statusMeta.textStyle]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <Text style={styles.sentMeta}>
            {[profile.age ? `${profile.age} Yrs` : null, profile.height].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.sentMeta}>
            {[profile.title, profile.city].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.sentMeta}>
            {[profile.state, profile.country].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.sentSub}>
            {item.status === 'matched' ? `Matched ${item.sentAgo}` : `Sent ${item.sentAgo}`}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.stateCard}>
      <Text style={styles.emptyTitle}>
        {activeTab === 'received' ? 'No received interests yet' : 'No sent interests yet'}
      </Text>
      <Text style={styles.stateText}>
        {activeTab === 'received'
          ? 'When someone sends you an interest, it will show up here.'
          : 'Profiles you send interest to will appear here.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Likes & Interests</Text>
          <Pressable hitSlop={10} style={styles.headerBtn} onPress={loadData}>
            <Ionicons name="refresh-outline" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.tabsWrap}>
          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const count = tab.key === 'received' ? receivedCount : sentCount;
              return (
                <Pressable
                  key={tab.key}
                  style={styles.tabBtn}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}
                  >
                    {tab.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.tabIndicator,
              activeTab === 'sent' ? styles.tabIndicatorRight : styles.tabIndicatorLeft,
            ]}
          />
        </View>

        {showSkeleton ? (
          <View style={styles.listContent}>
            <MatchesFeedSkeleton />
          </View>
        ) : loadError && !hasAnyItems ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={data}
            renderItem={activeTab === 'sent' ? renderSentRow : renderReceivedCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        )}
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
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
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
  tabsWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 18,
    fontWeight: '800',
  },
  tabTextActive: {
    color: Colors.text,
  },
  tabTextInactive: {
    color: Colors.muted,
    fontWeight: '700',
  },
  tabIndicator: {
    height: 3,
    width: '50%',
    backgroundColor: Colors.text,
    borderRadius: 3,
  },
  tabIndicatorLeft: {
    alignSelf: 'flex-start',
  },
  tabIndicatorRight: {
    alignSelf: 'flex-end',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 90,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    ...Shadows.card,
    marginBottom: Spacing.xl,
  },
  hero: {
    height: 360,
    justifyContent: 'flex-end',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  onlinePill: {
    position: 'absolute',
    top: 16,
    right: 16,
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
    fontWeight: '900',
    fontSize: 14,
  },
  heroBottom: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroName: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.surface,
  },
  heroAge: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.surface,
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
  cardBody: {
    padding: Spacing.lg,
  },
  metaRow: {
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaIcon: {
    marginRight: 10,
  },
  metaText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.muted,
  },
  bio: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.muted,
    lineHeight: 22,
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnDisabled: {
    opacity: 0.45,
  },
  circleBtnMatched: {
    borderColor: '#BDEACB',
    backgroundColor: '#E7F6EE',
  },
  viewBtn: {
    flex: 1,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 14,
  },
  viewIcon: {
    marginRight: 10,
  },
  viewText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  sentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radii.xl,
    backgroundColor: Colors.surface,
    ...Shadows.card,
    marginBottom: 18,
  },
  sentAvatar: {
    width: 84,
    height: 84,
    borderRadius: 18,
    marginRight: 16,
    backgroundColor: Colors.chip,
  },
  sentBody: {
    flex: 1,
  },
  sentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sentName: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginRight: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusPillPending: {
    backgroundColor: '#FFF3DA',
  },
  statusPillMatched: {
    backgroundColor: '#E7F6EE',
  },
  statusPillRejected: {
    backgroundColor: '#FDEBEC',
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '900',
  },
  statusTextPending: {
    color: '#D58B00',
  },
  statusTextMatched: {
    color: Colors.online,
  },
  statusTextRejected: {
    color: Colors.danger,
  },
  sentMeta: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  sentSub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.muted,
  },
  stateCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
    fontWeight: '700',
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

export default MatchesScreen;
