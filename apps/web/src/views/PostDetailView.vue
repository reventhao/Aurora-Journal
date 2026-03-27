<template>
  <div v-if="loading" class="container page-section">
    <div class="empty-state">
      <strong>正在加载文章内容</strong>
      <p>请稍候。</p>
    </div>
  </div>

  <article v-else-if="post" class="post-detail">
    <div class="reading-progress">
      <span class="reading-progress__bar" :style="{ width: `${readingProgress}%` }" />
    </div>

    <section class="post-hero" :style="heroStyle">
      <div class="container post-hero-inner">
        <div class="post-hero-copy">
          <span class="eyebrow">{{ post.category?.name || '未分类' }}</span>
          <h1>{{ post.title }}</h1>
          <p>{{ post.excerpt }}</p>
          <div class="post-meta-line">
            <span>{{ post.readingTime }} 分钟阅读</span>
            <span>{{ post.views }} 次浏览</span>
            <span>{{ headings.length }} 个章节</span>
          </div>
        </div>
      </div>
    </section>

    <section class="container post-detail-main">
      <div class="post-detail-layout">
        <div class="article-column">
          <div class="article-body">
            <div ref="articleRef" class="article-reader">
              <div class="article-toolbar">
                <div class="article-toolbar__meta">
                  <span>阅读进度 {{ readingProgress }}%</span>
                  <span>更新于 {{ formatDate(post.updatedAt || post.createdAt) }}</span>
                </div>
                <div class="article-toolbar__actions">
                  <button type="button" class="article-toolbar__action" @click="copyPostLink">
                    {{ copied ? '链接已复制' : '复制文章链接' }}
                  </button>
                  <button type="button" class="article-toolbar__action" @click="toggleReadingList">
                    {{ isSaved ? '移出阅读清单' : '加入阅读清单' }}
                  </button>
                </div>
              </div>

              <div ref="markdownRef" class="markdown-preview-shell">
                <MdPreview
                  :editor-id="previewId"
                  :model-value="post.content || ''"
                  language="zh-CN"
                  theme="light"
                  preview-theme="github"
                  code-theme="atom"
                  show-code-row-number
                  code-foldable
                  :auto-fold-threshold="16"
                  :md-heading-id="buildHeadingId"
                  :on-html-changed="handlePreviewHtmlChanged"
                  :on-get-catalog="handlePreviewCatalog"
                />
              </div>

              <div v-if="post.tags.length" class="tag-list article-tags">
                <TagPill v-for="tag in post.tags" :key="tag.id" :tag="tag" size="compact" />
              </div>
            </div>

            <section v-if="relatedPosts.length" class="related-posts">
              <div class="related-posts__header">
                <h2>相关文章</h2>
              </div>
              <div class="post-grid compact related-posts__grid">
                <PostCard v-for="item in relatedPosts" :key="item.id" :post="item" />
              </div>
            </section>

            <section class="post-comments">
              <div class="comments-heading">
                <div>
                  <h2>评论</h2>
                  <p>{{ countAllComments(comments) }} 条评论</p>
                </div>
              </div>

              <CommentThread :post-id="post.id" :comments="comments" @refresh="loadComments" @like="handleLikeComment" />
              <CommentForm :post-id="post.id" @submitted="loadComments" />
            </section>
          </div>
        </div>

        <aside class="detail-sidebar">
          <section v-if="headings.length" class="detail-card toc-card">
            <div class="detail-card__header">
              <strong>文章目录</strong>
              <span>{{ headings.length }} 节</span>
            </div>
            <div class="catalog-shell">
              <MdCatalog
                class="catalog-nav"
                :editor-id="previewId"
                :md-heading-id="buildHeadingId"
                :scroll-element="scrollElement"
                theme="light"
                :offset-top="132"
                :scroll-element-offset-top="108"
              />
            </div>
          </section>

          <section class="detail-card insight-card">
            <div class="detail-card__header">
              <strong>阅读状态</strong>
              <span>{{ readingProgress }}%</span>
            </div>
            <div class="insight-list">
              <article>
                <span>预计阅读</span>
                <strong>{{ post.readingTime }} 分钟</strong>
              </article>
              <article>
                <span>浏览次数</span>
                <strong>{{ post.views }}</strong>
              </article>
              <article>
                <span>章节数量</span>
                <strong>{{ headings.length }}</strong>
              </article>
              <article>
                <span>收藏状态</span>
                <strong>{{ isSaved ? '已加入' : '未加入' }}</strong>
              </article>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </article>

  <div v-else class="container page-section">
    <div class="empty-state">
      <strong>文章不存在或尚未发布</strong>
      <p>请返回文章列表查看其他内容。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentSummary, PostSummary } from '@aurora/shared';
