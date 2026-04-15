import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getMyShortlists, removeFromShortlist } from '../lib/api';
import { RowListSkeleton } from '../components/Skeleton';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const ShortlistScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionProfileId, setActionProfileId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const showSkeleton = isLoading || isRefreshing;

  const loadShortlists = useCallback(async () => {
    try {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await getMyShortlists({ limit: 100 });
      setItems(response?.items || []);
      hasLoadedOnceRef.current = true;
      setLoadError('');
    } catch (error) {
      setLoadError(error?.message || 'Unable to load shortlist right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadShortlists();
    }, [loadShortlists])
  );

  const handleRemove = async (profileId) => {
    try {
      setActionProfileId(profileId);
      await removeFromShortlist(profileId);
      setItems((prev) => prev.filter((item) => item?.target_profile_id !== profileId));
    } catch (error) {
      setLoadError(error?.message || 'Unable to update shortlist right now.');
    } finally {
      setActionProfileId(null);
    }
  };

  const renderItem = ({ item }) => {
    const profile = item.profile || {};
    const isBusy = actionProfileId === item.target_profile_id;

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('ProfileDetail', { profile })}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: profile.image || 'https://via.placeholder.com/300x300' }}
            style={styles.avatar}
            blurRadius={profile.photo_blurred ? 18 : 0}
          />
          {(profile.isOnline ?? profile.is_online) && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{profile.name || 'Profile'}</Text>
          <Text style={styles.cardMeta}>
            {[profile.age ? `${profile.age} Yrs` : null, profile.height].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.cardMeta}>
            {[profile.title, profile.city].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.cardMeta}>
            {[profile.state, profile.country].filter(Boolean).join(', ') || '-'}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          style={styles.removeBtn}
          disabled={isBusy}
          onPress={(event) => {
            event.stopPropagation?.();
            handleRemove(item.target_profile_id);
          }}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <Ionicons name="heart" size={22} color={Colors.danger} />
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
          <Pressable hitSlop={10} style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Shortlist</Text>

          <Pressable hitSlop={10} style={styles.headerBtn} onPress={loadShortlists}>
            <Ionicons name="refresh-outline" size={22} color={Colors.text} />
          </Pressable>
        </View>

        {showSkeleton ? (
          <View style={styles.listContent}>
            <RowListSkeleton items={3} avatarSize={88} card />
          </View>
        ) : loadError && items.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={loadShortlists}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No shortlisted profiles yet</Text>
                <Text style={styles.stateText}>
                  Tap the heart on Home to save profiles here.
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
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
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
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
  removeBtn: {
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

export default ShortlistScreen;
