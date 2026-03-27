<template>
  <a-layout class="admin-shell">
    <a-layout-sider
      class="admin-sider"
      :width="248"
    >
      <div class="admin-brand">
        <div class="admin-brand__mark">A</div>
        <div class="admin-brand__copy">
          <strong>Aurora Admin</strong>
          <span>后台管理</span>
        </div>
      </div>

      <div class="admin-menu-sections">
        <section
          v-for="(section, index) in menuSections"
          :key="section.id"
          class="admin-menu-section"
        >
          <div v-if="index > 0" class="admin-menu-divider" />
          <div class="admin-menu-section__title">{{ section.label }}</div>

          <a-menu
            class="admin-menu"
            :selected-keys="[selectedMenuKey]"
            @menu-item-click="handleMenuClick"
          >
            <a-menu-item
              v-for="item in section.items"
              :key="item.key"
            >
              <template #icon>
                <span class="admin-menu-item__icon" :style="{ '--menu-icon-color': menuItemIconColor(item.key) }">
                  <component :is="item.icon" class="admin-menu-item__glyph" />
                </span>
              </template>
              <span class="admin-menu-item__label">{{ item.label }}</span>
            </a-menu-item>
          </a-menu>
        </section>
      </div>
    </a-layout-sider>

    <a-layout>
      <div class="admin-topbar">
        <a-layout-header class="admin-header">
          <div class="header-copy">
            <strong>{{ currentPageTitle }}</strong>
          </div>

          <div class="header-actions">
            <a-badge :count="notificationSummary.unreadCount" :max-count="99" class="notification-badge">
              <a-button
                v-if="authStore.hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)"
                class="icon-action-button"
                type="outline"
                shape="circle"
                @click="openNotifications"
              >
                <template #icon>
                  <icon-notification />
                </template>
              </a-button>
            </a-badge>

            <a-tooltip :content="themeStore.isDark ? '切换浅色模式' : '切换深色模式'">
              <a-button class="icon-action-button" type="outline" shape="circle" @click="themeStore.toggleTheme()">
                <template #icon>
                  <icon-sun-fill v-if="themeStore.isDark" />
                  <icon-moon-fill v-else />
                </template>
              </a-button>
            </a-tooltip>

            <a-trigger
              trigger="click"
              position="br"
              :popup-visible="profileMenuVisible"
              popup-class-name="profile-popup"
              @popup-visible-change="handleProfilePopupVisibleChange"
            >
              <button type="button" class="profile-trigger">
                <a-avatar class="profile-avatar" :image-url="profileAvatar">
                  {{ authStore.user?.name?.slice(0, 1) || 'A' }}
                </a-avatar>
                <div class="profile-meta">
                  <strong>{{ authStore.user?.name || 'Aurora Admin' }}</strong>
                  <span>{{ authStore.user?.email || 'admin@aurora.local' }}</span>
                </div>
                <icon-down class="profile-arrow" />
              </button>

              <template #content>
                <div class="profile-menu">
                  <div class="profile-menu__summary">
                    <a-avatar :size="44" :image-url="profileAvatar">
                      {{ authStore.user?.name?.slice(0, 1) || 'A' }}
                    </a-avatar>
                    <div class="profile-menu__copy">
                      <strong>{{ authStore.user?.name || 'Aurora Admin' }}</strong>
                      <span>{{ authStore.user?.email || 'admin@aurora.local' }}</span>
                    </div>
                  </div>

                  <div v-if="visibleRoles.length" class="profile-role-list">
                    <a-tag v-for="role in visibleRoles" :key="role.id" size="small" color="arcoblue">
                      {{ role.name }}
                    </a-tag>
                    <a-tag v-if="extraRoleCount" size="small" bordered>+{{ extraRoleCount }}</a-tag>
                  </div>

                  <div class="profile-menu__actions">
                    <button type="button" class="profile-menu-action" @click="goProfile">
                      <icon-user />
                      <span>个人设置</span>
                    </button>

                    <button
                      v-if="authStore.hasPermission(PERMISSIONS.SETTINGS_VIEW)"
                      type="button"
                      class="profile-menu-action"
                      @click="goSettings"
                    >
                      <icon-settings />
                      <span>站点设置</span>
                    </button>

                    <button type="button" class="profile-menu-action profile-menu-action--danger" @click="logout">
                      <icon-export />
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              </template>
            </a-trigger>
          </div>
        </a-layout-header>

        <div v-if="quickTabs.length" class="admin-quick-switch-wrap">
          <div class="admin-quick-switch">
            <div class="admin-quick-switch__list" role="tablist" aria-label="快捷切换">
              <div
                v-for="tab in displayedQuickTabs"
                :key="tab.key"
                class="admin-quick-tab"
                :class="{ 'admin-quick-tab--active': tab.path === activeQuickTabPath }"
                @contextmenu.prevent="openQuickTabMenu($event, tab)"
                @click="activateQuickTab(tab.path)"
              >
                <div class="admin-quick-tab__main">
                  <span class="admin-quick-tab__icon" :style="{ '--quick-tab-icon-color': quickTabIconColor(tab) }">
                    <component :is="tab.icon" />
                  </span>
                  <span class="admin-quick-tab__text">{{ tab.label }}</span>
                </div>

                <button
                  v-if="tab.closable"
                  type="button"
                  class="admin-quick-tab__close"
                  :aria-label="`关闭${tab.label}`"
                  @click.stop="closeQuickTab(tab.key)"
                >
                  <icon-close />
                </button>
              </div>
            </div>
          </div>
        </div>

        <Teleport to="body">
          <div
            v-if="quickTabContextMenu.visible"
            ref="quickTabContextMenuRef"
            class="admin-quick-tab-menu"
            :style="{
              left: `${quickTabContextMenu.x}px`,
              top: `${quickTabContextMenu.y}px`,
            }"
            @click.stop
            @contextmenu.prevent
          >
            <button
              type="button"
              class="admin-quick-tab-menu__item"
              :disabled="quickTabContextActions.closeOthersDisabled"
              @click="handleQuickTabContextAction('others')"
            >
              关闭其他
            </button>
            <button
              type="button"
              class="admin-quick-tab-menu__item"
              :disabled="quickTabContextActions.closeLeftDisabled"
              @click="handleQuickTabContextAction('left')"
            >
              关闭左侧
            </button>
            <button
              type="button"
              class="admin-quick-tab-menu__item"
              :disabled="quickTabContextActions.closeRightDisabled"
              @click="handleQuickTabContextAction('right')"
            >
              关闭右侧
            </button>
          </div>
        </Teleport>
      </div>

      <a-layout-content class="admin-content">
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="keepAliveInclude" :max="12">
            <Suspense>
              <component
                :is="resolveCachedRouteView(Component, route.fullPath)"
                v-if="Component"
                :key="route.fullPath"
              />
              <template #fallback>
                <RouteLoadingView :mode="(route.meta?.loadingHint as 'page' | 'editor') || 'page'" />
              </template>
            </Suspense>
          </KeepAlive>
        </RouterView>
      </a-layout-content>
    </a-layout>
  </a-layout>

  <a-drawer
    v-model:visible="notificationsVisible"
    title="通知中心"
    width="420px"
    :footer="false"
    unmount-on-close
  >
    <div class="notification-toolbar">
      <a-tag color="arcoblue" bordered>未读 {{ notificationSummary.unreadCount }}</a-tag>
      <a-button size="mini" :disabled="!notificationSummary.unreadCount" @click="markAllNotificationsRead">
        全部标记已读
      </a-button>
    </div>

    <a-empty v-if="!notificationSummary.latest.length" description="暂无通知" />

    <div v-else class="notification-list">
      <button
        v-for="item in notificationSummary.latest"
        :key="item.id"
        type="button"
        class="notification-item"
        :class="{ 'notification-item--unread': !item.isRead }"
        @click="handleNotificationClick(item)"
      >
        <div class="notification-item__head">
          <strong>{{ item.title }}</strong>
          <a-tag size="small" :color="notificationTagColorMap[item.level]">
            {{ notificationLevelTextMap[item.level] }}
          </a-tag>
        </div>
        <p>{{ item.content }}</p>
        <div class="notification-item__meta">
          <span>{{ item.category }}</span>
          <span>{{ formatDate(item.createdAt) }}</span>
        </div>
      </button>
    </div>
  </a-drawer>

  <AdminAssistantPet />
