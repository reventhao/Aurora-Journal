<template>
  <div v-if="loading" class="container page-section">
    <div class="empty-state">
      <strong>正在加载首页内容...</strong>
      <p>文章、分类和标签正在准备中。</p>
    </div>
  </div>

  <div v-else-if="errorMessage" class="container page-section">
    <div class="empty-state">
      <strong>首页内容加载失败</strong>
      <p>{{ errorMessage }}</p>
    </div>
  </div>

  <div v-else-if="homeData && settings">
    <HeroBanner :settings="settings" />

    <section class="container page-section">
      <div class="home-layout">
        <section
          v-for="(section, index) in visibleSections"
          :key="section.key"
          class="home-layout__section"
          :class="[getSectionCardClass(section), `home-layout__section--${section.key}`]"
          :style="getSectionGridStyle(section, index)"
        >
          <div class="section-heading home-layout__heading">
            <h2>{{ section.title }}</h2>
            <RouterLink class="text-link" :to="getSectionLink(section.key).to">
              {{ getSectionLink(section.key).label }}
            </RouterLink>
          </div>

          <div v-if="section.key === 'featuredPosts'" class="home-post-grid home-post-grid--featured">
            <PostCard v-for="post in homeData.featuredPosts" :key="post.id" :post="post" />
          </div>

          <div v-else-if="section.key === 'latestPosts'" class="home-post-grid home-post-grid--latest">
            <PostCard v-for="post in homeData.latestPosts" :key="post.id" :post="post" />
          </div>

          <div v-else-if="section.key === 'categories'" class="home-category-grid">
            <RouterLink
              v-for="category in homeData.categories"
              :key="category.id"
              class="home-category-card"
              :to="`/categories/${category.slug}`"
            >
              <div class="home-category-card__top">
                <span class="home-category-card__badge">分类</span>
                <strong class="home-category-card__count">{{ category.postCount }} 篇</strong>
              </div>
              <div class="home-category-card__body">
                <h3>{{ category.name }}</h3>
                <p>{{ getCategoryDescription(category) }}</p>
              </div>
              <div class="home-category-card__footer">
                <span class="home-category-card__link">进入分类</span>
                <span class="home-category-card__arrow" aria-hidden="true" />
              </div>
            </RouterLink>
          </div>

          <div v-else class="tag-cloud">
            <TagPill
              v-for="tag in homeData.tags"
              :key="tag.id"
              :tag="tag"
              :show-count="true"
              :size="section.w === 1 && section.h === 1 ? 'compact' : 'default'"
              stretch-on-mobile
            />
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CategorySummary, HomeSectionSetting } from '@aurora/shared';
import type { CSSProperties } from 'vue';
import { computed, onMounted, ref } from 'vue';

import { fetchHomeData } from '../api/public';
import HeroBanner from '../components/blog/HeroBanner.vue';
import PostCard from '../components/blog/PostCard.vue';
import TagPill from '../components/blog/TagPill.vue';
import { useSiteStore } from '../stores/site';

const siteStore = useSiteStore();
const homeData = ref<any>(null);
const loading = ref(true);
const errorMessage = ref('');
const settings = computed(() => siteStore.settings);

const enabledSections = computed<HomeSectionSetting[]>(() => settings.value?.homeSections.filter((item) => item.enabled) ?? []);

const visibleSections = computed<HomeSectionSetting[]>(() => {
  if (!homeData.value) return [];

  return [...enabledSections.value]
    .filter((section) => {
      if (section.key === 'featuredPosts') return homeData.value.featuredPosts.length > 0;
      if (section.key === 'latestPosts') return homeData.value.latestPosts.length > 0;
      if (section.key === 'categories') return homeData.value.categories.length > 0;
      return homeData.value.tags.length > 0;
    })
    .sort((left, right) => {
      if (left.y !== right.y) return left.y - right.y;
      if (left.x !== right.x) return left.x - right.x;
      return left.key.localeCompare(right.key);
    });
});

function getSectionLink(key: HomeSectionSetting['key']) {
  if (key === 'featuredPosts') return { to: '/posts', label: '全部文章' };
  if (key === 'latestPosts') return { to: '/posts', label: '文章列表' };
  if (key === 'categories') return { to: '/categories', label: '全部分类' };
  return { to: '/tags', label: '全部标签' };
}

function getSectionGridStyle(section: HomeSectionSetting, index: number): CSSProperties & Record<string, string> {
  return {
    gridColumn: `${section.x + 1} / span ${section.w}`,
    gridRow: `${section.y + 1} / span ${section.h}`,
    '--section-cols': String(section.w),
    '--section-rows': String(section.h),
    animationDelay: `${index * 90}ms`,
  };
}

function getSectionCardClass(section: HomeSectionSetting) {
  return {
    'home-layout__section--wide': section.w === 2,
    'home-layout__section--tall': section.h === 2,
    'home-layout__section--compact': section.w === 1 && section.h === 1,
  };
}

function getCategoryDescription(category: CategorySummary) {
  const description = category.description?.trim();
  if (description) {
    return description;
  }

  const count = Number(category.postCount ?? 0);
  return count > 0 ? `收录 ${count} 篇内容` : '浏览这个主题下的内容';
}

