import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { getProfileImageSource } from '../lib/profileImage';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const BLOCKED = [
  {
    id: '1',
    name: 'Alice',
    age: 27,
    height: '5.5 cm',
    title: 'Software Engineer',
    city: 'Chennai',
    state: 'Andhra Pradesh',
    country: 'India',
    image: '',
    isOnline: false,
  },
];

const BlockedUsersScreen = () => {
  const [blocked, setBlocked] = useState(BLOCKED);

  const handleUnblock = (id) => {
    setBlocked(prev => prev.filter(user => user.id !== id));
  };

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        <Image source={getProfileImageSource(item.image)} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardMeta}>{item.age} Yrs, {item.height}</Text>
        <Text style={styles.cardMeta}>{item.title}, {item.city}</Text>
        <Text style={styles.cardMeta}>{item.state}, {item.country}</Text>
      </View>

      <Pressable style={styles.unblockBtn} onPress={() => handleUnblock(item.id)}>
        <Ionicons name="lock-open-outline" size={18} color={Colors.text} />
        <Text style={styles.unblockText}>Unblock</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}> 
        <FlatList
          data={blocked}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No blocked users</Text>
              <Text style={styles.emptySubtitle}>You have not blocked anyone.</Text>
            </View>
          }
        />
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
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'serif', default: 'serif' }),
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
  unblockBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Colors.chip,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unblockText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.muted,
  },
});

export default BlockedUsersScreen;
