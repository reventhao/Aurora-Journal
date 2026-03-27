<template>
  <a-card :bordered="false" class="page-card">
    <template #title>内容回收站</template>

    <div class="toolbar">
      <a-input-search
        v-model="keyword"
        allow-clear
        :style="searchWidth"
        class="toolbar-search"
        placeholder="搜索标题或摘要"
        @search="loadItems(1)"
        @clear="loadItems(1)"
      />
      <a-select v-model="entityType" class="toolbar-select" :style="typeSelectWidth" @change="loadItems(1)">
        <a-option value="all">全部类型</a-option>
        <a-option value="post">文章</a-option>
        <a-option value="comment">评论</a-option>
        <a-option value="media">媒体</a-option>
        <a-option value="category">分类</a-option>
        <a-option value="tag">标签</a-option>
      </a-select>
      <a-button @click="loadItems(pagination.page)">刷新</a-button>
      <a-button v-if="canRestore" type="primary" :disabled="!selectedRowKeys.length" @click="restoreSelected">
        批量恢复
      </a-button>
      <a-popconfirm
        v-if="canPurge"
        content="确认彻底删除当前选中的记录吗？此操作不可恢复。"
        @ok="purgeSelected"
      >
        <a-button status="danger" :disabled="!selectedRowKeys.length">批量删除</a-button>
      </a-popconfirm>
    </div>

    <div class="toolbar-meta">
      <a-tag bordered>总数 {{ items.meta.total }}</a-tag>
      <a-tag v-if="entityType !== 'all'" :color="typeColorMap[entityType]" bordered>
        {{ typeLabelMap[entityType] }}
      </a-tag>
      <a-tag v-if="selectedRowKeys.length" color="arcoblue" bordered>已选择 {{ selectedRowKeys.length }}</a-tag>
    </div>

    <a-table
      :data="items.items"
      row-key="id"
      :loading="loading"
      :pagination="false"
      :bordered="{ cell: false }"
      class="data-table"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
    >
      <template #columns>
        <a-table-column title="类型" data-index="entityType" :width="110" align="center">
          <template #cell="{ record }">
            <a-tag :color="typeColorMap[record.entityType] || 'gray'" bordered>
              {{ typeLabelMap[record.entityType] || record.entityType }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="对象" :width="320" align="center">
          <template #cell="{ record }">
            <div class="title-cell">
              <strong :title="record.title">{{ record.title }}</strong>
              <span :title="record.summary">{{ record.summary || '-' }}</span>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="关联信息" :width="280" align="center">
          <template #cell="{ record }">
            <div class="meta-cell">
              <template v-if="record.entityType === 'post'">
                <a-tag v-if="record.preview?.category" size="small" bordered color="arcoblue">
                  {{ record.preview.category.name }}
                </a-tag>
                <a-space v-if="record.preview?.tags?.length" wrap size="mini" class="tag-group">
                  <a-tag
                    v-for="tag in record.preview.tags.slice(0, 4)"
                    :key="tag.slug"
                    size="small"
                    :color="tag.color"
                  >
                    {{ tag.name }}
                  </a-tag>
                  <a-tag v-if="(record.preview.tags?.length || 0) > 4" size="small" color="gray">
                    +{{ (record.preview.tags?.length || 0) - 4 }}
                  </a-tag>
                </a-space>
                <span v-else-if="!record.preview?.category">-</span>
              </template>

              <template v-else-if="record.entityType === 'comment'">
                <a-tag v-if="record.preview?.postTitle" size="small" bordered color="orange">
                  {{ record.preview.postTitle }}
                </a-tag>
                <span v-else>-</span>
              </template>

              <template v-else-if="record.entityType === 'media'">
                <a-tag v-if="record.preview?.folderName" size="small" bordered color="green">
                  {{ record.preview.folderName }}
                </a-tag>
                <span v-else>-</span>
              </template>

              <template v-else-if="record.entityType === 'category' || record.entityType === 'tag'">
                <a-space size="mini" wrap class="tag-group">
                  <a-tag size="small" bordered :color="record.preview?.visible ? 'green' : 'gray'">
                    {{ record.preview?.visible ? '显示中' : '已隐藏' }}
                  </a-tag>
                  <a-tag size="small" bordered>
                    关联 {{ record.preview?.postCount || 0 }} 篇文章
                  </a-tag>
                  <a-tag v-if="record.entityType === 'tag' && record.preview?.color" size="small" :color="record.preview.color">
                    {{ record.preview.color }}
                  </a-tag>
                </a-space>
              </template>

              <template v-else>
                <span>-</span>
              </template>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="预览" :width="140" align="center">
          <template #cell="{ record }">
            <a-button size="mini" :disabled="!canPreview(record)" @click="openPreview(record)">预览</a-button>
          </template>
        </a-table-column>

        <a-table-column title="删除人" data-index="deletedByName" :width="140" align="center">
          <template #cell="{ record }">{{ record.deletedByName || '系统' }}</template>
        </a-table-column>

        <a-table-column title="删除时间" :width="176" align="center">
          <template #cell="{ record }">{{ formatDate(record.deletedAt) }}</template>
        </a-table-column>

        <a-table-column title="操作" :width="200" align="center">
          <template #cell="{ record }">
            <a-space>
              <a-button v-if="canRestore" size="mini" type="primary" @click="restoreItem(record.id)">恢复</a-button>
              <a-popconfirm v-if="canPurge" content="确认彻底删除这条记录吗？" @ok="purgeItem(record.id)">
                <a-button size="mini" status="danger">彻底删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div class="pagination-wrap" v-if="items.meta.total > 0">
      <a-pagination
        :current="items.meta.page"
        :page-size="items.meta.pageSize"
        :total="items.meta.total"
        show-total
        @change="loadItems"
      />
    </div>
  </a-card>

  <a-modal
    v-model:visible="previewVisible"
    :title="previewRecord?.title || '内容预览'"
    width="720px"
    :footer="false"
    unmount-on-close
  >
    <div v-if="previewRecord" class="preview-panel">
      <template v-if="previewRecord.entityType === 'post'">
        <div v-if="previewRecord.preview?.coverImage" class="preview-cover">
          <img :src="previewRecord.preview.coverImage" :alt="previewRecord.title" />
        </div>
        <div class="preview-copy">
          <div class="preview-tags">
            <a-tag v-if="previewRecord.preview?.category" color="arcoblue" bordered>
              {{ previewRecord.preview.category.name }}
            </a-tag>
            <a-tag
              v-for="tag in previewRecord.preview?.tags || []"
              :key="tag.slug"
              size="small"
              :color="tag.color"
            >
              {{ tag.name }}
            </a-tag>
          </div>
          <p>{{ previewRecord.preview?.excerpt || previewRecord.summary || '暂无摘要' }}</p>
        </div>
      </template>

      <template v-else-if="previewRecord.entityType === 'media'">
        <div class="preview-cover preview-cover-media">
          <img :src="previewRecord.preview?.thumbUrl || previewRecord.preview?.url" :alt="previewRecord.title" />
        </div>
        <div class="preview-copy">
          <p>{{ previewRecord.summary }}</p>
          <div class="preview-tags">
            <a-tag v-if="previewRecord.preview?.folderName" bordered>{{ previewRecord.preview.folderName }}</a-tag>
            <a-tag v-if="previewRecord.preview?.mimeType" bordered color="green">{{ previewRecord.preview.mimeType }}</a-tag>
          </div>
          <a-button v-if="previewRecord.preview?.url" size="mini" @click="openExternal(previewRecord.preview.url)">
            打开原图
          </a-button>
        </div>
      </template>

      <template v-else-if="previewRecord.entityType === 'comment'">
        <div class="preview-copy">
          <div class="preview-tags">
            <a-tag bordered color="orange">{{ previewRecord.preview?.author || '评论' }}</a-tag>
            <a-tag v-if="previewRecord.preview?.postTitle" bordered>{{ previewRecord.preview.postTitle }}</a-tag>
          </div>
          <p>{{ previewRecord.preview?.content || previewRecord.summary }}</p>
        </div>
      </template>

      <template v-else-if="previewRecord.entityType === 'category'">
        <div class="preview-copy">
          <div class="preview-tags">
            <a-tag :color="previewRecord.preview?.visible ? 'green' : 'gray'" bordered>
              {{ previewRecord.preview?.visible ? '显示中' : '已隐藏' }}
            </a-tag>
            <a-tag bordered>关联 {{ previewRecord.preview?.postCount || 0 }} 篇文章</a-tag>
          </div>
          <p>{{ previewRecord.preview?.description || '暂无分类说明' }}</p>
        </div>
      </template>

      <template v-else-if="previewRecord.entityType === 'tag'">
        <div class="preview-copy">
          <div class="preview-tags">
            <a-tag :color="previewRecord.preview?.visible ? 'green' : 'gray'" bordered>
              {{ previewRecord.preview?.visible ? '显示中' : '已隐藏' }}
            </a-tag>
            <a-tag bordered>关联 {{ previewRecord.preview?.postCount || 0 }} 篇文章</a-tag>
            <a-tag v-if="previewRecord.preview?.color" :color="previewRecord.preview.color">
              {{ previewRecord.preview.color }}
            </a-tag>
          </div>
          <p>该标签删除前已关联 {{ previewRecord.preview?.postCount || 0 }} 篇文章。</p>
        </div>
      </template>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import type { PaginatedResponse, RecycleBinItem } from '@aurora/shared';
import { PERMISSIONS } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, ref } from 'vue';

import { recycleBinApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';

type EntityFilter = 'all' | 'post' | 'comment' | 'media' | 'category' | 'tag';

const authStore = useAuthStore();
const loading = ref(false);
const keyword = ref('');
const entityType = ref<EntityFilter>('all');
const previewVisible = ref(false);
const previewRecord = ref<RecycleBinItem | null>(null);
const selectedRowKeys = ref<string[]>([]);

const searchWidth = { width: '240px', minWidth: '240px' };
const typeSelectWidth = { width: '124px', minWidth: '124px' };

const items = ref<PaginatedResponse<RecycleBinItem>>({
  items: [],
  meta: { page: 1, pageSize: 12, total: 0, pageCount: 0 },
});

const canRestore = computed(() => authStore.hasPermission(PERMISSIONS.RECYCLE_BIN_RESTORE));
const canPurge = computed(() => authStore.hasPermission(PERMISSIONS.RECYCLE_BIN_PURGE));
const canSelectRows = computed(() => canRestore.value || canPurge.value);
const pagination = computed(() => items.value.meta);

const typeLabelMap: Record<string, string> = {
  post: '文章',
  comment: '评论',
  media: '媒体',
  category: '分类',
  tag: '标签',
};

const typeColorMap: Record<string, string> = {
  post: 'arcoblue',
  comment: 'orange',
  media: 'green',
  category: 'purple',
  tag: 'magenta',
};

const rowSelection = computed(() =>
  canSelectRows.value
    ? {
        type: 'checkbox' as const,
        showCheckedAll: true,
      }
    : undefined,
);

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function clearSelection() {
  selectedRowKeys.value = [];
}

function canPreview(record: RecycleBinItem) {
  if (record.entityType === 'post') {
    return Boolean(record.preview?.coverImage || record.preview?.excerpt);
  }
  if (record.entityType === 'media') {
    return Boolean(record.preview?.thumbUrl || record.preview?.url);
  }
  if (record.entityType === 'comment') {
    return Boolean(record.preview?.content);
  }
  if (record.entityType === 'category') {
    return Boolean(record.preview);
  }
  if (record.entityType === 'tag') {
    return Boolean(record.preview);
  }
  return false;
}

function openPreview(record: RecycleBinItem) {
  if (!canPreview(record)) return;
  previewRecord.value = record;
  previewVisible.value = true;
}

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function loadItems(page = 1) {
  loading.value = true;
  try {
    items.value = await recycleBinApi.list({
      page,
      pageSize: items.value.meta.pageSize,
      keyword: keyword.value.trim() || undefined,
      entityType: entityType.value === 'all' ? undefined : entityType.value,
    });
    clearSelection();
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '加载回收站失败');
  } finally {
    loading.value = false;
  }
}

