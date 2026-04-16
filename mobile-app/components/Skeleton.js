import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

function useSkeletonOpacity() {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return opacity;
}

export function SkeletonBlock({ width = '100%', height = 16, radius = 12, style }) {
  const opacity = useSkeletonOpacity();

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

function SkeletonCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function HomeFeedSkeleton({ items = 3 }) {
  return (
    <View style={styles.section}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard key={`home-${index}`} style={styles.homeCard}>
          <SkeletonBlock width={88} height={88} radius={22} />
          <View style={styles.homeBody}>
            <SkeletonBlock width="58%" height={24} />
            <SkeletonBlock width="40%" height={14} style={styles.mt8} />
            <SkeletonBlock width="68%" height={14} style={styles.mt8} />
            <SkeletonBlock width="52%" height={14} style={styles.mt8} />
          </View>
          <SkeletonBlock width={28} height={28} radius={14} style={styles.homeIcon} />
        </SkeletonCard>
      ))}
    </View>
  );
}

export function MatchesFeedSkeleton({ items = 2 }) {
  return (
    <View style={styles.section}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard key={`match-${index}`} style={styles.matchCard}>
          <SkeletonBlock width="100%" height={260} radius={24} />
          <View style={styles.matchBody}>
            <SkeletonBlock width="52%" height={26} />
            <SkeletonBlock width="76%" height={14} style={styles.mt10} />
            <SkeletonBlock width="66%" height={14} style={styles.mt8} />
            <View style={styles.matchActions}>
              <SkeletonBlock width={58} height={58} radius={29} />
              <SkeletonBlock width="46%" height={58} radius={29} />
              <SkeletonBlock width={58} height={58} radius={29} />
            </View>
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function RowListSkeleton({ items = 5, avatarSize = 60, card = false }) {
  return (
    <View style={styles.section}>
      {Array.from({ length: items }).map((_, index) => (
        <View
          key={`row-${index}`}
          style={[styles.rowWrap, card && styles.rowCard]}
        >
          <SkeletonBlock width={avatarSize} height={avatarSize} radius={avatarSize / 2} />
          <View style={styles.rowBody}>
            <SkeletonBlock width="48%" height={18} />
            <SkeletonBlock width="72%" height={13} style={styles.mt8} />
            <SkeletonBlock width="36%" height={12} style={styles.mt8} />
          </View>
          <SkeletonBlock width={22} height={22} radius={11} />
        </View>
      ))}
    </View>
  );
}

export function ProfileScreenSkeleton() {
  return (
    <View style={styles.section}>
      <SkeletonCard>
        <View style={styles.profileTop}>
          <SkeletonBlock width={96} height={96} radius={48} />
          <View style={styles.profileStats}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={`stat-${index}`} style={styles.profileStat}>
                <SkeletonBlock width={44} height={22} />
                <SkeletonBlock width={62} height={12} style={styles.mt8} />
              </View>
            ))}
          </View>
        </View>
        <SkeletonBlock width="44%" height={28} style={styles.mt16} />
        <SkeletonBlock width="100%" height={14} style={styles.mt12} />
        <SkeletonBlock width="88%" height={14} style={styles.mt8} />
        <SkeletonBlock width="70%" height={14} style={styles.mt8} />
        <View style={styles.profileActions}>
          <SkeletonBlock width="34%" height={46} radius={14} />
          <SkeletonBlock width="26%" height={46} radius={14} />
          <SkeletonBlock width="22%" height={46} radius={14} />
          <SkeletonBlock width={46} height={46} radius={14} />
        </View>
      </SkeletonCard>

      <SkeletonCard>
        <SkeletonBlock width="30%" height={22} />
        <SkeletonBlock width="100%" height={14} style={styles.mt14} />
        <SkeletonBlock width="88%" height={14} style={styles.mt8} />
        <SkeletonBlock width="72%" height={14} style={styles.mt8} />
      </SkeletonCard>

      <SkeletonCard>
        <SkeletonBlock width="34%" height={22} />
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={`detail-${index}`} style={[styles.basicRow, index !== 0 && styles.basicBorder]}>
            <View style={styles.basicLeft}>
              <SkeletonBlock width={24} height={24} radius={12} />
              <SkeletonBlock width={90} height={16} style={styles.basicLabelBlock} />
            </View>
            <SkeletonBlock width="34%" height={16} />
          </View>
        ))}
      </SkeletonCard>
    </View>
  );
}

export function FormScreenSkeleton({ fields = 6, showPhoto = false }) {
  return (
    <View style={styles.section}>
      {Array.from({ length: fields }).map((_, index) => (
        <SkeletonBlock
          key={`field-${index}`}
          width="100%"
          height={58}
          radius={Radii.xl}
          style={index !== 0 ? styles.mt14 : null}
        />
      ))}

      {showPhoto ? (
        <SkeletonCard style={styles.mt14}>
          <SkeletonBlock width="34%" height={14} />
          <SkeletonBlock width="100%" height={220} radius={Radii.lg} style={styles.mt12} />
          <SkeletonBlock width="100%" height={48} radius={Radii.lg} style={styles.mt12} />
        </SkeletonCard>
      ) : null}

      <SkeletonBlock width="100%" height={120} radius={Radii.xl} style={styles.mt14} />
      <SkeletonBlock width="100%" height={60} radius={Radii.xl} style={styles.mt14} />
    </View>
  );
}

export function PhotoGallerySkeleton() {
  return (
    <View style={styles.section}>
      <SkeletonCard>
        <SkeletonBlock width="44%" height={20} />
        <SkeletonBlock width="100%" height={14} style={styles.mt12} />
        <SkeletonBlock width="82%" height={14} style={styles.mt8} />
        <SkeletonBlock width="100%" height={56} radius={Radii.lg} style={styles.mt14} />
      </SkeletonCard>

      {Array.from({ length: 2 }).map((_, index) => (
        <SkeletonCard key={`photo-${index}`}>
          <SkeletonBlock width="100%" height={220} radius={Radii.lg} />
          <View style={styles.photoActions}>
            <SkeletonBlock width="34%" height={18} />
            <SkeletonBlock width="20%" height={18} />
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function ConversationSkeleton() {
  return (
    <View style={styles.conversationWrap}>
      <View style={styles.messageRow}>
        <SkeletonBlock width={34} height={34} radius={17} />
        <SkeletonBlock width="56%" height={56} radius={20} style={styles.messageBubble} />
      </View>
      <View style={styles.messageRowRight}>
        <SkeletonBlock width="48%" height={52} radius={20} />
      </View>
      <View style={styles.messageRow}>
        <SkeletonBlock width={34} height={34} radius={17} />
        <SkeletonBlock width="62%" height={62} radius={20} style={styles.messageBubble} />
      </View>
      <View style={styles.messageRowRight}>
        <SkeletonBlock width="40%" height={50} radius={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  block: {
    backgroundColor: Colors.skeleton,
  },
  card: {
    backgroundColor: Colors.skeletonBgColor,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  homeCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeBody: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  homeIcon: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  matchCard: {
    overflow: 'hidden',
  },
  matchBody: {
    paddingTop: Spacing.lg,
  },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  rowBody: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: Spacing.lg,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  basicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  basicBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  basicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  basicLabelBlock: {
    marginLeft: 12,
  },
  photoActions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationWrap: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  messageRowRight: {
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  messageBubble: {
    marginLeft: 10,
  },
  mt8: {
    marginTop: 8,
  },
  mt10: {
    marginTop: 10,
  },
  mt12: {
    marginTop: 12,
  },
  mt14: {
    marginTop: 14,
  },
  mt16: {
    marginTop: 16,
  },
});