import { MdCatalog, MdPreview, type HeadList } from 'md-editor-v3';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { fetchPost, fetchPostComments, fetchPosts, likeComment } from '../api/public';
import CommentForm from '../components/blog/CommentForm.vue';
import CommentThread from '../components/blog/CommentThread.vue';
import PostCard from '../components/blog/PostCard.vue';
import TagPill from '../components/blog/TagPill.vue';
import { useReadingListStore } from '../stores/reading-list';

const route = useRoute();
const readingList = useReadingListStore();
const loading = ref(true);
const post = ref<any>(null);
const comments = ref<CommentSummary[]>([]);
const relatedPosts = ref<PostSummary[]>([]);
const articleRef = ref<HTMLElement | null>(null);
const markdownRef = ref<HTMLElement | null>(null);
const headings = ref<HeadList[]>([]);
const readingProgress = ref(0);
const copied = ref(false);
const scrollElement = typeof window !== 'undefined' ? document.documentElement : 'body';
let copyTimer: ReturnType<typeof setTimeout> | null = null;

readingList.load();

const previewId = computed(() => `post-preview-${post.value?.id ?? 'detail'}`);

const heroStyle = computed(() => {
  const coverImage = post.value?.coverImage;
  return coverImage ? { '--post-cover': `url("${coverImage}")` } : {};
});

const isSaved = computed(() => (post.value ? readingList.has(post.value.id) : false));

function buildHeadingId(text: string, level: number, index: number) {
  const normalized = encodeURIComponent(text.trim().toLowerCase().replace(/\s+/g, '-'));
  return `heading-${level}-${index}-${normalized || 'section'}`;
}

function queueReadingStateUpdate() {
  if (typeof window === 'undefined') return;

  window.requestAnimationFrame(() => {
    updateReadingState();
  });
}

function handlePreviewCatalog(list: HeadList[]) {
  headings.value = list;
  queueReadingStateUpdate();
}

function handlePreviewHtmlChanged() {
  queueReadingStateUpdate();
}

function updateReadingState() {
  const article = articleRef.value;
  if (!article) {
    readingProgress.value = 0;
    return;
  }

  const articleRect = article.getBoundingClientRect();
  const articleTop = window.scrollY + articleRect.top;
  const articleHeight = article.scrollHeight;
  const viewportOffset = window.scrollY + 120;
  const progressBase = Math.max(articleHeight - window.innerHeight * 0.45, 1);
  const progress = ((viewportOffset - articleTop) / progressBase) * 100;

  readingProgress.value = Math.max(0, Math.min(100, Math.round(progress)));
}

async function loadComments() {
  if (!route.params.slug) {
    comments.value = [];
    return;
  }

  try {
    comments.value = await fetchPostComments(route.params.slug as string);
  } catch {
    comments.value = [];
  }
}

async function loadRelatedPosts() {
  if (!post.value) {
    relatedPosts.value = [];
    return;
  }

  const categorySlug = post.value.category?.slug;
  const tagSlug = post.value.tags?.[0]?.slug;

  try {
    const response = await fetchPosts({
      pageSize: 4,
      ...(categorySlug ? { category: categorySlug } : tagSlug ? { tag: tagSlug } : {}),
    });

    relatedPosts.value = (response.items || []).filter((item: PostSummary) => item.id !== post.value.id).slice(0, 3);
  } catch {
    relatedPosts.value = [];
  }
}

async function loadPost() {
  loading.value = true;
  try {
    post.value = await fetchPost(route.params.slug as string);
    await Promise.all([loadComments(), loadRelatedPosts()]);
    await nextTick();
    queueReadingStateUpdate();
  } catch {
    post.value = null;
    comments.value = [];
    relatedPosts.value = [];
    headings.value = [];
    readingProgress.value = 0;
  } finally {
    loading.value = false;
  }
}

function countAllComments(items: CommentSummary[]): number {
  return items.reduce((total, item) => total + 1 + countAllComments(item.replies ?? []), 0);
}

async function handleLikeComment(commentId: string) {
  await likeComment(commentId);
  const applyLike = (items: CommentSummary[]): CommentSummary[] =>
    items.map((item) => ({
      ...item,
      likes: item.id === commentId ? (item.likes || 0) + 1 : item.likes,
      replies: applyLike(item.replies ?? []),
    }));

  comments.value = applyLike(comments.value);
}