onMounted(async () => {
  try {
    if (!siteStore.settings) {
      await siteStore.loadSettings();
    }
    homeData.value = await fetchHomeData();
    errorMessage.value = '';
  } catch {
    homeData.value = null;
    errorMessage.value = '请稍后刷新重试。';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
  grid-auto-rows: minmax(120px, auto);
}

.home-layout__section {
  display: grid;
  gap: 16px;
  min-width: 0;
  align-self: start;
  align-content: start;
  min-height: calc(220px + (var(--section-rows, 1) - 1) * 176px);
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 250, 253, 0.9));
  box-shadow: var(--card-shadow);
  animation: home-section-enter 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.home-layout__section:hover {
  transform: translateY(-4px);
  border-color: rgba(22, 93, 255, 0.16);
  box-shadow: var(--card-shadow-hover);
}

.home-layout__heading {
  margin-bottom: 0;
}

.home-layout__heading h2 {
  margin: 0;
}

.home-layout__section--compact {
  gap: 14px;
}

.home-layout__section--wide .home-post-grid,
.home-layout__section--wide .home-category-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-layout__section--tall .home-post-grid--featured,
.home-layout__section--tall .home-post-grid--latest {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-layout__section--compact .home-post-grid--featured,
.home-layout__section--compact .home-post-grid--latest,
.home-layout__section--compact .home-category-grid {
  grid-template-columns: 1fr;
}

.home-post-grid {
  display: grid;
  gap: 18px;
  align-items: start;
  grid-template-columns: 1fr;
}

.home-category-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-items: start;
}

.home-category-card {
  --category-accent: #165dff;
  --category-accent-soft: rgba(22, 93, 255, 0.12);
  position: relative;
  display: grid;
  gap: 8px;
  min-width: 0;
  min-height: 96px;
  padding: 12px 12px 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.07);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 253, 0.92));
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.home-category-card::before {
  content: "";
  position: absolute;
  top: -46px;
  right: -38px;
  width: 92px;
  height: 92px;
  border-radius: 999px;
  background: radial-gradient(circle, var(--category-accent-soft), transparent 72%);
  pointer-events: none;
}

.home-category-card::after {
  content: "";
  position: absolute;
  inset: auto 14px 0;
  height: 1px;
  background: linear-gradient(90deg, var(--category-accent), transparent);
  opacity: 0.16;
}

.home-category-card:nth-child(4n + 2) {
  --category-accent: #36a3ff;
  --category-accent-soft: rgba(54, 163, 255, 0.14);
}

.home-category-card:nth-child(4n + 3) {
  --category-accent: #00b96b;
  --category-accent-soft: rgba(0, 185, 107, 0.14);
}

.home-category-card:nth-child(4n + 4) {
  --category-accent: #ff7d00;
  --category-accent-soft: rgba(255, 125, 0, 0.14);
}

.home-category-card:hover,
.home-category-card:focus-visible {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--category-accent) 24%, rgba(15, 23, 42, 0.08));
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.11);
}

.home-category-card__top,
.home-category-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.home-category-card__badge,
.home-category-card__count,
.home-category-card__link {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.home-category-card__badge {
  background: rgba(15, 23, 42, 0.05);
  color: var(--text-secondary);
}

.home-category-card__count {
  flex: none;
  background: var(--category-accent-soft);
  color: var(--category-accent);
}

.home-category-card__body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.home-category-card__body h3 {
  margin: 0;
  color: var(--text);
  font-size: 0.92rem;
  line-height: 1.22;
}

.home-category-card__body p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.home-category-card__link {
  padding: 0;
  background: transparent;
  color: var(--text-secondary);
}

.home-category-card__arrow {
  flex: none;
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--category-accent) 12%, #ffffff);
}

.home-category-card__arrow::before,
.home-category-card__arrow::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  background: var(--category-accent);
  transform-origin: center;
}

.home-category-card__arrow::before {
  width: 8px;
  height: 1.5px;
  transform: translate(-48%, -50%);
}

.home-category-card__arrow::after {
  width: 5px;
  height: 5px;
  border-top: 1.5px solid var(--category-accent);
  border-right: 1.5px solid var(--category-accent);
  background: transparent;
  transform: translate(-12%, -50%) rotate(45deg);
}

.home-category-card:hover .home-category-card__link,
.home-category-card:focus-visible .home-category-card__link {
  color: var(--category-accent);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
  align-content: flex-start;
}

@keyframes home-section-enter {
  from {
    opacity: 0;
    transform: translateY(22px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1080px) {
  .home-layout {
    grid-template-columns: 1fr;
  }

  .home-layout__section {
    grid-column: 1 / -1 !important;
    grid-row: auto !important;
    min-height: auto;
  }
}

@media (max-width: 720px) {
  .home-layout__section {
    padding: 18px;
  }

  .home-layout__heading {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .home-layout__section--wide .home-post-grid,
  .home-layout__section--wide .home-category-grid,
  .home-layout__section--tall .home-post-grid--featured,
  .home-layout__section--tall .home-post-grid--latest {
    grid-template-columns: 1fr;
  }

  .home-category-card {
    min-height: 82px;
    padding: 10px 10px 10px 12px;
  }

  .home-category-card__body h3 {
    font-size: 0.86rem;
  }

}
</style>
