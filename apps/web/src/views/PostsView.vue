<template>
  <section class="container page-section">
    <div class="page-header">
      <div>
        <span class="eyebrow">内容归档</span>
        <h1>全部文章</h1>
        <p v-if="activeCategory || activeTag" class="page-subtext">
          当前筛选：
          <span v-if="activeCategory">分类 {{ activeCategory }}</span>
          <span v-if="activeTag">标签 {{ activeTag }}</span>
        </p>
      </div>
      <div class="filter-bar">
        <input v-model="keyword" placeholder="搜索文章..." @keyup.enter="applyFilters" />
        <button class="btn btn-secondary" @click="applyFilters">筛选</button>
      </div>
    </div>

    <div v-if="loading" class="empty-state">
      <strong>正在搜索内容...</strong>
      <p>文章列表正在整理中，请稍候。</p>
    </div>

    <div v-else-if="errorMessage" class="empty-state">
      <strong>文章列表加载失败</strong>
      <p>{{ errorMessage }}</p>
    </div>

    <template v-else-if="posts.items.length">
      <div class="post-grid">
        <PostCard v-for="post in posts.items" :key="post.id" :post="post" />
      </div>

      <div v-if="posts.meta.pageCount > 1" class="posts-pagination-wrap">
        <nav class="posts-pagination" aria-label="文章分页">
          <div class="posts-pagination__track">
            <button
              type="button"
              class="posts-pagination__nav posts-pagination__nav--prev"
              :disabled="posts.meta.page <= 1"
              aria-label="上一页"
              @click="goToPage(posts.meta.page - 1)"
            >
              <span class="posts-pagination__nav-arrow">&lt;</span>
            </button>

            <div class="posts-pagination__pages">
              <button
                v-for="token in paginationTokens"
                :key="String(token)"
                type="button"
                class="posts-pagination__page"
                :class="{ 'posts-pagination__page--active': token === posts.meta.page }"
                :disabled="typeof token !== 'number'"
                @click="typeof token === 'number' && goToPage(token)"
              >
                {{ typeof token === 'number' ? token : '...' }}
              </button>
            </div>

            <button
              type="button"
              class="posts-pagination__nav posts-pagination__nav--next"
              :disabled="posts.meta.page >= posts.meta.pageCount"
              aria-label="下一页"
              @click="goToPage(posts.meta.page + 1)"
            >
              <span class="posts-pagination__nav-arrow">&gt;</span>
            </button>
          </div>
        </nav>
      </div>
    </template>

    <div v-else class="empty-state">
      <strong>没有找到匹配的文章</strong>
      <p>试试更换关键词，或者从首页的分类与标签继续浏览。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PaginatedResponse, PostSummary } from '@aurora/shared';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { fetchPosts } from '../api/public';
import PostCard from '../components/blog/PostCard.vue';

const PAGE_SIZE = 12;

type PaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const loading = ref(true);
const errorMessage = ref('');
const posts = ref<PaginatedResponse<PostSummary>>({
  items: [],
  meta: {
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    pageCount: 1,
  },
});

const activeKeyword = computed(() => normalizeQueryValue(route.query.keyword));
const activeCategory = computed(() => normalizeQueryValue(route.query.category));
const activeTag = computed(() => normalizeQueryValue(route.query.tag));
const activePage = computed(() => {
  const rawPage = Number(normalizeQueryValue(route.query.page) || '1');
  return Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
});
const paginationTokens = computed<PaginationToken[]>(() => {
  const totalPages = Math.max(posts.value.meta.pageCount || 1, 1);
  const currentPage = Math.min(activePage.value, totalPages);

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages];
});

function normalizeQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return normalizeQueryValue(value[0]);
  }

  return typeof value === 'string' ? value.trim() : '';
}

