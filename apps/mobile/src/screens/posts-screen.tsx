import type { PostSummary } from '@aurora/shared';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { fetchPosts } from '../api/public';
import { PostCard } from '../components/post-card';
import { EmptyState, LoadingState, Screen, uiStyles } from '../components/ui';
import type { RootStackParamList } from '../navigation';
import { useReadingList } from '../state/reading-list';
import { colors, spacing } from '../theme/tokens';

export function PostsScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Posts'>) {
  const [items, setItems] = useState<PostSummary[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const readingList = useReadingList();

  async function load(nextPage = 1, append = false, nextKeyword = keyword) {
    const setBusy = nextPage === 1 ? setLoading : setLoadingMore;
    setBusy(true);

    try {
      const response = await fetchPosts({
        page: nextPage,
        pageSize: 10,
        keyword: nextKeyword.trim() || undefined,
        category: route.params?.categorySlug,
        tag: route.params?.tagSlug,
      });

      setItems((current) => (append ? [...current, ...response.items] : response.items));
      setPage(response.meta.page);
      setPageCount(response.meta.pageCount);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '文章列表加载失败');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setKeyword('');
    void load(1, false, '');
  }, [route.params?.categorySlug, route.params?.tagSlug]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={uiStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
            <Text style={styles.backText}>返回</Text>
          </Pressable>
          <Text style={styles.title}>{route.params?.title || '文章列表'}</Text>
          <Text style={styles.description}>
            {route.params?.categorySlug
              ? `当前按分类 ${route.params.categorySlug} 浏览`
              : route.params?.tagSlug
                ? `当前按标签 ${route.params.tagSlug} 浏览`
                : '支持搜索标题和摘要。'}
          </Text>
        </View>

        <View style={styles.searchBar}>
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索标题或摘要"
            placeholderTextColor={colors.textMuted}
            style={uiStyles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => void load(1, false, keyword)}
          />
          <Pressable onPress={() => void load(1, false, keyword)} style={uiStyles.primaryButton}>
            <Text style={uiStyles.primaryButtonText}>搜索</Text>
          </Pressable>
        </View>

        {loading ? (
          <LoadingState label="正在加载文章列表" />
        ) : error ? (
          <EmptyState title="列表加载失败" description={error} actionLabel="重试" onPress={() => void load(1)} />
        ) : items.length === 0 ? (
          <EmptyState title="没有找到文章" description="换个关键词，或者回到首页看看精选内容。" />
        ) : (
          <>
            <View style={uiStyles.verticalList}>
              {items.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  saved={readingList.has(post.id)}
                  onToggleSave={() => readingList.toggle(post)}
                  onPress={() => navigation.navigate('PostDetail', { slug: post.slug })}
                />
              ))}
            </View>
            {page < pageCount ? (
              <Pressable onPress={() => void load(page + 1, true)} style={uiStyles.secondaryButton}>
                <Text style={uiStyles.secondaryButtonText}>{loadingMore ? '加载中...' : '加载更多'}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
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
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  description: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  searchBar: {
    gap: spacing.sm,
  },
});
