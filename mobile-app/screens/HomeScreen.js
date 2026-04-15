import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import {
  addToShortlist,
  getDiscoverProfiles,
  getMyShortlists,
  getReceivedInterests,
  removeFromShortlist,
} from '../lib/api';
import { HomeFeedSkeleton } from '../components/Skeleton';
import {
  countUnreadInterestNotifications,
  getReadInterestIds,
} from '../lib/interestNotifications';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const FILTERS = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'nearby', label: 'Nearby', icon: 'location-outline' },
  { key: 'online', label: 'Online', icon: 'wifi-outline' },
];

const HomeScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [shortlistedById, setShortlistedById] = useState({});
  const [shortlistCount, setShortlistCount] = useState(0);
  const [shortlistActionId, setShortlistActionId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const shortlistedIds = useMemo(
    () => Object.keys(shortlistedById).filter((id) => shortlistedById[id]),
    [shortlistedById]
  );
  const showSkeleton = isLoading || isRefreshing;
  const showError = !showSkeleton && Boolean(loadError) && profiles.length === 0;

  const loadProfiles = useCallback(async (filterKey) => {
    const shouldBlockScreen = !hasLoadedOnceRef.current;

    try {
      if (shouldBlockScreen) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await getDiscoverProfiles({
        onlyOnline: filterKey === 'online',
        limit: 30,
      });

      const items = (response?.items || []).map((profile) => ({
        ...profile,
        isOnline: profile.isOnline ?? profile.is_online ?? false,
      }));

      setProfiles(items);
      hasLoadedOnceRef.current = true;
      setLoadError('');

      const [interestResult, readIdsResult, shortlistResult] = await Promise.allSettled([
        getReceivedInterests({ limit: 50 }),
        getReadInterestIds(),
        getMyShortlists({ limit: 100 }),
      ]);

      if (shortlistResult.status === 'fulfilled') {
        const shortlistState = {};
        for (const item of shortlistResult.value?.items || []) {
          if (item?.target_profile_id) {
            shortlistState[item.target_profile_id] = true;
          }
        }

        setShortlistedById(shortlistState);
        setShortlistCount((shortlistResult.value?.items || []).length);
      }

      if (interestResult.status === 'fulfilled' && readIdsResult.status === 'fulfilled') {
        setNotificationCount(
          countUnreadInterestNotifications(
            interestResult.value?.items || [],
            readIdsResult.value || []
          )
        );
      }
    } catch (error) {
      setLoadError(error?.message || 'Unable to load profiles right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfiles(activeFilter);
    }, [activeFilter, loadProfiles])
  );

  const toggleShortlist = async (profileId) => {
    const isShortlisted = Boolean(shortlistedById[profileId]);

    try {
      setShortlistActionId(profileId);

      if (isShortlisted) {
        await removeFromShortlist(profileId);
        setShortlistedById((prev) => ({ ...prev, [profileId]: false }));
        setShortlistCount((prev) => Math.max(0, prev - 1));
        return;
      }

      await addToShortlist(profileId);
      setShortlistedById((prev) => ({ ...prev, [profileId]: true }));
      setShortlistCount((prev) => prev + 1);
    } catch (error) {
      Alert.alert('Shortlist update failed', error?.message || 'Please try again.');
    } finally {
      setShortlistActionId(null);
    }
  };

  const renderProfile = ({ item }) => {
    const isShortlisted = Boolean(shortlistedById[item.id]);
    const isUpdatingShortlist = shortlistActionId === item.id;

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('ProfileDetail', { profile: item })}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: item.image }}
            style={styles.avatar}
            blurRadius={item.photo_blurred ? 18 : 0}
          />
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardMeta}>
            {[item.age ? `${item.age} Yrs` : null, item.height].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.cardMeta}>
            {[item.title, item.city].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.cardMeta}>
            {[item.state, item.country].filter(Boolean).join(', ') || '-'}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          style={styles.likeBtn}
          disabled={isUpdatingShortlist}
          onPress={(event) => {
            event.stopPropagation?.();
            toggleShortlist(item.id);
          }}
        >
          {isUpdatingShortlist ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <Ionicons
              name={isShortlisted ? 'heart' : 'heart-outline'}
              size={22}
              color={isShortlisted ? Colors.danger : Colors.text}
            />
          )}
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>Bandhanaa</Text>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconBtn}
              hitSlop={10}
              onPress={() => navigation.navigate('Shortlist')}
            >
              <Ionicons name="heart-outline" size={24} color={Colors.text} />
              {shortlistCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {shortlistCount > 99 ? '99+' : shortlistCount}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={styles.iconBtn}
              hitSlop={10}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={Colors.text} />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Ionicons
                  name={filter.icon}
                  size={18}
                  color={Colors.text}
                  style={styles.chipIcon}
                />
                <Text style={styles.chipText}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {showSkeleton ? (
          <HomeFeedSkeleton />
        ) : showError ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadProfiles(activeFilter)}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id}
            renderItem={renderProfile}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No profiles found</Text>
                <Text style={styles.stateText}>
                  Complete more profiles in Supabase to see dynamic matches here.
                </Text>
              </View>
            }
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: Colors.text,
    fontSize: 38,
    fontWeight: '600',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'serif', default: 'serif' }),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.text,
  },
  badgeText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    backgroundColor: Colors.chip,
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: Colors.surface,
    ...Shadows.chip,
  },
  chipIcon: {
    marginRight: 8,
  },
  chipText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  avatarWrap: {
    position: 'relative',
    width: 88,
    height: 88,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  cardBody: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  likeBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: 6,
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

export default HomeScreen;