</template>

<script setup lang="ts">
import { buildDefaultUserAvatar, PERMISSIONS, type NotificationCenterSummary, type NotificationItem } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import {
  IconApps,
  IconArchive,
  IconCalendarClock,
  IconClose,
  IconDashboard,
  IconDown,
  IconEdit,
  IconExport,
  IconFolder,
  IconHistory,
  IconMenu,
  IconMoonFill,
  IconNotification,
  IconSafe,
  IconSettings,
  IconSunFill,
  IconTags,
  IconUser,
  IconUserGroup,
  IconMessage,
  IconStorage,
} from '@arco-design/web-vue/es/icon';
import {
  KeepAlive,
  Suspense,
  computed,
  defineComponent,
  h,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Component,
} from 'vue';
import { useRoute, useRouter, type RouteLocationNormalizedLoaded } from 'vue-router';

import AdminAssistantPet from '../components/assistant/AdminAssistantPet.vue';
import { notificationsApi } from '../api/modules';
import RouteLoadingView from '../components/system/RouteLoadingView.vue';
import { useAuthStore } from '../stores/auth';
import { useThemeStore } from '../stores/theme';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const notificationsVisible = ref(false);
const profileMenuVisible = ref(false);
const notificationSummary = ref<NotificationCenterSummary>({
  unreadCount: 0,
  latest: [],
});

const notificationLevelTextMap: Record<NotificationItem['level'], string> = {
  INFO: '通知',
  SUCCESS: '完成',
  WARNING: '提醒',
  ERROR: '异常',
};

const notificationTagColorMap: Record<NotificationItem['level'], string> = {
  INFO: 'arcoblue',
  SUCCESS: 'green',
  WARNING: 'orange',
  ERROR: 'red',
};

type MenuItem = {
  key: string;
  label: string;
  permission: string;
  icon: Component;
};

type MenuSection = {
  id: string;
  label: string;
  items: MenuItem[];
};

type QuickTab = {
  key: string;
  path: string;
  label: string;
  closable: boolean;
  menuKey: string;
};

type QuickTabView = QuickTab & {
  icon: Component;
};

type QuickTabContextAction = 'others' | 'left' | 'right';

type QuickTabContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  key: string;
};

const QUICK_TAB_STORAGE_KEY = 'aurora_admin_quick_tabs';
const QUICK_TAB_CONTEXT_MENU_PADDING = 12;
const QUICK_TAB_CONTEXT_MENU_OFFSET_X = 14;
const QUICK_TAB_CONTEXT_MENU_OFFSET_Y = 8;