async function copyPostLink() {
  await navigator.clipboard.writeText(window.location.href);
  copied.value = true;

  if (copyTimer) {
    clearTimeout(copyTimer);
  }

  copyTimer = setTimeout(() => {
    copied.value = false;
  }, 1800);
}

function toggleReadingList() {
  if (!post.value) return;
  readingList.toggle(post.value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

watch(
  () => route.params.slug,
  async () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    await loadPost();
  },
  { immediate: true },
);

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', updateReadingState, { passive: true });
  window.addEventListener('resize', updateReadingState);
}

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('scroll', updateReadingState);
  window.removeEventListener('resize', updateReadingState);
  if (copyTimer) {
    clearTimeout(copyTimer);
  }
});
</script>

<style scoped>
.reading-progress {
  position: fixed;
  inset: 0 0 auto;
  z-index: 30;
  height: 3px;
  background: rgb(15 23 42 / 0.06);
}

.reading-progress__bar {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #165dff, #36cfc9);
  box-shadow: 0 0 18px rgb(54 207 201 / 0.28);
  transition: width 120ms linear;
}

.post-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 292px;
  gap: 24px;
  align-items: start;
}

.article-column {
  min-width: 0;
}

.detail-sidebar {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 16px;
}

.detail-card {
  border: 1px solid rgb(15 23 42 / 0.08);
  border-radius: 20px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.92), rgb(247 250 255 / 0.86));
  box-shadow: 0 18px 42px rgb(15 23 42 / 0.08);
  overflow: hidden;
}

.detail-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
}

.detail-card__header strong {
  color: var(--text);
  font-size: 0.95rem;
}

.detail-card__header span {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.catalog-shell {
  position: relative;
  padding: 2px 12px 14px;
}

.catalog-shell::before {
  content: "";
  position: absolute;
  top: 10px;
  bottom: 14px;
  left: 20px;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(15 23 42 / 0), rgb(100 116 139 / 0.34) 10%, rgb(100 116 139 / 0.34) 90%, rgb(15 23 42 / 0));
  pointer-events: none;
}

.catalog-shell :deep(.md-editor-catalog) {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.catalog-shell :deep(.md-editor-catalog-wrapper) {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.catalog-shell :deep(.md-editor-catalog-wrapper .md-editor-catalog-wrapper) {
  position: relative;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 0;
}

.catalog-shell :deep(.md-editor-catalog-wrapper .md-editor-catalog-wrapper::before) {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(148 163 184 / 0.12), rgb(100 116 139 / 0.38) 12%, rgb(100 116 139 / 0.38) 88%, rgb(148 163 184 / 0.12));
  pointer-events: none;
}

.catalog-shell :deep(.md-editor-catalog-link) {
  margin: 0;
  min-width: 0;
  overflow: hidden;
}

.catalog-shell :deep(.md-editor-catalog-link span) {
  --toc-node-color: rgb(100 116 139 / 0.84);
  --toc-node-ring: rgb(100 116 139 / 0.14);
  box-sizing: border-box;
  position: relative;
  display: block;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  padding: 7px 10px 7px 24px;
  border-radius: 10px;
  background-color: transparent;
  background-repeat: no-repeat;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.36;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: background 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.catalog-shell :deep(.md-editor-catalog-link span::before) {
  content: "";
  position: absolute;
  top: 12px;
  left: 8px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--toc-node-color);
  box-shadow: 0 0 0 3px var(--toc-node-ring);
  transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.catalog-shell :deep(.md-editor-catalog-wrapper .md-editor-catalog-wrapper .md-editor-catalog-link span) {
  --toc-node-color: rgb(100 116 139 / 0.74);
  --toc-node-ring: rgb(100 116 139 / 0.12);
  padding-left: 28px;
  font-size: 0.78rem;
  color: #738196;
}

.catalog-shell :deep(.md-editor-catalog-wrapper .md-editor-catalog-wrapper .md-editor-catalog-link span::before) {
  top: 11px;
  left: 12px;
  width: 5px;
  height: 5px;
}

.catalog-shell :deep(.md-editor-catalog-link span:hover) {
  --toc-node-color: rgb(22 93 255 / 0.78);
  --toc-node-ring: rgb(22 93 255 / 0.14);
  background-color: rgb(22 93 255 / 0.05);
  color: #165dff;
  transform: translateX(1px);
}

.catalog-shell :deep(.md-editor-catalog-wrapper .md-editor-catalog-wrapper .md-editor-catalog-link span:hover) {
}

.catalog-shell :deep(.md-editor-catalog-active > span) {
  --toc-node-color: #165dff;
  --toc-node-ring: rgb(22 93 255 / 0.16);
  background-color: rgb(22 93 255 / 0.08);
  color: #165dff;
  font-weight: 600;
  box-shadow: inset 2px 0 0 #165dff, inset 0 0 0 1px rgb(22 93 255 / 0.08);
}

.catalog-shell :deep(.md-editor-catalog-wrapper .md-editor-catalog-wrapper .md-editor-catalog-active > span) {
}

.insight-list {
  display: grid;
  gap: 10px;
  padding: 0 18px 18px;
}

.insight-list article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgb(255 255 255 / 0.54);
  border: 1px solid rgb(15 23 42 / 0.06);
}

.insight-list span {
  color: var(--text-secondary);
  font-size: 0.84rem;
}

.insight-list strong {
  color: var(--text);
  font-size: 0.96rem;
}

.article-reader {
  min-width: 0;
}

.article-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
}

