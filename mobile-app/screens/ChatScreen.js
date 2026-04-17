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

import { getChats } from '../lib/api';
import { RowListSkeleton } from '../components/Skeleton';
import { getProfileImageSource } from '../lib/profileImage';
import { Colors, Spacing } from '../theme/theme';

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

const ChatScreen = ({ navigation }) => {
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const showSkeleton = isLoading || isRefreshing;

  const loadChats = useCallback(async () => {
    try {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await getChats({ limit: 50 });
      const items = (response?.items || []).map((thread) => ({
        ...thread,
        profile: {
          ...(thread?.profile || {}),
          image: thread?.profile?.image || '',
          isOnline: thread?.profile?.isOnline ?? thread?.profile?.is_online ?? false,
        },
        preview: thread?.last_message || 'Start your conversation',
        time: formatTimeAgo(thread?.last_message_at || thread?.matched_at),
      }));

      setThreads(items);
      hasLoadedOnceRef.current = true;
      setLoadError('');
    } catch (error) {
      setLoadError(error?.message || 'Unable to load chats right now.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const renderChat = ({ item }) => {
    const profile = item.profile || {};

    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          navigation.navigate('ChatDetail', {
            profileId: profile.id,
            name: profile.name,
            avatar: profile.image,
            photoBlurred: profile.photo_blurred,
            isOnline: profile.isOnline,
          })
        }
      >
        <View style={styles.avatarWrap}>
          <Image
            source={getProfileImageSource(profile.image)}
            style={styles.avatar}
            blurRadius={profile.photo_blurred ? 16 : 0}
          />
          {profile.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.body}>
          <View style={styles.topLine}>
            <Text style={styles.name}>{profile.name || 'Match'}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <View style={styles.bottomLine}>
            <Text style={styles.preview} numberOfLines={1}>
              {item.preview}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Pressable hitSlop={10} style={styles.headerBtn} onPress={loadChats}>
            <Ionicons name="refresh-outline" size={24} color={Colors.text} />
          </Pressable>
        </View>

        {showSkeleton ? (
          <View style={styles.listContent}>
            <RowListSkeleton items={6} avatarSize={64} />
          </View>
        ) : loadError && threads.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={loadChats}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={threads}
            renderItem={renderChat}
            keyExtractor={(item) => item.profile?.id || item.last_message_at || item.matched_at}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No chats yet</Text>
                <Text style={styles.stateText}>
                  Once you match with someone, they will appear here and you can start chatting.
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
    backgroundColor: Colors.chatPageBg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.chatPageBg,
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  separator: {
    height: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  body: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginRight: 10,
  },
  time: {
    fontSize: 13,
    color: Colors.muted,
  },
  preview: {
    flex: 1,
    fontSize: 15,
    color: Colors.muted,
    marginRight: 10,
  },
  unreadBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
  },
  unreadText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  stateCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.lg,
    alignItems: 'center',
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

export default ChatScreen;
