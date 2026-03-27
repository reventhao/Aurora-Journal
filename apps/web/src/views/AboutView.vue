<template>
  <section class="container about-page">
    <div v-if="loading && !settings" class="empty-state">
      <strong>&#27491;&#22312;&#21152;&#36733;&#20851;&#20110;&#39029;&#38754;...</strong>
      <p>&#31449;&#28857;&#20449;&#24687;&#19982;&#20869;&#23481;&#27010;&#35272;&#27491;&#22312;&#20934;&#22791;&#12290;</p>
    </div>

    <div v-else-if="settings" class="about-stack">
      <header class="about-card about-hero">
        <div class="about-hero__copy">
          <span class="about-eyebrow">&#20851;&#20110;&#26412;&#31449;</span>
          <h1>{{ settings.aboutTitle || fallbackTitle }}</h1>
          <p v-for="paragraph in aboutParagraphs" :key="paragraph">{{ paragraph }}</p>

          <div class="about-actions">
            <RouterLink class="btn btn-primary" to="/posts">&#27983;&#35272;&#25991;&#31456;</RouterLink>
            <RouterLink class="btn btn-secondary" to="/categories">&#26597;&#30475;&#20998;&#31867;</RouterLink>
            <a
              v-if="settings.githubUrl"
              class="btn btn-secondary"
              :href="settings.githubUrl"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>

        <aside class="about-hero__aside">
          <div class="about-stat-grid">
            <article v-for="metric in metrics" :key="metric.label" class="about-stat-card">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.note }}</small>
            </article>
          </div>

          <div class="about-panel">
            <div class="about-panel__header">
              <strong>&#39318;&#39029;&#27169;&#22359;</strong>
              <span>{{ enabledSections.length }} &#39033;</span>
            </div>

            <div v-if="enabledSections.length" class="about-chip-list">
              <span v-for="section in enabledSections" :key="section.key" class="about-chip">
                {{ section.title }}
              </span>
            </div>
            <div v-else class="about-panel__empty">
              &#26242;&#26410;&#21551;&#29992;&#39318;&#39029;&#20998;&#26639;
            </div>
          </div>
        </aside>
      </header>

      <div class="about-layout">
        <div class="about-main">
          <section class="about-card about-section">
            <div class="about-section__heading">
              <div>
                <span class="about-eyebrow">&#31449;&#28857;&#33021;&#21147;</span>
                <h2>&#29616;&#22312;&#33021;&#20570;&#20160;&#20040;</h2>
              </div>
            </div>

            <div class="about-feature-grid">
              <article v-for="feature in featureCards" :key="feature.title" class="about-feature-card">
                <span class="about-feature-card__meta">{{ feature.meta }}</span>
                <strong>{{ feature.title }}</strong>
                <p>{{ feature.description }}</p>
              </article>
            </div>
          </section>

          <section class="about-card about-section">
            <div class="about-section__heading">
              <div>
                <span class="about-eyebrow">&#26368;&#26032;&#20869;&#23481;</span>
                <h2>&#26368;&#36817;&#21457;&#24067;</h2>
              </div>
              <RouterLink class="text-link" to="/posts">&#20840;&#37096;&#25991;&#31456;</RouterLink>
            </div>

            <div v-if="latestPosts.length" class="about-post-list">
              <RouterLink
                v-for="post in latestPosts.slice(0, 4)"
                :key="post.id"
                class="about-post-item"
                :to="`/posts/${post.slug || post.id}`"
              >
                <div class="about-post-item__media">
                  <img
                    v-if="post.coverThumbUrl || post.coverImage"
                    :src="post.coverThumbUrl || post.coverImage"
                    :alt="post.title"
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-else class="about-post-item__placeholder">{{ post.category?.name || fallbackPostLabel }}</span>
                </div>

                <div class="about-post-item__content">
                  <div class="about-post-item__meta">
                    <span>{{ post.category?.name || uncategorizedLabel }}</span>
                    <span>{{ post.readingTime }} {{ minuteLabel }}</span>
                  </div>
                  <strong>{{ post.title }}</strong>
                  <p>{{ post.excerpt }}</p>
                </div>
              </RouterLink>
            </div>
            <div v-else class="empty-state about-empty">
              <strong>&#26242;&#26080;&#20844;&#24320;&#25991;&#31456;</strong>
              <p>&#21457;&#24067;&#25991;&#31456;&#21518;&#65292;&#36825;&#37324;&#20250;&#26174;&#31034;&#26368;&#26032;&#20869;&#23481;&#12290;</p>
            </div>
          </section>
        </div>

        <aside class="about-side">
          <section class="about-card about-section">
            <div class="about-section__heading">
              <div>
                <span class="about-eyebrow">&#20998;&#31867;</span>
                <h2>&#20869;&#23481;&#30446;&#24405;</h2>
              </div>
              <RouterLink class="text-link" to="/categories">&#20840;&#37096;&#20998;&#31867;</RouterLink>
            </div>

            <div v-if="categories.length" class="about-category-list">
              <RouterLink
                v-for="category in categories.slice(0, 6)"
                :key="category.id"
                class="about-category-item"
                :to="`/categories/${category.slug}`"
              >
                <span>{{ category.name }}</span>
                <strong>{{ category.postCount || 0 }}</strong>
              </RouterLink>
            </div>
            <div v-else class="empty-state about-empty">
              <strong>&#26242;&#26080;&#20998;&#31867;</strong>
              <p>&#21019;&#24314;&#20998;&#31867;&#21518;&#65292;&#36825;&#37324;&#20250;&#26174;&#31034;&#20869;&#23481;&#30446;&#24405;&#12290;</p>
            </div>
          </section>

          <section class="about-card about-section">
            <div class="about-section__heading">
              <div>
                <span class="about-eyebrow">&#26631;&#31614;</span>
                <h2>&#20027;&#39064;&#32034;&#24341;</h2>
              </div>
              <RouterLink class="text-link" to="/tags">&#20840;&#37096;&#26631;&#31614;</RouterLink>
            </div>

            <div v-if="tags.length" class="about-tag-cloud">
              <TagPill
                v-for="tag in tags.slice(0, 12)"
                :key="tag.id"
                :tag="tag"
                :show-count="true"
                stretch-on-mobile
              />
            </div>
            <div v-else class="empty-state about-empty">
              <strong>&#26242;&#26080;&#26631;&#31614;</strong>
              <p>&#28155;&#21152;&#26631;&#31614;&#21518;&#65292;&#36825;&#37324;&#20250;&#24418;&#25104;&#20027;&#39064;&#32034;&#24341;&#12290;</p>
            </div>
          </section>

          <section v-if="highlightPost" class="about-card about-section">
            <span class="about-eyebrow">&#25512;&#33616;&#38405;&#35835;</span>

            <RouterLink class="about-highlight" :to="`/posts/${highlightPost.slug || highlightPost.id}`">
              <div class="about-highlight__media">
                <img
                  v-if="highlightPost.coverThumbUrl || highlightPost.coverImage"
                  :src="highlightPost.coverThumbUrl || highlightPost.coverImage"
                  :alt="highlightPost.title"
                  loading="lazy"
                  decoding="async"
                />
                <span v-else class="about-post-item__placeholder">{{ highlightPost.category?.name || featuredLabel }}</span>
              </div>

              <div class="about-highlight__content">
                <div class="about-post-item__meta">
                  <span>{{ highlightPost.category?.name || uncategorizedLabel }}</span>
                  <span>{{ highlightPost.readingTime }} {{ minuteLabel }}</span>
                </div>
                <h3>{{ highlightPost.title }}</h3>
                <p>{{ highlightPost.excerpt }}</p>
              </div>
            </RouterLink>
          </section>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  CategorySummary,
  HomeSectionSetting,
  PostSummary,
  SiteSettings,
  TagSummary,
} from '@aurora/shared';
import { computed, onMounted, ref } from 'vue';