const menuSections = computed<MenuSection[]>(() => {
  const overviewItems: MenuItem[] = authStore.hasPermission(PERMISSIONS.DASHBOARD_VIEW)
    ? [{ key: '/dashboard', label: '仪表盘', permission: PERMISSIONS.DASHBOARD_VIEW, icon: IconDashboard }]
    : [];

  const contentItems: MenuItem[] = [
    { key: '/posts', label: '文章管理', permission: PERMISSIONS.POSTS_VIEW, icon: IconEdit },
    { key: '/categories', label: '分类管理', permission: PERMISSIONS.CATEGORIES_VIEW, icon: IconFolder },
    { key: '/tags', label: '标签管理', permission: PERMISSIONS.TAGS_VIEW, icon: IconTags },
    { key: '/comments', label: '评论管理', permission: PERMISSIONS.COMMENTS_VIEW, icon: IconMessage },
    { key: '/media', label: '媒体库', permission: PERMISSIONS.MEDIA_VIEW, icon: IconStorage },
    { key: '/recycle-bin', label: '内容回收站', permission: PERMISSIONS.RECYCLE_BIN_VIEW, icon: IconArchive },
  ].filter((item) => authStore.hasPermission(item.permission));

  const systemItems: MenuItem[] = [
    { key: '/users', label: '用户管理', permission: PERMISSIONS.USERS_VIEW, icon: IconUserGroup },
    { key: '/roles', label: '角色权限', permission: PERMISSIONS.ROLES_VIEW, icon: IconSafe },
    { key: '/settings', label: '站点设置', permission: PERMISSIONS.SETTINGS_VIEW, icon: IconSettings },
    { key: '/settings/navigation', label: '博客菜单', permission: PERMISSIONS.SETTINGS_VIEW, icon: IconMenu },
    { key: '/settings/versions', label: '配置版本', permission: PERMISSIONS.SETTINGS_VERSIONS_VIEW, icon: IconHistory },
    { key: '/operation-logs', label: '操作日志', permission: PERMISSIONS.SETTINGS_VIEW, icon: IconCalendarClock },
  ].filter((item) => authStore.hasPermission(item.permission));

  return [
    { id: 'overview', label: '概览', items: overviewItems },
    { id: 'content', label: '内容', items: contentItems },
    { id: 'system', label: '系统', items: systemItems },
  ].filter((section) => section.items.length);
});

const currentPageTitle = computed(() => (route.meta?.title as string) || '后台管理');
const selectedMenuKey = computed(() => (route.meta?.menuKey as string) || route.path);
const profileAvatar = computed(() =>
  authStore.user?.avatar ||
  buildDefaultUserAvatar(authStore.user?.name || 'Aurora Admin', authStore.user?.email || 'admin@aurora.local'),
);
const visibleRoles = computed(() => (authStore.user?.roles || []).slice(0, 2));
const extraRoleCount = computed(() => Math.max((authStore.user?.roles || []).length - visibleRoles.value.length, 0));
const flatMenuItems = computed(() => menuSections.value.flatMap((section) => section.items));
const pinnedQuickTab = computed<QuickTab | null>(() => {
  if (authStore.hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
    return { key: '/dashboard', path: '/dashboard', label: '仪表盘', closable: false, menuKey: '/dashboard' };
  }

  const firstMenuItem = flatMenuItems.value[0];
  return firstMenuItem
    ? { key: firstMenuItem.key, path: firstMenuItem.key, label: firstMenuItem.label, closable: false, menuKey: firstMenuItem.key }
    : null;
});
const quickTabs = ref<QuickTab[]>([]);
const activeQuickTabPath = computed(() => route.fullPath);
const cachedRouteViewMap = new Map<string, Component>();
const keepAliveInclude = computed(() => quickTabs.value.map((tab) => buildRouteCacheName(tab.path)));
const quickTabIconMap = computed(() => {
  const entries: Array<[string, Component]> = [
    ['/dashboard', IconDashboard],
    ['/profile', IconUser],
  ];

  for (const item of flatMenuItems.value) {
    entries.push([item.key, item.icon]);
  }

  return new Map(entries);
});
const displayedQuickTabs = computed<QuickTabView[]>(() =>
  quickTabs.value.map((tab) => ({
    ...tab,
    icon: quickTabIconMap.value.get(tab.menuKey) || quickTabIconMap.value.get(tab.path) || IconApps,
  })),
);
const quickTabContextMenu = ref<QuickTabContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  key: '',
});
const quickTabContextMenuRef = ref<HTMLElement | null>(null);
const quickTabContextTarget = computed(() => quickTabs.value.find((tab) => tab.key === quickTabContextMenu.value.key) || null);
const quickTabContextActions = computed(() => {
  const target = quickTabContextTarget.value;
  if (!target) {
    return {
      closeOthersDisabled: true,
      closeLeftDisabled: true,
      closeRightDisabled: true,
    };
  }

  const targetIndex = quickTabs.value.findIndex((tab) => tab.key === target.key);
  const closeOthersDisabled = quickTabs.value.every((tab) => !tab.closable || tab.key === target.key);
  const closeLeftDisabled = quickTabs.value.slice(0, targetIndex).every((tab) => !tab.closable);
  const closeRightDisabled = quickTabs.value.slice(targetIndex + 1).every((tab) => !tab.closable);

  return {
    closeOthersDisabled,
    closeLeftDisabled,
    closeRightDisabled,
  };
});

