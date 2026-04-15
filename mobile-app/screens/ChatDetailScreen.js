import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { ConversationSkeleton } from '../components/Skeleton';
import { getChatMessages, sendChatMessage } from '../lib/api';
import { Colors, Radii, Spacing } from '../theme/theme';

const ChatDetailScreen = ({ navigation, route }) => {
  const {
    profileId,
    name = 'Chat',
    avatar,
    photoBlurred = false,
    isOnline = false,
  } = route?.params ?? {};

  const [profile, setProfile] = useState({
    name,
    image: avatar || 'https://via.placeholder.com/600x600',
    photo_blurred: photoBlurred,
    isOnline,
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const listRef = useRef(null);

  const otherAvatar = useMemo(
    () => profile.image || 'https://via.placeholder.com/600x600',
    [profile.image]
  );
  const statusText = profile.isOnline ? 'Active now' : 'Offline';
  const statusColor = profile.isOnline ? Colors.online : Colors.muted;
  const canSend = input.trim().length > 0 && !isSending;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    });
  }, []);

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
      <View style={styles.msgBlock}>
        <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
          {!isMe && (
            <Image
              source={{ uri: otherAvatar }}
              style={styles.msgAvatar}
              blurRadius={profile.photo_blurred ? 16 : 0}
            />
          )}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        </View>
        <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
          {timeLabel}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.container}
        // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Pressable hitSlop={10} style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>

          <Image
            source={{ uri: otherAvatar }}
            style={styles.headerAvatar}
            blurRadius={profile.photo_blurred ? 16 : 0}
          />

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerName} numberOfLines={1}>
              {profile.name || 'Chat'}
            </Text>
            <Text style={[styles.headerStatus, { color: statusColor }]}>{statusText}</Text>
          </View>

          <Pressable hitSlop={10} style={styles.headerIconBtn} onPress={loadConversation}>
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
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
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
        )}

        <View style={styles.composer}>
          <View style={styles.inputPill}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.muted}
              style={styles.input}
              onFocus={handleInputFocus}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
          </View>

          <Pressable
            hitSlop={10}
            style={[styles.sendBtn, canSend && styles.sendBtnActive]}
            onPress={sendMessage}
            disabled={!canSend}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Ionicons name="send" size={18} color={canSend ? Colors.text : Colors.muted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: 4,
    marginRight: 12,
    backgroundColor: Colors.chip,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerStatus: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  msgBlock: {
    marginBottom: 18,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: Colors.chip,
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radii.xl,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
  },
  bubbleMe: {
    backgroundColor: Colors.chip,
  },
  msgText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  msgTime: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.muted,
  },
  msgTimeOther: {
    marginLeft: 44,
  },
  msgTimeMe: {
    alignSelf: 'flex-end',
    marginRight: 6,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  inputPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 10, android: 6, default: 8 }),
  },
  input: {
    fontSize: 16,
    color: Colors.text,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chip,
  },
  sendBtnActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