import { fetchHomeData } from '../api/public';
import TagPill from '../components/blog/TagPill.vue';
import { useSiteStore } from '../stores/site';

type HomePayload = {
  settings: SiteSettings;
  featuredPosts: PostSummary[];
  latestPosts: PostSummary[];
  categories: CategorySummary[];
  tags: TagSummary[];
};

const siteStore = useSiteStore();
const loading = ref(true);
const homeData = ref<HomePayload | null>(null);

const fallbackTitle = '\u5173\u4e8e\u672c\u7ad9';
const fallbackPostLabel = '\u6587\u7ae0';
const uncategorizedLabel = '\u672a\u5206\u7c7b';
const featuredLabel = '\u7cbe\u9009\u5185\u5bb9';
const minuteLabel = '\u5206\u949f';
const fallbackParagraphs = [
  '\u8fd9\u662f\u4e00\u4e2a\u7528\u4e8e\u5185\u5bb9\u53d1\u5e03\u3001\u5206\u7c7b\u6574\u7406\u4e0e\u540e\u53f0\u7ba1\u7406\u7684\u73b0\u4ee3\u535a\u5ba2\u7ad9\u70b9\u3002',
  '\u4f60\u53ef\u4ee5\u4ece\u6587\u7ae0\u3001\u5206\u7c7b\u3001\u6807\u7b7e\u4e0e\u9996\u9875\u6a21\u5757\u51e0\u4e2a\u5165\u53e3\u5feb\u901f\u4e86\u89e3\u7ad9\u70b9\u5185\u5bb9\u3002',
];