function menuItemIconColor(key: string) {
  const colorMap: Record<string, string> = {
    '/dashboard': '#3b82f6',
    '/posts': '#8b5cf6',
    '/categories': '#14b8a6',
    '/tags': '#d946ef',
    '/comments': '#0ea5e9',
    '/media': '#f97316',
    '/recycle-bin': '#ef4444',
    '/users': '#06b6d4',
    '/roles': '#22c55e',
    '/settings': '#38bdf8',
    '/settings/navigation': '#0ea5e9',
    '/settings/versions': '#a855f7',
    '/operation-logs': '#f59e0b',
    '/profile': '#06b6d4',
  };

  return colorMap[key] || '#3b82f6';
}

function quickTabIconColor(tab: Pick<QuickTab, 'menuKey' | 'path'>) {
  return menuItemIconColor(tab.menuKey || tab.path);
}

function buildRouteCacheName(path: string) {
  return `admin-tab:${path}`;
}

function resolveCachedRouteView(component: Component, path: string) {
  const existingView = cachedRouteViewMap.get(path);
  if (existingView) {
    return existingView;
  }

  const wrappedView = markRaw(
    defineComponent({
      name: buildRouteCacheName(path),
      setup() {
        return () => h(component);
      },
    }),
  );

  cachedRouteViewMap.set(path, wrappedView);
  return wrappedView;
}

function destroyCachedRouteView(path: string) {
  cachedRouteViewMap.delete(path);
}

function sanitizeQuickTabs(tabs: QuickTab[]) {
  const pinnedTab = pinnedQuickTab.value;
  const nextTabs: QuickTab[] = [];
  const seenKeys = new Set<string>();

  if (pinnedTab) {
    nextTabs.push(pinnedTab);
    seenKeys.add(pinnedTab.key);
  }

  for (const tab of tabs) {
    if (!tab?.key || !tab?.path || !tab?.label) {
      continue;
    }

    if (pinnedTab && (tab.key === pinnedTab.key || tab.path === pinnedTab.path)) {
      continue;
    }

    if (seenKeys.has(tab.key)) {
      continue;
    }

    nextTabs.push({
      key: tab.key,
      path: tab.path,
      label: tab.label,
      closable: true,
      menuKey: tab.menuKey,
    });
    seenKeys.add(tab.key);
  }

  return nextTabs;
}

function persistQuickTabs() {
  try {
    sessionStorage.setItem(QUICK_TAB_STORAGE_KEY, JSON.stringify(quickTabs.value));
  } catch {
    // Ignore storage failures and keep runtime state only.
  }
}

function restoreQuickTabs() {
  try {
    const rawValue = sessionStorage.getItem(QUICK_TAB_STORAGE_KEY);
    if (!rawValue) {
      quickTabs.value = sanitizeQuickTabs([]);
      return;
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      quickTabs.value = sanitizeQuickTabs([]);
      return;
    }

    quickTabs.value = sanitizeQuickTabs(
      parsed.map((tab) => ({
        key: String(tab?.key || ''),
        path: String(tab?.path || ''),
        label: String(tab?.label || ''),
        closable: Boolean(tab?.closable),
        menuKey: String(tab?.menuKey || tab?.path || ''),
      })),
    );
  } catch {
    quickTabs.value = sanitizeQuickTabs([]);
  }
}

function buildQuickTabFromRoute(targetRoute: RouteLocationNormalizedLoaded) {
  if (targetRoute.path === '/login' || targetRoute.path === '/403') {
    return null;
  }

  const title = ((targetRoute.meta?.title as string | undefined) || '').trim();
  if (!title) {
    return null;
  }

  const menuKey = ((targetRoute.meta?.menuKey as string | undefined) || targetRoute.path).trim();

  const pinnedTab = pinnedQuickTab.value;
  if (pinnedTab && targetRoute.path === pinnedTab.path) {
    return pinnedTab;
  }

  return {
    key: targetRoute.fullPath,
    path: targetRoute.fullPath,
    label: title,
    closable: true,
    menuKey,
  } satisfies QuickTab;
}

function syncQuickTabsWithRoute(targetRoute: RouteLocationNormalizedLoaded = route) {
  const nextTabs = sanitizeQuickTabs(quickTabs.value);
  const currentTab = buildQuickTabFromRoute(targetRoute);

  if (currentTab) {
    const existingIndex = nextTabs.findIndex((tab) => tab.key === currentTab.key);
    if (existingIndex >= 0) {
      nextTabs[existingIndex] = currentTab;
    } else {
      nextTabs.push(currentTab);
    }
  }

  quickTabs.value = sanitizeQuickTabs(nextTabs);
  persistQuickTabs();
}

function activateQuickTab(path: string) {
  if (path !== route.fullPath) {
    void router.push(path);
  }
}

function closeQuickTabContextMenu() {
  quickTabContextMenu.value = {
    visible: false,
    x: 0,
    y: 0,
    key: '',
  };
}

