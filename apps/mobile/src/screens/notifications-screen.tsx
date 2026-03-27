import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { PERMISSIONS, type NotificationItem } from '@aurora/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  fetchNotifications,
  fetchNotificationSummary,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';
import { EmptyState, LoadingState, Screen, SectionHeader, uiStyles } from '../components/ui';
import type { TabParamList } from '../navigation';
import { useAuthSession } from '../state/auth-session';
import { colors, radii, shadows, spacing } from '../theme/tokens';
import { formatCompactDate } from '../utils/format';

function resolveLevelColor(level: NotificationItem['level']) {
  switch (level) {
    case 'SUCCESS':
      return colors.success;
    case 'WARNING':
      return colors.warning;
    case 'ERROR':
      return colors.danger;
    default:
      return colors.brand;
  }
}

export function NotificationsScreen() {
  const auth = useAuthSession();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const canViewNotifications = auth.user?.permissions.includes(PERMISSIONS.NOTIFICATIONS_VIEW) ?? false;

  async function load() {
    if (!auth.isAuthenticated || !canViewNotifications) {
      setItems([]);
      setUnreadCount(0);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [summary, page] = await Promise.all([
        fetchNotificationSummary(),
        fetchNotifications({
          page: 1,
          pageSize: 20,
        }),
      ]);

      setUnreadCount(summary.unreadCount);
      setItems(page.items);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '通知加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!auth.loaded) {
      return;
    }

    void load();
  }, [auth.loaded, auth.isAuthenticated, canViewNotifications]);

  async function handleMarkRead(id: string) {
    setBusyId(id);
    try {
      const updated = await markNotificationRead(id);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      if (updated.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } finally {
      setBusyId('');
    }
  }

  async function handleMarkAllRead() {
    setBusyId('all');
    try {
      await markAllNotificationsRead();
      setItems((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } finally {
      setBusyId('');
    }
  }

  return (
    <Screen>
      {!auth.loaded || loading ? (
        <LoadingState label="正在同步通知中心" />
      ) : !auth.isAuthenticated ? (
        <EmptyState
          title="登录后才能看通知"
          description="移动端现在已经支持账号状态了，登录后可以查看站内提醒和系统消息。"
          actionLabel="去我的页"
          onPress={() => navigation.navigate('Profile')}
        />
      ) : !canViewNotifications ? (
        <EmptyState
          title="当前账号没有通知权限"
          description="后端通知中心依赖角色权限，当前账号尚未获得 notifications.view。"
        />
      ) : error ? (
        <EmptyState title="通知加载失败" description={error} actionLabel="重试" onPress={() => void load()} />
      ) : (
        <ScrollView contentContainerStyle={uiStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#0f172a', '#1346bf', '#1f7aff']} style={styles.hero}>
            <Text style={styles.heroEyebrow}>Notification Center</Text>
            <Text style={styles.heroTitle}>站内通知</Text>
            <Text style={styles.heroDescription}>所有审核、注册、设置变更都会在这里聚合。</Text>
            <View style={styles.heroStats}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{unreadCount}</Text>
                <Text style={styles.statLabel}>未读提醒</Text>
              </View>
              <View style={styles.statCardMuted}>
                <Text style={styles.statValueMuted}>{items.length}</Text>
                <Text style={styles.statLabelMuted}>当前列表</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={uiStyles.section}>
            <SectionHeader
              title="最近动态"
              actionLabel={items.some((item) => !item.isRead) ? (busyId === 'all' ? '处理中...' : '全部已读') : undefined}
              onPress={items.some((item) => !item.isRead) ? () => void handleMarkAllRead() : undefined}
            />

            {items.length === 0 ? (
              <EmptyState title="暂时还没有通知" description="一旦有新内容状态、评论动作或用户事件，这里会第一时间出现。" />
            ) : (
              <View style={uiStyles.verticalList}>
                {items.map((item) => {
                  const accent = resolveLevelColor(item.level);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        if (!item.isRead) {
                          void handleMarkRead(item.id);
                        }
                      }}
                      style={[styles.itemCard, !item.isRead ? styles.itemUnread : null]}
                    >
                      <View style={[styles.accent, { backgroundColor: accent }]} />
                      <View style={styles.itemBody}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemDate}>{formatCompactDate(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.itemContent}>{item.content}</Text>
                        <View style={styles.itemMeta}>
                          <View style={[styles.levelBadge, { backgroundColor: `${accent}18` }]}>
                            <Text style={[styles.levelText, { color: accent }]}>{item.level}</Text>
                          </View>
                          <Text style={styles.categoryText}>{item.category}</Text>
                          <Text style={styles.actorText}>{item.actorName || 'System'}</Text>
                        </View>
                      </View>
                      {!item.isRead ? (
                        <Text style={styles.readAction}>{busyId === item.id ? '...' : '标记已读'}</Text>
                      ) : (
                        <Text style={styles.readDone}>已读</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
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
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 23,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    gap: spacing.xs,
  },
  statCardMuted: {
    flex: 1,
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: 'rgba(15,23,42,0.22)',
    gap: spacing.xs,
  },
  statValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
  },
  statValueMuted: {
    color: '#dbeafe',
    fontSize: 26,
    fontWeight: '800',
  },
  statLabelMuted: {
    color: '#bfd7ff',
    fontSize: 13,
  },
  itemCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  itemUnread: {
    borderColor: '#cfe0ff',
    backgroundColor: '#f8fbff',
  },
  accent: {
    width: 4,
    borderRadius: 999,
  },
  itemBody: {
    flex: 1,
    gap: spacing.sm,
  },
  itemHeader: {
    gap: spacing.xs,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  itemDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  itemContent: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
  },
  categoryText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  actorText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  readAction: {
    color: colors.brandStrong,
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  readDone: {
    color: colors.textMuted,
    fontSize: 12,
    alignSelf: 'flex-start',
  },
});
