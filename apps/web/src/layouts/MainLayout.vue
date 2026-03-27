<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="container nav-row">
        <RouterLink class="brand" to="/">
          <img v-if="settings?.logo" :src="settings.logo" alt="logo" class="brand-logo" />
          <div>
            <strong>{{ settings?.siteName || 'Aurora Journal' }}</strong>
            <span>{{ settings?.siteSubtitle || '内容与观点' }}</span>
          </div>
        </RouterLink>

        <div class="nav-actions">
          <button type="button" class="search-trigger" @click="searchVisible = true">
            <span>搜索</span>
            <kbd>Ctrl K</kbd>
          </button>

          <button
            type="button"
            class="nav-toggle"
            :aria-expanded="mobileMenuVisible"
            aria-label="打开导航菜单"
            @click="mobileMenuVisible = true"
          >
            <span />
            <span />
            <span />
          </button>

          <nav class="nav-links">
            <template v-for="item in navigationItems" :key="item.key">
              <a v-if="item.external" :href="item.path" target="_blank" rel="noreferrer">
                {{ item.label }}
              </a>
              <RouterLink
                v-else
                :to="item.path"
                :class="{ 'reading-nav-link': item.showReadingCount }"
              >
                {{ item.label }}
                <span v-if="item.showReadingCount && readingList.count" class="reading-nav-badge">
                  {{ readingList.count }}
                </span>
              </RouterLink>
            </template>
          </nav>
        </div>
      </div>
    </header>

    <Teleport to="body">
      <transition name="mobile-nav-fade">
        <div v-if="mobileMenuVisible" class="mobile-nav-overlay" @click.self="closeMobileMenu">
          <div class="mobile-nav-panel">
            <div class="mobile-nav-panel__header">
              <div class="mobile-nav-panel__brand">
                <strong>{{ settings?.siteName || 'Aurora Journal' }}</strong>
                <span>{{ settings?.siteSubtitle || '内容与观点' }}</span>
              </div>

              <button
                type="button"
                class="mobile-nav-close"
                aria-label="关闭导航菜单"
                @click="closeMobileMenu"
              >
                ×
              </button>
            </div>

            <button type="button" class="mobile-nav-search" @click="openSearchFromMobile">
              <span>搜索内容</span>
              <kbd>Ctrl K</kbd>
            </button>

            <nav class="mobile-nav-links">
              <template v-for="item in navigationItems" :key="item.key">
                <a
                  v-if="item.external"
                  :href="item.path"
                  target="_blank"
                  rel="noreferrer"
                  @click="closeMobileMenu"
                >
                  {{ item.label }}
                </a>
                <RouterLink
                  v-else
                  :to="item.path"
                  :class="{ 'reading-nav-link': item.showReadingCount }"
                  @click="closeMobileMenu"
                >
                  {{ item.label }}
                  <span v-if="item.showReadingCount && readingList.count" class="reading-nav-badge">
                    {{ readingList.count }}
                  </span>
                </RouterLink>
              </template>
            </nav>
          </div>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="mobile-nav-fade">
        <div
          v-if="announcementDialogVisible"
          class="announcement-popup-overlay"
          @click.self="closeAnnouncementDialog"
        >
          <section class="announcement-popup" role="dialog" aria-modal="true" aria-label="首页公告">
            <button
              type="button"
              class="announcement-popup__close"
              aria-label="关闭公告"
              @click="closeAnnouncementDialog"
            >
              ×
            </button>

            <div class="announcement-popup__eyebrow">
              <span class="announcement-popup__badge">站点公告</span>
              <span class="announcement-popup__hint">首页提醒</span>
            </div>

            <div class="announcement-popup__content">
              <strong>{{ announcement.title }}</strong>
              <p>{{ announcement.content }}</p>
            </div>

            <div class="announcement-popup__actions">
              <button
                v-if="announcement.link"
                type="button"
                class="announcement-popup__ghost"
                @click="closeAnnouncementDialog"
              >
                稍后再看
              </button>
              <a
                v-if="announcement.link && announcement.external"
                class="announcement-popup__action"
                :href="announcement.link"
                target="_blank"
                rel="noreferrer"
                @click="closeAnnouncementDialog"
              >
                {{ announcement.linkLabel }}
              </a>
              <RouterLink
                v-else-if="announcement.link"
                class="announcement-popup__action"
                :to="announcement.link"
                @click="closeAnnouncementDialog"
              >
                {{ announcement.linkLabel }}
              </RouterLink>
              <button
                v-else
                type="button"
                class="announcement-popup__ghost"
                @click="closeAnnouncementDialog"
              >
                我知道了
              </button>
            </div>
          </section>
        </div>
      </transition>
    </Teleport>

    <main>
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="container footer-row">
        <div>
          <strong>{{ settings?.siteName || 'Aurora Journal' }}</strong>
          <p>{{ settings?.footerText }}</p>
        </div>
        <div class="footer-links">
          <a :href="settings?.githubUrl || '#'" target="_blank" rel="noreferrer">GitHub</a>
          <span v-if="settings?.icp">{{ settings.icp }}</span>
        </div>
      </div>
    </footer>

    <SearchDialog :visible="searchVisible" @close="searchVisible = false" />
    <ReaderAssistantPet />
  </div>
