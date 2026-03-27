<template>
  <a-card :bordered="false" class="posts-card">
    <template #title>文章管理</template>

    <div class="toolbar">
      <a-input-search
        v-model="keyword"
        allow-clear
        placeholder="搜索标题或摘要"
        search-button
        class="toolbar-search"
        @search="handleSearch"
        @clear="handleSearch"
      />
      <a-select v-model="filters.status" allow-clear placeholder="状态" :style="selectWidth" @change="handleFilterChange">
        <a-option value="PUBLISHED">已发布</a-option>
        <a-option value="DRAFT">草稿</a-option>
      </a-select>
      <a-select v-model="filters.featured" allow-clear placeholder="精选" :style="selectWidth" @change="handleFilterChange">
        <a-option value="true">仅看精选</a-option>
        <a-option value="false">仅看普通</a-option>
      </a-select>
      <a-select
        v-if="canViewCategories"
        v-model="filters.categoryId"
        allow-clear
        placeholder="分类"
        :style="selectWidth"
        @change="handleFilterChange"
      >
        <a-option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</a-option>
      </a-select>
      <a-select
        v-if="canViewTags"
        v-model="filters.tagId"
        allow-clear
        placeholder="标签"
        :style="selectWidth"
        @change="handleFilterChange"
      >
        <a-option v-for="item in tags" :key="item.id" :value="item.id">{{ item.name }}</a-option>
      </a-select>
      <a-button @click="resetFilters">重置</a-button>
      <a-button v-if="canCreatePost" type="primary" @click="goCreate">新建文章</a-button>
    </div>

    <a-alert v-if="loadError" type="error" :show-icon="true" class="page-alert">{{ loadError }}</a-alert>

    <a-table :data="posts.items" row-key="id" :pagination="false" :loading="loading">
      <template #empty>
        <div class="table-empty">
          <strong>{{ hasFilters ? '没有匹配的文章' : '暂无文章' }}</strong>
          <span>{{ hasFilters ? '调整筛选条件后再试。' : '新建后会显示在这里。' }}</span>
        </div>
      </template>
      <template #columns>
        <a-table-column title="标题" :width="320">
          <template #cell="{ record }">
            <div class="title-cell">
              <button type="button" class="title-button" @click="handleTitleClick(record.id)">{{ record.title }}</button>
              <p class="title-meta">{{ record.excerpt || '暂无摘要' }}</p>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="分类" :width="120">
          <template #cell="{ record }">{{ record.category?.name || '未分类' }}</template>
        </a-table-column>
        <a-table-column title="状态" :width="100">
          <template #cell="{ record }">
            <a-tag :color="record.status === 'PUBLISHED' ? 'green' : 'gray'">
              {{ record.status === 'PUBLISHED' ? '已发布' : '草稿' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="精选" :width="100">
          <template #cell="{ record }">
            <a-tag :color="record.featured ? 'arcoblue' : 'gray'">
              {{ record.featured ? '精选中' : '普通' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="标签" :width="180">
          <template #cell="{ record }">
            <a-space wrap size="mini">
              <a-tag v-for="tag in getRecordTags(record).slice(0, 3)" :key="tag.id" :color="tag.color">{{ tag.name }}</a-tag>
              <span v-if="getRecordTags(record).length > 3" class="more-tags">+{{ getRecordTags(record).length - 3 }}</span>
            </a-space>
          </template>
        </a-table-column>
        <a-table-column title="创建时间" :width="176">
          <template #cell="{ record }">{{ formatDateTime(record.createdAt) }}</template>
        </a-table-column>
        <a-table-column title="最后更新" :width="176">
          <template #cell="{ record }">{{ formatDateTime(record.updatedAt) }}</template>
        </a-table-column>
        <a-table-column title="浏览量" data-index="views" :width="96" />
        <a-table-column title="快捷操作" :width="360" fixed="right">
          <template #cell="{ record }">
            <a-space wrap>
              <a-button
                v-if="canPublishPost"
                size="mini"
                :status="record.status === 'PUBLISHED' ? 'warning' : 'success'"
                @click="togglePostStatus(record, record.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')"
              >
                {{ record.status === 'PUBLISHED' ? '下线' : '发布' }}
              </a-button>
              <a-button v-if="canFeaturePost" size="mini" @click="toggleFeatured(record)">
                {{ record.featured ? '取消精选' : '设为精选' }}
              </a-button>
              <a-button v-if="canEditPost" size="mini" @click="goEdit(record.id)">编辑</a-button>
              <a-popconfirm v-if="canDeletePost" content="确认删除这篇文章吗？" @ok="removePost(record.id)">
                <a-button size="mini" status="danger">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div class="pagination-wrap">
      <a-pagination
        :current="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :show-total="true"
        :show-page-size="true"
        :page-size-options="[10, 20, 50]"
        @change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import type { CategorySummary, PaginatedResponse, PostSummary, TagSummary } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { categoriesApi, postsApi, tagsApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const loadError = ref('');
const keyword = ref('');
const categories = ref<CategorySummary[]>([]);
const tags = ref<TagSummary[]>([]);
const selectWidth = { width: '140px', minWidth: '140px' };
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const posts = ref<PaginatedResponse<PostSummary>>({
  items: [],
  meta: {
    page: 1,
    pageSize: 10,
    total: 0,
    pageCount: 0,
  },
});

const filters = reactive({
  status: undefined as 'DRAFT' | 'PUBLISHED' | undefined,
  featured: undefined as 'true' | 'false' | undefined,
  categoryId: undefined as string | undefined,
  tagId: undefined as string | undefined,
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const canCreatePost = computed(() => authStore.hasPermission('posts.create'));
const canEditPost = computed(() => authStore.hasPermission('posts.update'));
const canPublishPost = computed(() => authStore.hasPermission('posts.publish'));
const canFeaturePost = computed(() => authStore.hasPermission('posts.feature'));
const canDeletePost = computed(() => authStore.hasPermission('posts.delete'));
const canViewCategories = computed(() => authStore.hasPermission('categories.view'));
const canViewTags = computed(() => authStore.hasPermission('tags.view'));
const hasFilters = computed(() =>
  Boolean(keyword.value || filters.status || filters.featured || filters.categoryId || filters.tagId),
);

async function loadPosts() {
  loading.value = true;
  loadError.value = '';
  try {
    const response = (await postsApi.list({
      keyword: keyword.value || undefined,
      status: filters.status,
      featured: filters.featured,
      categoryId: filters.categoryId,
      tagId: filters.tagId,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })) as PaginatedResponse<PostSummary>;

    posts.value = response;
    pagination.total = response.meta.total;
    pagination.page = response.meta.page;
    pagination.pageSize = response.meta.pageSize;
  } catch (error: any) {
    posts.value = {
      items: [],
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: 0,
        pageCount: 0,
      },
    };
    pagination.total = 0;
    loadError.value = error?.response?.data?.message || '加载文章列表失败';
    Message.error(loadError.value);
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  const tasks: Promise<void>[] = [];

  if (canViewCategories.value) {
    tasks.push(
      categoriesApi
        .list()
        .then((items) => {
          categories.value = items;
        })
        .catch(() => {
          categories.value = [];
        }),
    );
  } else {
    categories.value = [];
    filters.categoryId = undefined;
  }

  if (canViewTags.value) {
    tasks.push(
      tagsApi
        .list()
        .then((items) => {
          tags.value = items;
        })
        .catch(() => {
          tags.value = [];
        }),
    );
  } else {
    tags.value = [];
    filters.tagId = undefined;
  }

  await Promise.all(tasks);
}

function handleSearch() {
  pagination.page = 1;
  void loadPosts();
}

function handleFilterChange() {
  pagination.page = 1;
  void loadPosts();
}

function handlePageChange(page: number) {
  pagination.page = page;
  void loadPosts();
}

function handlePageSizeChange(pageSize: number) {
  pagination.page = 1;
  pagination.pageSize = pageSize;
  void loadPosts();
}

function resetFilters() {
  keyword.value = '';
  filters.status = undefined;
  filters.featured = undefined;
  filters.categoryId = undefined;
  filters.tagId = undefined;
  pagination.page = 1;
  void loadPosts();
}

function goCreate() {
  void router.push('/posts/new');
}

function goEdit(id: string) {
  void router.push(`/posts/${id}/edit`);
}

function handleTitleClick(id: string) {
  if (!canEditPost.value) {
    return;
  }
  goEdit(id);
}

function formatDateTime(value: string) {
  return dateFormatter.format(new Date(value));
}

function getRecordTags(record: Pick<PostSummary, 'tags'>) {
  return Array.isArray(record.tags) ? record.tags : [];
}

async function togglePostStatus(record: PostSummary, status: 'DRAFT' | 'PUBLISHED') {
  try {
    await postsApi.toggleStatus(record.id, status);
    record.status = status;
    record.publishedAt = status === 'PUBLISHED' ? new Date().toISOString() : null;
    Message.success(`${record.title} 已${status === 'PUBLISHED' ? '发布' : '下线'}`);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '更新文章状态失败');
  }
}

async function toggleFeatured(record: PostSummary) {
  try {
    const nextFeatured = !record.featured;
    await postsApi.toggleFeatured(record.id, nextFeatured);
    record.featured = nextFeatured;
    Message.success(`${record.title} 已${nextFeatured ? '设为精选' : '取消精选'}`);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '更新精选状态失败');
  }
}

async function removePost(id: string) {
  try {
    await postsApi.remove(id);
    const nextItems = posts.value.items.filter((item) => item.id !== id);
    const removedCurrentPageLastItem = posts.value.items.length === 1 && pagination.page > 1;

    posts.value.items = nextItems;
    posts.value.meta.total = Math.max(0, posts.value.meta.total - 1);
    pagination.total = Math.max(0, pagination.total - 1);

    Message.success('文章已删除');

    if (removedCurrentPageLastItem) {
      pagination.page -= 1;
      await loadPosts();
    }
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除文章失败');
  }
}

onMounted(async () => {
  await loadOptions();
  await loadPosts();
});
</script>

<style scoped>
.posts-card {
  overflow: hidden;
}

.toolbar {
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;
  margin-bottom: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.toolbar-search {
  width: 280px;
  min-width: 280px;
  flex: none;
}

.toolbar :deep(.arco-select),
.toolbar > .arco-btn,
.toolbar > .arco-btn-group {
  flex: none;
}

.page-alert {
  margin-bottom: 16px;
}

.table-empty {
  display: grid;
  gap: 6px;
  justify-items: center;
  padding: 28px 12px;
  color: var(--admin-text-secondary);
}

.table-empty strong {
  color: var(--admin-text);
}

.title-cell {
  display: grid;
  gap: 6px;
}

.title-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-1);
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.title-button:hover {
  color: rgb(var(--primary-6));
}

.title-meta {
  margin: 0;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}

.more-tags {
  color: var(--color-text-3);
  font-size: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