function positionQuickTabContextMenu(clientX: number, clientY: number) {
  const menuElement = quickTabContextMenuRef.value;
  const menuWidth = menuElement?.offsetWidth ?? 148;
  const menuHeight = menuElement?.offsetHeight ?? 132;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : clientX + menuWidth;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : clientY + menuHeight;
  const preferredX = clientX + QUICK_TAB_CONTEXT_MENU_OFFSET_X;
  const preferredY = clientY + QUICK_TAB_CONTEXT_MENU_OFFSET_Y;
  const fallbackLeftX = clientX - menuWidth - QUICK_TAB_CONTEXT_MENU_PADDING;
  const resolvedX =
    preferredX + menuWidth + QUICK_TAB_CONTEXT_MENU_PADDING <= viewportWidth ? preferredX : fallbackLeftX;
  const resolvedY =
    preferredY + menuHeight + QUICK_TAB_CONTEXT_MENU_PADDING <= viewportHeight
      ? preferredY
      : viewportHeight - menuHeight - QUICK_TAB_CONTEXT_MENU_PADDING;

  quickTabContextMenu.value = {
    ...quickTabContextMenu.value,
    x: Math.max(QUICK_TAB_CONTEXT_MENU_PADDING, resolvedX),
    y: Math.max(QUICK_TAB_CONTEXT_MENU_PADDING, resolvedY),
  };
}

async function openQuickTabMenu(event: MouseEvent, tab: QuickTabView) {
  quickTabContextMenu.value = {
    visible: true,
    x: event.clientX + QUICK_TAB_CONTEXT_MENU_OFFSET_X,
    y: event.clientY + QUICK_TAB_CONTEXT_MENU_OFFSET_Y,
    key: tab.key,
  };

  await nextTick();
  positionQuickTabContextMenu(event.clientX, event.clientY);
}

async function closeQuickTabsByMatcher(
  matcher: (tab: QuickTab, index: number, tabs: QuickTab[]) => boolean,
  fallbackPath?: string,
) {
  const currentTabs = quickTabs.value;
  const closingTabs = currentTabs.filter((tab, index, tabs) => tab.closable && matcher(tab, index, tabs));

  if (!closingTabs.length) {
    return;
  }

  const closingPaths = new Set(closingTabs.map((tab) => tab.path));
  const nextTabs = sanitizeQuickTabs(currentTabs.filter((tab) => !closingPaths.has(tab.path)));

  if (closingPaths.has(route.fullPath)) {
    const fallbackTab =
      nextTabs.find((tab) => tab.path === fallbackPath) ||
      pinnedQuickTab.value ||
      nextTabs[0];

    if (fallbackTab && fallbackTab.path !== route.fullPath) {
      await router.push(fallbackTab.path);
    }
  }

  quickTabs.value = nextTabs;
  closingTabs.forEach((tab) => destroyCachedRouteView(tab.path));
  persistQuickTabs();
}

async function closeOtherQuickTabs(key: string) {
  const target = quickTabs.value.find((tab) => tab.key === key);
  if (!target) {
    return;
  }

  await closeQuickTabsByMatcher((tab) => tab.key !== key, target.path);
}

async function closeLeftQuickTabs(key: string) {
  const targetIndex = quickTabs.value.findIndex((tab) => tab.key === key);
  if (targetIndex < 0) {
    return;
  }

  const target = quickTabs.value[targetIndex];
  await closeQuickTabsByMatcher((tab, index) => index < targetIndex, target.path);
}

async function closeRightQuickTabs(key: string) {
  const targetIndex = quickTabs.value.findIndex((tab) => tab.key === key);
  if (targetIndex < 0) {
    return;
  }

  const target = quickTabs.value[targetIndex];
  await closeQuickTabsByMatcher((tab, index) => index > targetIndex, target.path);
}

async function handleQuickTabContextAction(action: QuickTabContextAction) {
  const target = quickTabContextTarget.value;
  if (!target) {
    closeQuickTabContextMenu();
    return;
  }

  closeQuickTabContextMenu();

  if (action === 'others') {
    await closeOtherQuickTabs(target.key);
    return;
  }

  if (action === 'left') {
    await closeLeftQuickTabs(target.key);
    return;
  }

  await closeRightQuickTabs(target.key);
}

async function closeQuickTab(key: string) {
  closeQuickTabContextMenu();

  const closingIndex = quickTabs.value.findIndex((tab) => tab.key === key);
  if (closingIndex < 0 || !quickTabs.value[closingIndex]?.closable) {
    return;
  }

  const closingTab = quickTabs.value[closingIndex];
  const nextTabs = sanitizeQuickTabs(quickTabs.value.filter((tab) => tab.key !== key));

  if (closingTab.path !== route.fullPath) {
    quickTabs.value = nextTabs;
    destroyCachedRouteView(closingTab.path);
    persistQuickTabs();
    return;
  }

  const fallbackTab =
    nextTabs[Math.max(closingIndex - 1, 0)] ||
    pinnedQuickTab.value ||
    nextTabs[0];

  if (fallbackTab && fallbackTab.path !== route.fullPath) {
    await router.push(fallbackTab.path);
  }

  quickTabs.value = nextTabs;
  destroyCachedRouteView(closingTab.path);
  persistQuickTabs();
}

async function loadNotifications() {
  if (!authStore.hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) {
    return;
  }

  try {
    notificationSummary.value = await notificationsApi.summary();
  } catch {
    notificationSummary.value = { unreadCount: 0, latest: [] };
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function handleProfilePopupVisibleChange(value: boolean) {
  profileMenuVisible.value = value;
}

async function openNotifications() {
  notificationsVisible.value = true;
  await loadNotifications();
}

async function markAllNotificationsRead() {
  try {
    notificationSummary.value = await notificationsApi.markAllRead();
    Message.success('通知已全部标记为已读');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '通知状态更新失败');
  }
}

async function handleNotificationClick(item: NotificationItem) {
  try {
    if (!item.isRead) {
      await notificationsApi.markRead(item.id);
      await loadNotifications();
    }

    if (item.link) {
      notificationsVisible.value = false;
      void router.push(item.link);
    }
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '通知处理失败');
  }
}