</template>

<script setup lang="ts">
import {
  NAVIGATION_MENU_DEFAULTS,
  buildDefaultNavigationMenu,
  isBuiltinNavigationMenuKey,
} from '@aurora/shared';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import ReaderAssistantPet from '../components/assistant/ReaderAssistantPet.vue';
import SearchDialog from '../components/blog/SearchDialog.vue';
import { useReadingListStore } from '../stores/reading-list';
import { useSiteStore } from '../stores/site';

const route = useRoute();
const siteStore = useSiteStore();
const readingList = useReadingListStore();
const searchVisible = ref(false);
const mobileMenuVisible = ref(false);
const announcementDialogVisible = ref(false);
const announcementStorageKey = 'aurora:home-announcement:dismissed';

const settings = computed(() => siteStore.settings);
const announcement = computed(() => {
  const title = settings.value?.announcementTitle?.trim() || '站点公告';
  const content = settings.value?.announcementContent?.trim() || '';
  const link = settings.value?.announcementLink?.trim() || '';
  const linkLabel = settings.value?.announcementLinkLabel?.trim() || '查看详情';

  return {
    visible: Boolean(settings.value?.announcementEnabled && content),
    title,
    content,
    link,
    linkLabel,
    external: /^https?:\/\//i.test(link),
  };
});
const announcementSignature = computed(() =>
  [
    announcement.value.title,
    announcement.value.content,
    announcement.value.link,
    announcement.value.linkLabel,
  ].join('::'),
);
const isHomeRoute = computed(() => route.path === '/');
const adminUrl = computed(() => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5174';
  }

  return `${window.location.protocol}//${window.location.hostname}:5174`;
});
const navigationItems = computed(() =>
  (settings.value?.navigationMenu?.length
    ? [...settings.value.navigationMenu]
    : buildDefaultNavigationMenu())
    .filter((item) => item.visible)
    .sort((left, right) => left.order - right.order)
    .map((item) => {
      const builtinKey =
        item.builtinKey && isBuiltinNavigationMenuKey(item.builtinKey)
          ? item.builtinKey
          : isBuiltinNavigationMenuKey(item.key)
            ? item.key
            : null;
      const fallback = builtinKey ? NAVIGATION_MENU_DEFAULTS[builtinKey] : null;
      const rawPath = item.path || fallback?.path || '/';

      return {
        key: item.key,
        builtinKey,
        label: item.label || fallback?.label || '新菜单',
        path: builtinKey === 'admin' && rawPath === '/admin' ? adminUrl.value : rawPath,
        external: typeof item.external === 'boolean' ? item.external : fallback?.external || false,
        showReadingCount: builtinKey === 'readingList',
      };
    }),
);

