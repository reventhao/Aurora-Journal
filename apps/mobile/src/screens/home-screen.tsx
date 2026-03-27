import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchHomeData, type MobileHomePayload } from '../api/public';
import { PostCard } from '../components/post-card';
import { EmptyState, LoadingState, Pill, Screen, SectionHeader, uiStyles } from '../components/ui';
import type { RootStackParamList, TabParamList } from '../navigation';
import { useReadingHistory } from '../state/reading-history';
import { useReadingList } from '../state/reading-list';
import { colors, radii, shadows, spacing } from '../theme/tokens';
import { trimText } from '../utils/format';

export function HomeScreen() {
  const [data, setData] = useState<MobileHomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNavigation = navigation.getParent<BottomTabNavigationProp<TabParamList>>();
  const readingHistory = useReadingHistory();
  const readingList = useReadingList();

  async function load() {
    setLoading(true);
    try {
      const payload = await fetchHomeData();
      setData(payload);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '首页加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Screen>
      {loading ? (
        <LoadingState label="正在准备首页内容" />
      ) : error ? (
        <EmptyState title="首页加载失败" description={error} actionLabel="重试" onPress={() => void load()} />
      ) : data ? (
        <ScrollView contentContainerStyle={uiStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#0f172a', '#165dff', '#43a8ff']} style={styles.hero}>
            <Text style={styles.heroEyebrow}>{data.settings.siteSubtitle || 'Aurora Journal'}</Text>
            <Text style={styles.heroTitle}>{data.settings.siteName}</Text>
            <Text style={styles.heroDescription}>
              {trimText(data.settings.siteDescription || data.settings.heroDescription, 110)}
            </Text>
            <View style={styles.heroActions}>
              <Pressable onPress={() => navigation.navigate('Posts', { title: '全部文章' })} style={uiStyles.primaryButton}>
                <Text style={uiStyles.primaryButtonText}>浏览文章</Text>
              </Pressable>
              <Pressable onPress={() => tabNavigation?.navigate('Saved')} style={styles.ghostButton}>
                <Text style={styles.ghostButtonText}>查看收藏</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {readingHistory.loaded && readingHistory.items.length ? (
            <View style={uiStyles.section}>
              <SectionHeader title="继续阅读" actionLabel="清空记录" onPress={() => void readingHistory.clear()} />
              <View style={uiStyles.verticalList}>
                {readingHistory.items.slice(0, 3).map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    saved={readingList.has(post.id)}
                    onToggleSave={() => readingList.toggle(post)}
                    onPress={() => navigation.navigate('PostDetail', { slug: post.slug })}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {data.featuredPosts.length ? (
            <View style={uiStyles.section}>
              <SectionHeader title="精选内容" actionLabel="查看全部" onPress={() => navigation.navigate('Posts', { title: '精选文章' })} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {data.featuredPosts.map((post) => (
                  <View key={post.id} style={styles.horizontalCardWrap}>
                    <PostCard
                      post={post}
                      saved={readingList.has(post.id)}
                      onToggleSave={() => readingList.toggle(post)}
                      onPress={() => navigation.navigate('PostDetail', { slug: post.slug })}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={uiStyles.section}>
            <SectionHeader title="最新发布" actionLabel="文章列表" onPress={() => navigation.navigate('Posts', { title: '最新文章' })} />
            <View style={uiStyles.verticalList}>
              {data.latestPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  saved={readingList.has(post.id)}
                  onToggleSave={() => readingList.toggle(post)}
                  onPress={() => navigation.navigate('PostDetail', { slug: post.slug })}
                />
              ))}
            </View>
          </View>

          <View style={uiStyles.section}>
            <SectionHeader title="热门标签" actionLabel="去发现" onPress={() => tabNavigation?.navigate('Explore')} />
            <View style={uiStyles.pillWrap}>
              {data.tags.map((tag) => (
                <Pill
                  key={tag.id}
                  label={`${tag.name} · ${tag.postCount ?? 0}`}
                  onPress={() => navigation.navigate('Posts', { title: `# ${tag.name}`, tagSlug: tag.slug })}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.hero,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.hero,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 23,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ghostButton: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  ghostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  horizontalList: {
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  horizontalCardWrap: {
    width: 300,
  },
});
