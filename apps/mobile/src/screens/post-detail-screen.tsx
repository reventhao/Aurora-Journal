import type { CommentSummary, PostDetail } from '@aurora/shared';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { fetchPost, fetchPostComments } from '../api/public';
import { CommentsSection } from '../components/comments-section';
import { EmptyState, LoadingState, Pill, Screen, SectionHeader, uiStyles } from '../components/ui';
import type { RootStackParamList } from '../navigation';
import { useReadingHistory } from '../state/reading-history';
import { useReadingList } from '../state/reading-list';
import { colors, radii, shadows, spacing } from '../theme/tokens';
import { formatReadingTime, formatShortDate } from '../utils/format';

const markdownRules = {
  image: (node: { key: string; attributes: { src?: string; alt?: string } }) => {
    const src = node.attributes?.src?.trim();
    if (!src) {
      return null;
    }

    return (
      <Image
        key={node.key}
        source={{ uri: src }}
        style={markdownStyles.image}
        accessible={Boolean(node.attributes?.alt)}
        accessibilityLabel={node.attributes?.alt}
      />
    );
  },
};

export function PostDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'PostDetail'>) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const readingHistory = useReadingHistory();
  const readingList = useReadingList();

  async function loadComments() {
    const rows = await fetchPostComments(route.params.slug);
    setComments(rows);
  }

  async function load() {
    setLoading(true);
    try {
      const [postDetail, commentRows] = await Promise.all([fetchPost(route.params.slug), fetchPostComments(route.params.slug)]);
      setPost(postDetail);
      setComments(commentRows);
      readingHistory.track(postDetail);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '文章详情加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [route.params.slug]);

  return (
    <Screen>
      {loading ? (
        <LoadingState label="正在加载文章详情" />
      ) : error || !post ? (
        <EmptyState title="文章打开失败" description={error || '内容不存在或尚未发布'} />
      ) : (
        <ScrollView contentContainerStyle={uiStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
              <Text style={styles.backText}>返回</Text>
            </Pressable>
          </View>

          {post.coverImage ? <Image source={{ uri: post.coverImage }} style={styles.image} /> : null}

          <LinearGradient colors={['#0f172a', '#165dff']} style={styles.hero}>
            <Text style={styles.category}>{post.category?.name || '未分类'}</Text>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.excerpt}>{post.excerpt}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{formatReadingTime(post.readingTime)}</Text>
              <Text style={styles.meta}>{post.views} 次浏览</Text>
              <Text style={styles.meta}>{formatShortDate(post.updatedAt || post.createdAt)}</Text>
            </View>
          </LinearGradient>

          <View style={styles.actionRow}>
            <Pressable onPress={() => readingList.toggle(post)} style={uiStyles.primaryButton}>
              <Text style={uiStyles.primaryButtonText}>{readingList.has(post.id) ? '移出阅读清单' : '加入阅读清单'}</Text>
            </Pressable>
            {post.category?.slug ? (
              <Pressable
                onPress={() => navigation.navigate('Posts', { title: post.category?.name, categorySlug: post.category?.slug })}
                style={uiStyles.secondaryButton}
              >
                <Text style={uiStyles.secondaryButtonText}>同分类文章</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.markdownCard}>
            <Markdown style={markdownStyles} rules={markdownRules}>
              {post.content}
            </Markdown>
          </View>

          {post.tags.length ? (
            <View style={uiStyles.section}>
              <SectionHeader title="标签" />
              <View style={uiStyles.pillWrap}>
                {post.tags.map((tag) => (
                  <Pill
                    key={tag.id}
                    label={tag.name}
                    onPress={() => navigation.navigate('Posts', { title: `# ${tag.name}`, tagSlug: tag.slug })}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <CommentsSection postId={post.id} comments={comments} onReload={loadComments} />
        </ScrollView>
      )}
    </Screen>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 28,
  },
  heading1: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 14,
  },
  heading2: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 10,
  },
  heading3: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  paragraph: {
    color: colors.text,
    marginTop: 0,
    marginBottom: 14,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.brand,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  code_inline: {
    backgroundColor: '#e5efff',
    color: colors.brandStrong,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  code_block: {
    backgroundColor: '#0f172a',
    color: '#dbeafe',
    borderRadius: 18,
    padding: 14,
  },
  fence: {
    backgroundColor: '#0f172a',
    color: '#dbeafe',
    borderRadius: 18,
    padding: 14,
  },
  image: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
    borderRadius: 18,
    marginVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
});

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 230,
    borderRadius: radii.card,
  },
  hero: {
    borderRadius: radii.card,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.hero,
  },
  category: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  excerpt: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  meta: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  markdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
});