onMounted(() => {
  if (!siteStore.settings) {
    void siteStore.loadSettings();
  }

  readingList.load();

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown);
    syncAnnouncementDialog();
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleGlobalKeydown);
    document.body.style.overflow = '';
  }
});

watch(
  () => route.fullPath,
  () => {
    mobileMenuVisible.value = false;
    syncAnnouncementDialog();
  },
  { immediate: true },
);

watch([() => announcement.value.visible, announcementSignature], () => {
  syncAnnouncementDialog();
});

watch([searchVisible, mobileMenuVisible, announcementDialogVisible], ([searchOpen, menuOpen, announcementOpen]) => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = searchOpen || menuOpen || announcementOpen ? 'hidden' : '';
});

function handleGlobalKeydown(event: KeyboardEvent) {
  const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
  if (!isShortcut) return;

  event.preventDefault();
  searchVisible.value = true;
}

function closeMobileMenu() {
  mobileMenuVisible.value = false;
}

function getDismissedAnnouncementSignature() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem(announcementStorageKey) ?? '';
}

function syncAnnouncementDialog() {
  if (typeof window === 'undefined') {
    announcementDialogVisible.value = false;
    return;
  }

  announcementDialogVisible.value =
    isHomeRoute.value &&
    announcement.value.visible &&
    getDismissedAnnouncementSignature() !== announcementSignature.value;
}

function closeAnnouncementDialog() {
  announcementDialogVisible.value = false;

  if (typeof window !== 'undefined' && announcementSignature.value) {
    window.sessionStorage.setItem(announcementStorageKey, announcementSignature.value);
  }
}

function openSearchFromMobile() {
  mobileMenuVisible.value = false;
  searchVisible.value = true;
}
</script>

<style scoped>
.announcement-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(56, 189, 248, 0.14), transparent 34%),
    rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(14px);
}

.announcement-popup {
  position: relative;
  display: grid;
  gap: 18px;
  width: min(680px, 100%);
  padding: 28px;
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 40px;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(240, 249, 255, 0.96));
  box-shadow:
    0 30px 80px rgba(15, 23, 42, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.announcement-popup__close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: transform 180ms ease;
}

.announcement-popup__eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 40px;
  flex-wrap: wrap;
}

.announcement-popup__badge,
.announcement-popup__hint {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.announcement-popup__badge {
  background: linear-gradient(135deg, #0ea5e9, #38bdf8);
  color: #fff;
  box-shadow: 0 14px 26px rgba(14, 165, 233, 0.24);
}

.announcement-popup__hint {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(14, 165, 233, 0.16);
  color: #0369a1;
}

.announcement-popup__content {
  display: grid;
  gap: 10px;
}

.announcement-popup__content strong {
  color: #0f172a;
  font-size: clamp(1.4rem, 3vw, 2rem);
  line-height: 1.12;
}

.announcement-popup__content p {
  margin: 0;
  color: rgba(15, 23, 42, 0.78);
  font-size: 0.98rem;
  line-height: 1.8;
}

.announcement-popup__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.announcement-popup__ghost,
.announcement-popup__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 20px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.announcement-popup__ghost {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.82);
  color: #334155;
  cursor: pointer;
}

.announcement-popup__action {
  border: 0;
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  color: #fff;
  box-shadow: 0 18px 28px rgba(14, 165, 233, 0.28);
}

.announcement-popup__ghost:hover,
.announcement-popup__action:hover,
.announcement-popup__close:hover {
  transform: translateY(-1px);
}

@media (max-width: 720px) {
  .announcement-popup-overlay {
    padding: 16px;
  }

  .announcement-popup {
    padding: 22px 18px 18px;
    border-radius: 32px;
  }

  .announcement-popup__actions {
    justify-content: stretch;
  }

  .announcement-popup__ghost,
  .announcement-popup__action {
    width: 100%;
  }
}
</style>