function handleMenuClick(path: string) {
  void router.push(path);
}

function goProfile() {
  profileMenuVisible.value = false;
  void router.push('/profile');
}

function goSettings() {
  profileMenuVisible.value = false;
  void router.push('/settings');
}

function logout() {
  profileMenuVisible.value = false;
  authStore.logout();
  void router.push('/login');
}

function handleGlobalPointerDown(event: PointerEvent) {
  if (!quickTabContextMenu.value.visible) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target?.closest('.admin-quick-tab-menu') || target?.closest('.admin-quick-tab')) {
    return;
  }

  closeQuickTabContextMenu();
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeQuickTabContextMenu();
  }
}

restoreQuickTabs();

watch(
  [() => route.fullPath, () => route.meta?.title as string | undefined, () => pinnedQuickTab.value?.path],
  () => {
    closeQuickTabContextMenu();
    syncQuickTabsWithRoute(route);
  },
  { immediate: true },
);

watch(quickTabContextTarget, (target) => {
  if (!target && quickTabContextMenu.value.visible) {
    closeQuickTabContextMenu();
  }
});

onMounted(async () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', handleGlobalPointerDown, true);
    window.addEventListener('keydown', handleGlobalKeydown);
    window.addEventListener('blur', closeQuickTabContextMenu);
  }

  if (authStore.user) {
    await loadNotifications();
    return;
  }

  try {
    await authStore.fetchProfile();
    await loadNotifications();
  } catch {
    authStore.logout();
    Message.error('登录状态已失效，请重新登录');
    void router.push('/login');
  }
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('pointerdown', handleGlobalPointerDown, true);
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('blur', closeQuickTabContextMenu);
});
</script>

<style scoped>
.admin-sider {
  border-right: 1px solid var(--admin-border);
  background: var(--admin-sider-bg);
}

