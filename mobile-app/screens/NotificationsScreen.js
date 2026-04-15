import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getReceivedInterests } from '../lib/api';
import { RowListSkeleton } from '../components/Skeleton';
import { getReadInterestIds, markInterestNotificationsRead } from '../lib/interestNotifications';
import { Colors, Spacing } from '../theme/theme';

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

function buildNotificationItem(interest, readIds) {
  const profile = interest?.profile || {};
  const isMatch = interest?.status === 'matched';
  const senderName = profile?.name || 'Someone';

  return {
    id: interest?.id,
    read: readIds.includes(interest?.id),
    avatar: profile?.image,
    profile,
    title: isMatch ? "It's a match!" : 'New interest',
    message: isMatch
      ? `You and ${senderName} are now matched.`
      : `${senderName} sent you an interest.`,
    time: formatTimeAgo(interest?.updated_at || interest?.created_at),
    accentIcon: isMatch ? 'heart' : 'heart-outline',
  };
}

const NotificationsScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const showSkeleton = isLoading || isRefreshing;

  const loadNotifications = useCallback(async () => {
    try {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const [response, readIds] = await Promise.all([
        getReceivedInterests({ limit: 50 }),
        getReadInterestIds(),
      ]);

      const nextItems = (response?.items || []).map((interest) =>
        buildNotificationItem(interest, readIds)
      );

      setItems(nextItems);
      hasLoadedOnceRef.current = true;
      setLoadError('');
    } catch (error) {
      setLoadError(error?.message || 'Unable to load notifications right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const allRead = useMemo(() => items.length > 0 && items.every((item) => item.read), [items]);

  const markAllRead = async () => {
    if (allRead || items.length === 0) return;

    const ids = items.map((item) => item.id).filter(Boolean);
    await markInterestNotificationsRead(ids);
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const openNotification = async (item) => {
    if (!item.read && item.id) {
      try {
        await markInterestNotificationsRead([item.id]);
        setItems((prev) =>
          prev.map((existingItem) =>
            existingItem.id === item.id ? { ...existingItem, read: true } : existingItem
          )
        );
      } catch (error) {
        // Keep navigation working even if local read state fails to persist.
      }
    }

    if (item.profile?.id) {
      navigation.navigate('ProfileDetail', { profile: item.profile });
    }
  };

  const renderAvatar = (item) => {
    if (item.avatar) {
      return (
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
          blurRadius={item.profile?.photo_blurred ? 16 : 0}
        />
      );
    }

    return (
      <View style={styles.iconAvatar}>
        <Ionicons name={item.accentIcon || 'heart-outline'} size={22} color={Colors.surface} />
      </View>
    );
  };

  const renderNotification = ({ item }) => (
    <Pressable style={styles.row} onPress={() => openNotification(item)}>
      {renderAvatar(item)}

      <View style={styles.body}>
        <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowMessage} numberOfLines={1}>
          {item.message}
        </Text>
        <Text style={styles.rowTime}>{item.time}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable hitSlop={10} style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Notifications</Text>

          <Pressable
            hitSlop={10}
            style={styles.headerRight}
            onPress={markAllRead}
            disabled={allRead || items.length === 0}
          >
            <Text
              style={[
                styles.headerAction,
                (allRead || items.length === 0) && styles.headerActionDisabled,
              ]}
            >
              Mark all read
            </Text>
          </Pressable>
        </View>

        {showSkeleton ? (
          <View style={styles.listContent}>
            <RowListSkeleton items={5} avatarSize={56} />
          </View>
        ) : loadError && items.length === 0 ? (
          <View style={styles.stateWrap}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={loadNotifications}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.stateWrap}>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.stateText}>
                  When someone sends you an interest, it will show up here.
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
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerRight: {
    width: 110,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerAction: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.danger,
  },
  headerActionDisabled: {
    color: Colors.muted,
  },
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 90,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
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
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 18,
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.chip,
  },
  iconAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A3D',
  },
  body: {
    flex: 1,
    marginLeft: 16,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  rowTitleUnread: {
    fontWeight: '900',
  },
  rowMessage: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.muted,
  },
  rowTime: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
});

export default NotificationsScreen;