async function restoreItem(id: string) {
  try {
    await recycleBinApi.restore(id);
    Message.success('内容已恢复');
    await loadItems(items.value.items.length === 1 && items.value.meta.page > 1 ? items.value.meta.page - 1 : items.value.meta.page);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '恢复失败');
  }
}

async function purgeItem(id: string) {
  try {
    await recycleBinApi.purge(id);
    Message.success('记录已彻底删除');
    await loadItems(items.value.items.length === 1 && items.value.meta.page > 1 ? items.value.meta.page - 1 : items.value.meta.page);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除失败');
  }
}

async function restoreSelected() {
  if (!selectedRowKeys.value.length) return;

  try {
    await recycleBinApi.restoreMany(selectedRowKeys.value);
    Message.success(`已恢复 ${selectedRowKeys.value.length} 条记录`);
    await loadItems(1);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '批量恢复失败');
  }
}

async function purgeSelected() {
  if (!selectedRowKeys.value.length) return;

  try {
    await recycleBinApi.purgeMany(selectedRowKeys.value);
    Message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
    await loadItems(1);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '批量删除失败');
  }
}

onMounted(() => {
  void loadItems();
});
</script>

<style scoped>
.page-card {
  overflow: hidden;
}

.toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.toolbar-search,
.toolbar-select {
  flex: none;
}

.toolbar :deep(.arco-input-wrapper),
.toolbar :deep(.arco-select-view),
.toolbar > .arco-btn,
.toolbar :deep(.arco-popconfirm-popup-trigger) {
  white-space: nowrap;
  flex: none;
}

.toolbar-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  min-height: 28px;
}

.title-cell {
  display: grid;
  gap: 4px;
}

.title-cell strong,
.title-cell span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-cell strong {
  color: var(--color-text-1);
}

.title-cell span {
  color: var(--color-text-3);
  font-size: 12px;
}

.meta-cell {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.tag-group {
  justify-content: center;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.preview-panel {
  display: grid;
  gap: 14px;
}

.preview-cover {
  overflow: hidden;
  border-radius: 16px;
  background: var(--color-fill-2);
}

.preview-cover img {
  display: block;
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.preview-cover-media img {
  object-fit: contain;
  background: rgb(15 23 42 / 0.08);
}

.preview-copy {
  display: grid;
  gap: 10px;
}

.preview-copy p {
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.7;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