.admin-sider :deep(.arco-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.admin-sider :deep(.arco-layout-sider-trigger) {
  border-top: 1px solid var(--admin-border);
  background: color-mix(in srgb, var(--admin-sider-bg) 88%, white);
  color: var(--admin-text-secondary);
}

.admin-sider :deep(.arco-layout-sider-trigger):hover {
  color: var(--admin-text);
}

[data-admin-theme='dark'] .admin-sider :deep(.arco-layout-sider-trigger) {
  background: color-mix(in srgb, var(--admin-sider-bg) 92%, black);
}

.admin-menu {
  padding: 0;
  background: transparent;
}

.admin-menu-sections {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  padding: 4px 14px 20px;
  overflow-y: auto;
}

.admin-menu-section {
  display: grid;
  gap: 10px;
}

.admin-menu-section__title {
  color: var(--admin-text-secondary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding-inline: 4px;
}

.admin-menu-divider {
  height: 1px;
  background: color-mix(in srgb, var(--admin-border) 80%, transparent);
  margin-bottom: 2px;
}

.admin-menu :deep(.arco-menu-inner) {
  padding: 0;
}

.admin-menu :deep(.arco-menu-item.arco-menu-has-icon),
.admin-menu :deep(.arco-menu-inline-header.arco-menu-has-icon) {
  padding-left: 16px;
}

.admin-menu :deep(.arco-menu-item),
.admin-menu :deep(.arco-menu-inline-header) {
  min-height: 38px;
  margin-bottom: 4px;
  border-radius: 12px;
  color: rgb(37 53 77 / 0.96);
  font-size: 12px;
  font-weight: 700;
  line-height: 38px;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;
}

.admin-menu :deep(.arco-menu-item .arco-menu-item-inner),
.admin-menu :deep(.arco-menu-inline-header .arco-menu-item-inner) {
  display: inline-flex;
  align-items: center;
  gap: 0;
  width: 100%;
}

.admin-menu :deep(.arco-menu-item .arco-menu-icon),
.admin-menu :deep(.arco-menu-inline-header .arco-menu-icon) {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  margin-right: 12px;
}

.admin-menu :deep(.arco-menu-item .arco-icon),
.admin-menu :deep(.arco-menu-inline-header .arco-icon) {
  font-size: 16px;
}

.admin-menu-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  transition: transform 160ms ease;
}

.admin-menu-item__icon :deep(.arco-icon) {
  font-size: 17px;
}

.admin-menu :deep(.admin-menu-item__glyph.arco-icon),
.admin-menu :deep(.admin-menu-item__glyph.arco-menu-icon),
.admin-menu :deep(.arco-menu-item .admin-menu-item__glyph.arco-icon),
.admin-menu :deep(.arco-menu-inline-header .admin-menu-item__glyph.arco-icon),
.admin-menu :deep(.arco-menu-item .admin-menu-item__glyph.arco-menu-icon),
.admin-menu :deep(.arco-menu-inline-header .admin-menu-item__glyph.arco-menu-icon) {
  color: var(--menu-icon-color) !important;
}

.admin-menu-item__label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.admin-menu :deep(.arco-menu-inline-header:hover),
.admin-menu :deep(.arco-menu-item:hover) {
  color: rgb(15 23 42 / 0.98);
  background: linear-gradient(180deg, rgb(76 111 255 / 0.18), rgb(76 111 255 / 0.1));
}

.admin-menu :deep(.arco-menu-inline-header.arco-menu-selected),
.admin-menu :deep(.arco-menu-inline-header.arco-menu-selected:hover) {
  color: rgb(24 40 72 / 0.98);
  background: linear-gradient(180deg, rgb(76 111 255 / 0.2), rgb(76 111 255 / 0.12));
  box-shadow: inset 0 0 0 1px rgb(76 111 255 / 0.12);
}

.admin-menu :deep(.arco-menu-item.arco-menu-selected),
.admin-menu :deep(.arco-menu-item.arco-menu-selected:hover) {
  color: rgb(15 23 42 / 0.99);
  background: linear-gradient(180deg, rgb(76 111 255 / 0.34), rgb(76 111 255 / 0.22));
  box-shadow: 0 10px 22px rgb(76 111 255 / 0.18);
}

.admin-menu :deep(.arco-menu-selected::before) {
  display: none;
}

.admin-menu :deep(.arco-menu-indent-list .arco-menu-item) {
  margin-left: 6px;
}

.admin-menu :deep(.arco-menu-pop-header),
.admin-menu :deep(.arco-menu-pop-item) {
  border-radius: 12px;
}

[data-admin-theme='dark'] .admin-menu :deep(.arco-menu-item),
[data-admin-theme='dark'] .admin-menu :deep(.arco-menu-inline-header) {
  color: rgb(226 232 240 / 0.94);
}

[data-admin-theme='dark'] .admin-menu-item__icon {
  filter: saturate(1.08) brightness(1.08);
}

[data-admin-theme='dark'] .admin-menu :deep(.arco-menu-inline-header:hover),
[data-admin-theme='dark'] .admin-menu :deep(.arco-menu-item:hover) {
  color: rgb(248 250 252 / 0.98);
  background: rgb(255 255 255 / 0.12);
}

[data-admin-theme='dark'] .admin-menu :deep(.arco-menu-inline-header.arco-menu-selected),
[data-admin-theme='dark'] .admin-menu :deep(.arco-menu-inline-header.arco-menu-selected:hover) {
  color: rgb(235 242 255 / 0.98);
  background: linear-gradient(180deg, rgb(76 111 255 / 0.26), rgb(76 111 255 / 0.18));
  box-shadow: inset 0 0 0 1px rgb(98 126 255 / 0.16);
}

[data-admin-theme='dark'] .admin-menu :deep(.arco-menu-item.arco-menu-selected),
[data-admin-theme='dark'] .admin-menu :deep(.arco-menu-item.arco-menu-selected:hover) {
  color: rgb(255 255 255 / 0.99);
  background: linear-gradient(180deg, rgb(76 111 255 / 0.42), rgb(76 111 255 / 0.3));
  box-shadow: 0 10px 22px rgb(28 51 153 / 0.24);
}

.notification-badge {
  display: inline-flex;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 6px 12px 6px 6px;
  border: 1px solid var(--admin-border);
  border-radius: 999px;
  background: var(--admin-surface);
  color: var(--admin-text);
  cursor: pointer;
}

.profile-avatar {
  flex: none;
}

.profile-meta {
  display: grid;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.profile-meta strong,
.profile-menu__copy strong {
  color: var(--admin-text);
}

.profile-meta span,
.profile-menu__copy span,
.profile-arrow {
  overflow: hidden;
  color: var(--admin-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-menu {
  display: grid;
  gap: 10px;
  width: 248px;
  padding: 8px;
  border: 1px solid var(--admin-border);
  border-radius: 18px;
  background: var(--admin-surface-strong);
  box-shadow: 0 22px 46px rgb(15 23 42 / 0.16);
}

.profile-menu__summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 4px;
}

.profile-menu__copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.profile-role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 4px;
}

.profile-menu__actions {
  display: grid;
  gap: 6px;
}

.profile-menu-action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--admin-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}

.profile-menu-action:hover {
  background: var(--admin-menu-hover-bg);
}

.profile-menu-action--danger {
  color: rgb(var(--danger-6));
}

:deep(.profile-popup) {
  overflow: visible !important;
}

.notification-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.notification-list {
  display: grid;
  gap: 12px;
}

.notification-item {
  display: grid;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--admin-border);
  border-radius: 16px;
  background: var(--admin-surface);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgb(15 23 42 / 0.08);
}

.notification-item--unread {
  border-color: rgb(64 128 255 / 0.32);
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(246 249 255 / 0.96));
}

.notification-item__head,
.notification-item__meta,
.header-actions,
.header-copy,
.admin-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-copy {
  justify-content: space-between;
}

.admin-brand {
  justify-content: flex-start;
  gap: 12px;
  padding: 18px 18px 14px;
}

.admin-brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgb(76 111 255 / 0.92), rgb(50 84 220 / 0.92));
  color: white;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 14px 28px rgb(76 111 255 / 0.24);
}

.admin-brand__copy {
  display: grid;
  gap: 2px;
}

.admin-brand__copy span {
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.admin-topbar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: grid;
  gap: 0;
  border-bottom: 1px solid var(--admin-border);
  background: color-mix(in srgb, var(--admin-surface) 92%, transparent);
  backdrop-filter: blur(18px);
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 24px;
  background: transparent;
}

.admin-quick-switch-wrap {
  display: flex;
  justify-content: flex-start;
  padding: 0 0 0 12px;
  border-top: 1px solid color-mix(in srgb, var(--admin-border) 82%, transparent);
  background:
    linear-gradient(180deg, rgb(15 23 42 / 0.02), transparent),
    color-mix(in srgb, var(--admin-surface) 94%, transparent);
  overflow: hidden;
}