const settings = computed(() => siteStore.settings || homeData.value?.settings || null);
const categories = computed(() => homeData.value?.categories ?? []);
const tags = computed(() => homeData.value?.tags ?? []);
const latestPosts = computed(() => homeData.value?.latestPosts ?? []);
const featuredPosts = computed(() => homeData.value?.featuredPosts ?? []);
const highlightPost = computed(() => featuredPosts.value[0] || latestPosts.value[0] || null);

const aboutParagraphs = computed(() => {
  const content = settings.value?.aboutContent?.trim() || '';
  const paragraphs = content
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : fallbackParagraphs;
});

const enabledSections = computed<HomeSectionSetting[]>(() => settings.value?.homeSections.filter((item) => item.enabled) ?? []);

const metrics = computed(() => [
  {
    label: '\u7cbe\u9009\u5185\u5bb9',
    value: featuredPosts.value.length,
    note: '\u9996\u9875\u91cd\u70b9\u5c55\u793a\u5165\u53e3',
  },
  {
    label: '\u6700\u65b0\u53d1\u5e03',
    value: latestPosts.value.length,
    note: '\u5f53\u524d\u516c\u5f00\u6587\u7ae0\u5217\u8868',
  },
  {
    label: '\u5206\u7c7b\u6570\u91cf',
    value: categories.value.length,
    note: '\u6309\u4e3b\u9898\u7ec4\u7ec7\u5185\u5bb9',
  },
  {
    label: '\u6807\u7b7e\u6570\u91cf',
    value: tags.value.length,
    note: '\u9002\u5408\u5feb\u901f\u7b5b\u9009\u9605\u8bfb',
  },
]);

const featureCards = computed(() => [
  {
    meta: '\u516c\u5f00\u8bbf\u95ee',
    title: '\u524d\u53f0\u9605\u8bfb',
    description: latestPosts.value.length
      ? `\u5f53\u524d\u5df2\u63d0\u4f9b ${latestPosts.value.length} \u4e2a\u6700\u65b0\u6587\u7ae0\u5165\u53e3\uff0c\u53ef\u4ee5\u7ee7\u7eed\u6309\u5206\u7c7b\u548c\u6807\u7b7e\u6d4f\u89c8\u3002`
      : '\u6587\u7ae0\u53d1\u5e03\u540e\uff0c\u8fd9\u91cc\u4f1a\u5f62\u6210\u8fde\u7eed\u7684\u9605\u8bfb\u5165\u53e3\u3002',
  },
  {
    meta: '\u5206\u7c7b + \u6807\u7b7e',
    title: '\u5185\u5bb9\u7ec4\u7ec7',
    description:
      categories.value.length || tags.value.length
        ? `\u76ee\u524d\u6709 ${categories.value.length} \u4e2a\u5206\u7c7b\uff0c${tags.value.length} \u4e2a\u6807\u7b7e\u7528\u4e8e\u6574\u7406\u5185\u5bb9\u7ed3\u6784\u3002`
        : '\u5206\u7c7b\u548c\u6807\u7b7e\u4f1a\u5728\u8fd9\u91cc\u5f62\u6210\u6e05\u6670\u7684\u5185\u5bb9\u76ee\u5f55\u3002',
  },
  {
    meta: '\u9996\u9875\u7f16\u6392',
    title: '\u5c55\u793a\u5206\u680f',
    description: enabledSections.value.length
      ? `\u9996\u9875\u5f53\u524d\u542f\u7528 ${enabledSections.value.length} \u4e2a\u6a21\u5757\uff0c\u5bf9\u5e94\u7ad9\u70b9\u73b0\u5728\u7684\u5185\u5bb9\u5c55\u793a\u65b9\u5f0f\u3002`
      : '\u9996\u9875\u6a21\u5757\u542f\u7528\u540e\uff0c\u8fd9\u91cc\u4f1a\u4f53\u73b0\u7ad9\u70b9\u7684\u5c55\u793a\u7ed3\u6784\u3002',
  },
  {
    meta: '\u6301\u7eed\u66f4\u65b0',
    title: '\u63a8\u8350\u9605\u8bfb',
    description: highlightPost.value
      ? `\u76ee\u524d\u53ef\u4ee5\u4ece\u300a${highlightPost.value.title}\u300b\u7ee7\u7eed\u8fdb\u5165\u9605\u8bfb\u3002`
      : '\u7ad9\u70b9\u5185\u5bb9\u6301\u7eed\u589e\u52a0\u540e\uff0c\u8fd9\u91cc\u4f1a\u5c55\u793a\u66f4\u65b0\u7684\u95ee\u9898\u4e0e\u4e3b\u9898\u5165\u53e3\u3002',
  },
]);