.article-toolbar__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  color: var(--text-secondary);
  font-size: 0.84rem;
}

.article-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.article-toolbar__action {
  padding: 10px 14px;
  border: 1px solid rgb(15 23 42 / 0.08);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.82);
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.article-toolbar__action:hover {
  transform: translateY(-1px);
  border-color: rgb(22 93 255 / 0.2);
  box-shadow: 0 10px 26px rgb(15 23 42 / 0.08);
}

.markdown-preview-shell {
  position: relative;
}

.markdown-preview-shell :deep(.md-editor) {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.markdown-preview-shell :deep(.md-editor-previewOnly) {
  padding: 0;
}

.markdown-preview-shell :deep(.md-editor-preview-wrapper) {
  padding: 0;
  background: transparent;
}

.markdown-preview-shell :deep(.md-editor-preview) {
  padding: 8px 0 0;
  background: transparent;
  color: #334155;
  font-size: 1rem;
  line-height: 1.9;
}

.markdown-preview-shell :deep(.md-editor-preview h1),
.markdown-preview-shell :deep(.md-editor-preview h2),
.markdown-preview-shell :deep(.md-editor-preview h3),
.markdown-preview-shell :deep(.md-editor-preview h4),
.markdown-preview-shell :deep(.md-editor-preview h5),
.markdown-preview-shell :deep(.md-editor-preview h6) {
  color: #0f172a;
  word-break: break-word;
  letter-spacing: -0.02em;
}

.markdown-preview-shell :deep(.md-editor-preview h1) {
  margin-top: 1.4em;
  font-size: clamp(1.8rem, 3vw, 2.2rem);
}

.markdown-preview-shell :deep(.md-editor-preview h2) {
  margin-top: 2.1em;
  padding-bottom: 0.48em;
  border-bottom: 1px solid rgb(15 23 42 / 0.08);
  font-size: clamp(1.45rem, 2.2vw, 1.72rem);
}

.markdown-preview-shell :deep(.md-editor-preview h3) {
  margin-top: 1.7em;
  font-size: clamp(1.16rem, 1.8vw, 1.3rem);
}

.markdown-preview-shell :deep(.md-editor-preview p),
.markdown-preview-shell :deep(.md-editor-preview li),
.markdown-preview-shell :deep(.md-editor-preview td),
.markdown-preview-shell :deep(.md-editor-preview th) {
  color: #334155;
}

.markdown-preview-shell :deep(.md-editor-preview p) {
  margin: 1.05em 0;
}

.markdown-preview-shell :deep(.md-editor-preview a) {
  color: #165dff;
}

.markdown-preview-shell :deep(.md-editor-preview a:hover) {
  color: #0f56ff;
}

.markdown-preview-shell :deep(.md-editor-preview p code),
.markdown-preview-shell :deep(.md-editor-preview li code),
.markdown-preview-shell :deep(.md-editor-preview td code),
.markdown-preview-shell :deep(.md-editor-preview blockquote code) {
  padding: 0.16em 0.52em;
  border: 1px solid rgb(22 93 255 / 0.12);
  border-radius: 999px;
  background: rgb(22 93 255 / 0.08);
  color: #165dff;
  font-size: 0.92em;
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code) {
  margin: 28px 0;
  border: 1px solid rgb(15 23 42 / 0.08);
  border-radius: 20px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 22px 48px rgb(15 23 42 / 0.16);
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-code-head) {
  height: 42px;
  align-items: center;
  background: linear-gradient(180deg, #0f172a, #162033);
  border-bottom: 1px solid rgb(255 255 255 / 0.06);
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-code-head .md-editor-code-flag) {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 14px;
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-code-head .md-editor-code-action) {
  gap: 8px;
  margin-right: 10px;
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-code-head .md-editor-code-action > *) {
  margin-right: 0;
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-code-head .md-editor-code-lang) {
  color: rgb(226 232 240 / 0.82);
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-copy-button[data-is-icon]),
.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-collapse-tips) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(226 232 240 / 0.9);
  transition: transform 180ms ease, background 180ms ease;
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-copy-button[data-is-icon]:hover),
.markdown-preview-shell :deep(.md-editor-preview .md-editor-code .md-editor-collapse-tips:hover) {
  transform: translateY(-1px);
  background: rgb(255 255 255 / 0.12);
}

