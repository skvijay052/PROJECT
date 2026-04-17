import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { ConversationSkeleton } from '../components/Skeleton';
import { getChatMessages, sendChatMessage } from '../lib/api';
import { getProfileImageSource } from '../lib/profileImage';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const ChatDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    profileId,
    name = 'Chat',
    avatar,
    photoBlurred = false,
    isOnline = false,
  } = route?.params ?? {};

  const [profile, setProfile] = useState({
    name,
    image: avatar || '',
    photo_blurred: photoBlurred,
    isOnline,
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(84);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const keyboardShift = useRef(new Animated.Value(0)).current;

  const otherAvatarSource = useMemo(() => getProfileImageSource(profile.image), [profile.image]);
  const statusText = profile.isOnline ? 'Active now' : 'Offline';
  const statusColor = profile.isOnline ? Colors.online : Colors.muted;
  const canSend = input.trim().length > 0 && !isSending;
  const composerBottomGap = Platform.OS === 'ios' ? Math.max(insets.bottom, 8) + 6 : 20;
  const composerBottomPadding = 8;
  const listBottomPadding = composerHeight + composerBottomGap + keyboardHeight + 12;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    });
  }, []);

  const animateComposer = useCallback(
    (toValue, duration = 220) => {
      Animated.timing(keyboardShift, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    },
    [keyboardShift]
  );

  const loadConversation = useCallback(async () => {
    if (!profileId) {
      setLoadError('Missing chat profile.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await getChatMessages(profileId);
      const nextProfile = response?.profile || {};

      setProfile((prev) => ({
        ...prev,
        ...nextProfile,
        name: nextProfile?.name || prev.name,
        image: nextProfile?.image || prev.image,
        photo_blurred: nextProfile?.photo_blurred ?? prev.photo_blurred,
        isOnline: nextProfile?.isOnline ?? nextProfile?.is_online ?? prev.isOnline,
      }));
      setMessages(response?.items || []);
      setLoadError('');
    } catch (error) {
      setLoadError(error?.message || 'Unable to load messages right now.');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation])
  );

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [isLoading, messages.length, scrollToBottom]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event) => {
      const rawHeight = event?.endCoordinates?.height || 0;
      const nextHeight = Math.max(
        0,
        rawHeight - (Platform.OS === 'ios' ? insets.bottom : 0)
      );
      const nextDuration = event?.duration ?? 220;

      setKeyboardHeight(nextHeight);
      animateComposer(-nextHeight, nextDuration);
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    };

    const onHide = (event) => {
      const nextDuration = event?.duration ?? 180;
      setKeyboardHeight(0);
      animateComposer(0, nextDuration);
    };

    const showSubscription = Keyboard.addListener(showEvent, onShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [animateComposer, insets.bottom, scrollToBottom]);

  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 150);
  }, [scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !profileId || isSending) return;

    try {
      setIsSending(true);
      const nextMessage = await sendChatMessage(profileId, text);
      setMessages((prev) => [...prev, nextMessage]);
      setInput('');
      setLoadError('');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        scrollToBottom();
      });
    } catch (error) {
      const message = error?.message || 'Unable to send your message right now.';
      setLoadError(message);
      Alert.alert('Message failed', message);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.direction === 'sent';
    const timeLabel = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.msgBlock, isMe ? styles.msgBlockMe : styles.msgBlockOther]}>
        <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapOther]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={styles.msgText}>{item.text}</Text>

            <View style={[styles.bubbleMetaRow, isMe && styles.bubbleMetaRowMe]}>
              <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                {timeLabel}
              </Text>
              {isMe && (
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={Colors.muted}
                  style={styles.msgStatusIcon}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            hitSlop={10}
            style={[styles.headerIconBtn, styles.headerIconBtnFilled]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>

          <View style={styles.headerAvatarWrap}>
            <Image
              source={otherAvatarSource}
              style={styles.headerAvatar}
              blurRadius={profile.photo_blurred ? 16 : 0}
            />
            <View style={[styles.headerPresenceDot, { backgroundColor: statusColor }]} />
          </View>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerName} numberOfLines={1}>
              {profile.name || 'Chat'}
            </Text>
            <View style={styles.headerStatusRow}>
              <Text style={[styles.headerStatus, { color: statusColor }]}>{statusText}</Text>
              <Text style={styles.headerStatusHint}>Private chat</Text>
            </View>
          </View>

          <Pressable
            hitSlop={10}
            style={[styles.headerIconBtn, styles.headerIconBtnFilled]}
            onPress={loadConversation}
          >
            <Ionicons name="refresh-outline" size={22} color={Colors.text} />
          </Pressable>
        </View>

        {isLoading ? (
          <ConversationSkeleton />
        ) : loadError && messages.length === 0 ? (
          <View style={styles.stateWrap}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={loadConversation}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.conversationWrap}>
            <View style={styles.securityChip}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.muted} />
              <Text style={styles.securityChipText}>Messages stay private between both profiles</Text>
            </View>

            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: listBottomPadding },
                messages.length === 0 ? styles.listContentEmpty : styles.listContentFilled,
              ]}
              style={styles.messageList}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              ListEmptyComponent={
                <View style={styles.stateWrap}>
                  <Text style={styles.emptyTitle}>No messages yet</Text>
                  <Text style={styles.stateText}>
                    Start the conversation with your first message.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        <Animated.View
          style={[
            styles.composer,
            {
              bottom: composerBottomGap,
              paddingBottom: composerBottomPadding,
              transform: [{ translateY: keyboardShift }],
            },
          ]}
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            if (nextHeight && Math.abs(nextHeight - composerHeight) > 1) {
              setComposerHeight(nextHeight);
            }
          }}
        >
          <View style={styles.inputPill}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.muted}
              style={styles.input}
              onFocus={handleInputFocus}
              blurOnSubmit={false}
              autoCorrect
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
          </View>

          <Pressable
            hitSlop={10}
            style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnIdle]}
            onPress={sendMessage}
            disabled={!canSend}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={canSend ? Colors.surface : Colors.text} />
            ) : (
              <Ionicons name="send" size={18} color={canSend ? Colors.surface : Colors.muted} />
            )}
          </Pressable>
        </Animated.View>
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
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtnFilled: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    ...Shadows.chip,
  },
  headerAvatarWrap: {
    position: 'relative',
    marginLeft: 6,
    marginRight: 12,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.chip,
  },
  headerPresenceDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerName: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.text,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerStatusHint: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
  },
  conversationWrap: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  messageList: {
    flex: 1,
  },
  securityChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    marginBottom: 12,
  },
  securityChipText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  listContentFilled: {
    justifyContent: 'flex-end',
  },
  listContentEmpty: {
    justifyContent: 'center',
  },
  msgBlock: {
    marginBottom: 12,
  },
  msgBlockOther: {
    alignItems: 'flex-start',
  },
  msgBlockMe: {
    alignItems: 'flex-end',
  },
  bubbleWrap: {
    maxWidth: '82%',
  },
  bubbleWrapOther: {
    alignItems: 'flex-start',
  },
  bubbleWrapMe: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    ...Shadows.chip,
  },
  bubbleOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 10,
  },
  bubbleMe: {
    backgroundColor: 'rgba(243, 233, 255, 0.94)',
    borderColor: 'rgba(202, 165, 255, 0.38)',
    borderTopRightRadius: 10,
  },
  msgText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  bubbleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  bubbleMetaRowMe: {
    justifyContent: 'flex-end',
  },
  msgTime: {
    fontSize: 12,
    color: Colors.muted,
  },
  msgTimeOther: {
    marginLeft: 0,
  },
  msgTimeMe: {
    marginRight: 4,
  },
  msgStatusIcon: {
    marginTop: 1,
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 8, android: 8, default: 8 }),
    backgroundColor: 'rgba(247, 252, 253, 0.28)',
  },
  inputPill: {
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 28,
    paddingHorizontal: 18, 
    ...Shadows.chip,
  },
  input: {
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.chip,
  },
  sendBtnIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  sendBtnActive: {
    backgroundColor: Colors.accent,
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
});

export default ChatDetailScreen;