onMounted(async () => {
  try {
    if (!siteStore.settings) {
      await siteStore.loadSettings();
    }
    homeData.value = await fetchHomeData();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.about-page {
  padding-bottom: 32px;
}

.about-stack {
  display: grid;
  gap: 28px;
}

.about-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 252, 0.92));
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
}

.about-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
  gap: 28px;
  padding: 30px;
  position: relative;
  overflow: hidden;
}

.about-hero::before,
.about-hero::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.about-hero::before {
  top: -120px;
  left: -80px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.16), transparent 70%);
}

.about-hero::after {
  right: -100px;
  bottom: -130px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.14), transparent 70%);
}

.about-hero__copy,
.about-hero__aside {
  position: relative;
  z-index: 1;
}

.about-hero__copy {
  display: grid;
  gap: 14px;
  align-content: start;
}

.about-hero__copy h1,
.about-section__heading h2 {
  margin: 0;
  color: #0f172a;
}

.about-hero__copy h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.05;
}

.about-hero__copy p,
.about-feature-card p,
.about-post-item__content p,
.about-highlight__content p {
  margin: 0;
  color: #475569;
  line-height: 1.75;
}

.about-eyebrow {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.about-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.about-hero__aside,
.about-main,
.about-side {
  display: grid;
  gap: 18px;
}

.about-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.about-stat-card,
.about-panel,
.about-feature-card,
.about-post-item,
.about-category-item,
.about-highlight {
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.about-stat-card {
  display: grid;
  gap: 4px;
  padding: 16px;
}

.about-stat-card span,
.about-stat-card small,
.about-panel__header span,
.about-post-item__meta {
  color: #64748b;
}

.about-stat-card strong {
  font-size: 1.7rem;
  line-height: 1;
}

.about-panel {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.about-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.about-panel__empty {
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.about-chip-list,
.about-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.about-chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.14);
  color: #0284c7;
  font-size: 13px;
  font-weight: 600;
}

.about-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  gap: 24px;
}

.about-section {
  padding: 24px;
}

.about-section__heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.about-section__heading h2 {
  margin-top: 8px;
  font-size: 1.5rem;
}

.about-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.about-feature-card {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.about-feature-card__meta {
  color: #0284c7;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.about-feature-card strong {
  color: #0f172a;
  font-size: 1.06rem;
}

.about-post-list,
.about-category-list {
  display: grid;
  gap: 14px;
}

.about-post-item {
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr);
  gap: 16px;
  padding: 14px;
}

.about-post-item__media,
.about-highlight__media {
  min-height: 106px;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(99, 102, 241, 0.12));
  aspect-ratio: 16 / 11;
}

.about-post-item__media img,
.about-highlight__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.about-post-item__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #0f172a;
  font-weight: 700;
}

.about-post-item__content,
.about-highlight__content {
  display: grid;
  gap: 8px;
  align-content: center;
  min-width: 0;
}

.about-post-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.82rem;
}

.about-post-item__content strong,
.about-highlight__content h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.08rem;
  line-height: 1.45;
}

.about-category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  color: #0f172a;
}

.about-category-item strong {
  display: inline-grid;
  place-items: center;
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
}

.about-highlight {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.about-empty {
  padding: 24px 16px;
}

@media (max-width: 1080px) {
  .about-hero,
  .about-layout,
  .about-feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .about-hero,
  .about-section {
    padding: 20px;
  }

  .about-stat-grid,
  .about-feature-grid {
    grid-template-columns: 1fr;
  }

  .about-post-item {
    grid-template-columns: 1fr;
  }
}
</style>