.markdown-preview-shell :deep(.md-editor-preview .md-editor-code pre code) {
  padding: 20px 20px 20px 18px;
  background: linear-gradient(180deg, #111827, #0f172a);
}

.markdown-preview-shell :deep(.md-editor-scrn span[rn-wrapper] > span::before) {
  color: rgb(148 163 184 / 0.84);
}

.markdown-preview-shell :deep(.md-editor-preview blockquote) {
  margin: 22px 0;
  padding: 16px 18px;
  border: 1px solid rgb(22 93 255 / 0.1);
  border-left: 4px solid rgb(22 93 255 / 0.48);
  border-radius: 18px;
  background: linear-gradient(135deg, rgb(22 93 255 / 0.06), rgb(54 207 201 / 0.06));
  color: #334155;
}

.markdown-preview-shell :deep(.md-editor-preview hr) {
  margin: 30px 0;
  border-top-color: rgb(15 23 42 / 0.08);
}

.markdown-preview-shell :deep(.md-editor-preview img) {
  margin: 24px auto;
  border-radius: 18px;
  box-shadow: 0 18px 42px rgb(15 23 42 / 0.12);
}

.markdown-preview-shell :deep(.md-editor-preview figure) {
  display: block;
  margin: 0;
}

.markdown-preview-shell :deep(.md-editor-preview figure figcaption) {
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 0.84rem;
}

.markdown-preview-shell :deep(.md-editor-preview table) {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgb(15 23 42 / 0.08);
  border-radius: 18px;
  box-shadow: 0 16px 34px rgb(15 23 42 / 0.08);
}

.markdown-preview-shell :deep(.md-editor-preview thead th) {
  background: rgb(248 250 252);
  color: #0f172a;
  font-weight: 700;
}

.markdown-preview-shell :deep(.md-editor-preview th),
.markdown-preview-shell :deep(.md-editor-preview td) {
  min-width: 120px;
  padding: 13px 14px;
  border-color: rgb(15 23 42 / 0.08);
}

.markdown-preview-shell :deep(.md-editor-preview ul),
.markdown-preview-shell :deep(.md-editor-preview ol) {
  padding-left: 1.5rem;
}

.article-tags {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgb(15 23 42 / 0.06);
}

.related-posts {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid rgb(15 23 42 / 0.06);
}

.related-posts__header {
  margin-bottom: 16px;
}

.related-posts__header h2 {
  margin: 0;
  font-size: 1.18rem;
}

.related-posts__grid {
  gap: 16px;
}

.post-comments {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.comments-heading {
  margin-bottom: 14px;
}

.comments-heading h2 {
  margin: 0;
  font-size: 1.18rem;
}

.comments-heading p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

@media (max-width: 1080px) {
  .post-detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-sidebar {
    position: static;
    order: 1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .catalog-shell {
    max-height: 320px;
    overflow: auto;
  }
}

@media (max-width: 720px) {
  .detail-sidebar {
    grid-template-columns: 1fr;
  }

  .detail-card__header {
    padding: 14px 16px 10px;
  }

  .catalog-shell {
    padding: 2px 10px 12px;
  }

  .article-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .article-toolbar__meta,
  .article-toolbar__actions {
    width: 100%;
  }

  .article-toolbar__action {
    flex: 1;
    min-width: 0;
  }

  .catalog-shell :deep(.md-editor-catalog-link span) {
    padding-right: 8px;
    font-size: 0.78rem;
  }

  .markdown-preview-shell :deep(.md-editor-preview) {
    font-size: 0.96rem;
    line-height: 1.82;
  }

  .markdown-preview-shell :deep(.md-editor-preview .md-editor-code) {
    margin: 22px 0;
    border-radius: 18px;
  }

  .markdown-preview-shell :deep(.md-editor-preview .md-editor-code pre code) {
    padding: 18px 16px 18px 14px;
  }
}
</style>
