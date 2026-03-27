import type { PostSummary } from '@aurora/shared';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing } from '../theme/tokens';
import { formatReadingTime, formatShortDate, trimText } from '../utils/format';

export function PostCard({
  post,
  saved,
  onPress,
  onToggleSave,
}: {
  post: PostSummary;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {post.coverImage ? <Image source={{ uri: post.coverThumbUrl || post.coverImage }} style={styles.image} /> : null}
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.category}>{post.category?.name || '未分类'}</Text>
          <Text style={styles.meta}>{formatReadingTime(post.readingTime)}</Text>
        </View>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.excerpt}>{trimText(post.excerpt || post.title, 92)}</Text>
        <View style={styles.footer}>
          <Text style={styles.meta}>{formatShortDate(post.publishedAt || post.createdAt)}</Text>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onToggleSave();
            }}
            style={[styles.bookmarkButton, saved ? styles.bookmarkButtonActive : null]}
          >
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={14} color={saved ? '#fff' : colors.brand} />
            <Text style={[styles.bookmarkLabel, saved ? styles.bookmarkLabelActive : null]}>{saved ? '已收藏' : '稍后读'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  image: {
    width: '100%',
    height: 168,
    backgroundColor: colors.surfaceMuted,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  category: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  excerpt: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c8dafd',
    backgroundColor: '#eef4ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bookmarkButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  bookmarkLabel: {
    color: colors.brandStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  bookmarkLabelActive: {
    color: '#fff',
  },
});
