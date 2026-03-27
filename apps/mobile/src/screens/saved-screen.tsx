import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PostCard } from '../components/post-card';
import { EmptyState, LoadingState, Screen, uiStyles } from '../components/ui';
import type { RootStackParamList, TabParamList } from '../navigation';
import { useReadingList } from '../state/reading-list';
import { colors, spacing } from '../theme/tokens';

export function SavedScreen() {
  const readingList = useReadingList();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNavigation = navigation.getParent<BottomTabNavigationProp<TabParamList>>();

  return (
    <Screen>
      {!readingList.loaded ? (
        <LoadingState label="正在同步阅读清单" />
      ) : readingList.items.length === 0 ? (
        <EmptyState
          title="还没有加入阅读清单"
          description="在文章卡片或详情页里保存后，这里会自动同步。"
          actionLabel="去首页看看"
          onPress={() => tabNavigation?.navigate('Home')}
        />
      ) : (
        <ScrollView contentContainerStyle={uiStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>我的阅读清单</Text>
            <Text style={styles.description}>已保存 {readingList.items.length} 篇文章，适合碎片时间继续读。</Text>
          </View>
          <View style={uiStyles.verticalList}>
            {readingList.items.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                saved
                onToggleSave={() => readingList.toggle(post)}
                onPress={() => navigation.navigate('PostDetail', { slug: post.slug })}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  description: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
  },
});
