import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchCategories, fetchTags } from '../api/public';
import { EmptyState, LoadingState, Pill, Screen, SectionHeader, uiStyles } from '../components/ui';
import type { RootStackParamList } from '../navigation';
import { colors, radii, shadows, spacing } from '../theme/tokens';
import { trimText } from '../utils/format';

export function ExploreScreen() {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; description: string; postCount?: number }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string; slug: string; postCount?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  async function load() {
    setLoading(true);
    try {
      const [categoryList, tagList] = await Promise.all([fetchCategories(), fetchTags()]);
      setCategories(categoryList);
      setTags(tagList);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '发现页加载失败');
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
        <LoadingState label="正在加载分类和标签" />
      ) : error ? (
        <EmptyState title="发现页加载失败" description={error} actionLabel="重试" onPress={() => void load()} />
      ) : (
        <ScrollView contentContainerStyle={uiStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>探索内容结构</Text>
            <Text style={styles.panelDescription}>
              从分类进入主题，用标签完成横向跳转，这一层更适合移动端快速浏览。
            </Text>
          </View>

          <View style={uiStyles.section}>
            <SectionHeader title="分类入口" />
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => navigation.navigate('Posts', { title: category.name, categorySlug: category.slug })}
                style={styles.categoryCard}
              >
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <Text style={styles.categoryText}>{trimText(category.description || `${category.name} 主题文章`, 56)}</Text>
                <Text style={styles.categoryMeta}>{category.postCount ?? 0} 篇文章</Text>
              </Pressable>
            ))}
          </View>

          <View style={uiStyles.section}>
            <SectionHeader title="标签索引" />
            <View style={uiStyles.pillWrap}>
              {tags.map((tag) => (
                <Pill
                  key={tag.id}
                  active
                  label={`${tag.name} · ${tag.postCount ?? 0}`}
                  onPress={() => navigation.navigate('Posts', { title: `# ${tag.name}`, tagSlug: tag.slug })}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  panelDescription: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  categoryTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  categoryText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  categoryMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