function buildRouteQuery(page = 1, nextKeyword = activeKeyword.value) {
  const query: Record<string, string> = {};

  if (activeCategory.value) {
    query.category = activeCategory.value;
  }

  if (activeTag.value) {
    query.tag = activeTag.value;
  }

  const normalizedKeyword = nextKeyword.trim();
  if (normalizedKeyword) {
    query.keyword = normalizedKeyword;
  }

  if (page > 1) {
    query.page = String(page);
  }

  return query;
}

async function loadPosts() {
  loading.value = true;
  errorMessage.value = '';
  keyword.value = activeKeyword.value;

  try {
    const response = await fetchPosts({
      page: activePage.value,
      pageSize: PAGE_SIZE,
      keyword: activeKeyword.value || undefined,
      category: activeCategory.value || undefined,
      tag: activeTag.value || undefined,
    });

    if (response.meta.pageCount > 0 && activePage.value > response.meta.pageCount) {
      await router.replace({ query: buildRouteQuery(response.meta.pageCount) });
      return;
    }

    posts.value = response;
  } catch {
    posts.value = {
      items: [],
      meta: {
        page: 1,
        pageSize: PAGE_SIZE,
        total: 0,
        pageCount: 1,
      },
    };
    errorMessage.value = '请稍后刷新重试。';
  } finally {
    loading.value = false;
  }
}

async function applyFilters() {
  await router.replace({ query: buildRouteQuery(1, keyword.value) });
}

async function goToPage(page: number) {
  if (page < 1 || page === activePage.value || page > posts.value.meta.pageCount) {
    return;
  }

  await router.replace({ query: buildRouteQuery(page) });
}

watch(
  () => [route.query.page, route.query.keyword, route.query.category, route.query.tag],
  () => {
    void loadPosts();
  },
  { immediate: true },
);
</script>

<style scoped>
.posts-pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.posts-pagination {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: min(100%, 760px);
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent 0, black 10%, black 90%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, black 10%, black 90%, transparent 100%);
}

.posts-pagination__track {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 0 26px;
  border: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(245, 248, 255, 0.88));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -1px 0 rgba(15, 23, 42, 0.06);
}

.posts-pagination__pages {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 1 1 auto;
  max-width: 100%;
  padding: 6px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.posts-pagination__pages::-webkit-scrollbar {
  display: none;
}

.posts-pagination__nav,
.posts-pagination__page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 180ms ease,
    background 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.posts-pagination__nav {
  flex: none;
  min-width: 34px;
  color: rgb(49 67 95 / 0.78);
}

.posts-pagination__nav-arrow {
  font-size: 1rem;
  line-height: 1;
}

.posts-pagination__nav:hover:not(:disabled),
.posts-pagination__page:hover:not(:disabled) {
  transform: none;
  background: radial-gradient(circle, rgba(22, 93, 255, 0.16), rgba(22, 93, 255, 0.04));
  color: #165dff;
  box-shadow: inset 0 0 0 1px rgba(22, 93, 255, 0.08);
}

.posts-pagination__page--active,
.posts-pagination__page--active:hover:not(:disabled) {
  transform: none;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0) 38%),
    linear-gradient(135deg, #165dff, #4f8cff);
  color: white;
  box-shadow:
    0 8px 18px rgba(22, 93, 255, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.posts-pagination__page:disabled:not(.posts-pagination__page--active) {
  width: 22px;
  min-width: 22px;
  background: transparent;
  color: rgb(100 116 139 / 0.72);
  box-shadow: none;
}

.posts-pagination__nav:disabled,
.posts-pagination__page:disabled {
  transform: none;
  box-shadow: none;
  color: var(--text-secondary);
  cursor: default;
  opacity: 0.58;
}

@media (max-width: 720px) {
  .posts-pagination {
    width: 100%;
    -webkit-mask-image: linear-gradient(90deg, transparent 0, black 7%, black 93%, transparent 100%);
    mask-image: linear-gradient(90deg, transparent 0, black 7%, black 93%, transparent 100%);
  }

  .posts-pagination__track {
    padding: 0 18px;
  }

  .posts-pagination__nav {
    width: 32px;
    height: 38px;
    min-width: 32px;
  }
}
</style>