.admin-quick-switch {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 40px;
  min-width: 0;
  padding: 0;
}

.admin-quick-switch__list {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding-top: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.admin-quick-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: none;
  min-width: 118px;
  max-width: 220px;
  min-height: 34px;
  padding: 0;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  background: color-mix(in srgb, var(--admin-surface) 78%, var(--color-fill-2));
  box-shadow: none;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.admin-quick-tab--active {
  z-index: 1;
  border-color: color-mix(in srgb, rgb(76 111 255 / 0.34) 46%, var(--admin-border));
  background: var(--admin-surface);
  box-shadow:
    inset 0 2px 0 rgb(76 111 255 / 0.72),
    0 -1px 0 var(--admin-surface);
}

.admin-quick-tab:not(.admin-quick-tab--active):hover {
  background: color-mix(in srgb, var(--admin-surface) 70%, var(--color-fill-3));
}

.admin-quick-tab--active:hover {
  background: var(--admin-surface);
}

.admin-quick-tab__main,
.admin-quick-tab__close {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.admin-quick-tab__main {
  display: inline-flex;
  flex: 1;
  align-self: stretch;
  align-items: center;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
  padding: 0 12px;
  color: var(--admin-text);
}

.admin-quick-tab__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--quick-tab-icon-color, #3b82f6);
}

.admin-quick-tab__icon :deep(.arco-icon) {
  font-size: 15px;
}

.admin-quick-tab--active .admin-quick-tab__icon {
  color: var(--quick-tab-icon-color, #3b82f6);
}

.admin-quick-tab__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.admin-quick-tab__close {
  display: inline-flex;
  flex: none;
  align-self: center;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 6px;
  border-radius: 6px;
  color: var(--admin-text-secondary);
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}

.admin-quick-tab__close:hover {
  background: rgb(15 23 42 / 0.08);
  color: var(--admin-text);
}

.admin-quick-tab__close :deep(.arco-icon) {
  font-size: 13px;
}

.admin-quick-tab-menu {
  position: fixed;
  z-index: 40;
  display: grid;
  gap: 4px;
  min-width: 148px;
  padding: 6px;
  border: 1px solid color-mix(in srgb, var(--admin-border) 90%, white);
  border-radius: 12px;
  background: color-mix(in srgb, var(--admin-surface-strong) 96%, white);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.16);
  backdrop-filter: blur(14px);
}

.admin-quick-tab-menu__item {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--admin-text);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}

.admin-quick-tab-menu__item:hover:not(:disabled) {
  background: rgb(76 111 255 / 0.12);
}

.admin-quick-tab-menu__item:disabled {
  color: var(--admin-text-secondary);
  cursor: not-allowed;
  opacity: 0.58;
}

.admin-content {
  padding: 24px;
  background: var(--admin-content-bg, transparent);
}

.notification-item__meta {
  justify-content: space-between;
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.notification-item p {
  margin: 0;
  color: var(--admin-text-secondary);
  line-height: 1.6;
}

[data-admin-theme='dark'] .admin-topbar {
  background: color-mix(in srgb, var(--admin-surface) 94%, black);
}

[data-admin-theme='dark'] .admin-quick-switch-wrap {
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.02), transparent),
    color-mix(in srgb, var(--admin-surface) 96%, black);
}

[data-admin-theme='dark'] .admin-quick-tab {
  background: rgb(255 255 255 / 0.04);
}

[data-admin-theme='dark'] .admin-quick-tab--active {
  border-color: rgb(98 126 255 / 0.28);
  background: rgb(19 28 45 / 0.96);
  box-shadow:
    inset 0 2px 0 rgb(98 126 255 / 0.9),
    0 -1px 0 rgb(19 28 45 / 0.96);
}

[data-admin-theme='dark'] .admin-quick-tab__main {
  color: rgb(245 247 255 / 0.96);
}

[data-admin-theme='dark'] .admin-quick-tab:not(.admin-quick-tab--active):hover {
  background: rgb(255 255 255 / 0.08);
}

[data-admin-theme='dark'] .admin-quick-tab--active:hover {
  background: rgb(19 28 45 / 0.96);
}

[data-admin-theme='dark'] .admin-quick-tab__close {
  color: rgb(226 232 240 / 0.72);
}

[data-admin-theme='dark'] .admin-quick-tab__close:hover {
  background: rgb(255 255 255 / 0.12);
  color: rgb(255 255 255 / 0.98);
}

[data-admin-theme='dark'] .admin-quick-tab-menu {
  border-color: rgb(148 163 184 / 0.16);
  background: color-mix(in srgb, var(--admin-surface-strong) 96%, black);
  box-shadow: 0 18px 42px rgb(2 6 23 / 0.42);
}

[data-admin-theme='dark'] .admin-quick-tab-menu__item:hover:not(:disabled) {
  background: rgb(76 111 255 / 0.2);
}

@media (max-width: 1200px) {
  .admin-header {
    min-height: auto;
    padding: 14px 16px;
  }

  .admin-quick-switch-wrap {
    padding-left: 8px;
  }
}

@media (max-width: 992px) {
  .admin-topbar {
    position: static;
  }

  .admin-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .admin-quick-switch,
  .admin-quick-switch__list {
    justify-content: flex-start;
  }

  .admin-quick-switch {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-menu {
    padding-inline: 12px;
  }
}
</style>
