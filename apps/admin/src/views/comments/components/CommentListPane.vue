<template>
  <div class="pane">
    <div class="toolbar">
      <a-input-search v-model="keywordProxy" allow-clear placeholder="搜索评论" class="toolbar-search" />
      <a-select v-model="statusFilterProxy" class="toolbar-select" :style="selectWidth">
        <a-option value="all">全部</a-option>
        <a-option value="pending">待审核</a-option>
        <a-option value="approved">已通过</a-option>
      </a-select>
      <a-button v-if="canModerateComments" @click="$emit('open-rules')">审核规则</a-button>
      <a-button
        v-if="canModerateComments"
        type="primary"
        status="success"
        :loading="reviewLoading"
        :disabled="!selectedKeys.length || reviewLoading || deleteLoading"
        @click="$emit('batch-review', true)"
      >
        批量通过
      </a-button>
      <a-button
        v-if="canModerateComments"
        status="warning"
        :loading="reviewLoading"
        :disabled="!selectedKeys.length || reviewLoading || deleteLoading"
        @click="$emit('batch-review', false)"
      >
        批量驳回
      </a-button>
      <a-popconfirm
        v-if="canDeleteComments"
        content="确认删除选中的评论吗？若包含主评论，其回复也会一并删除。"
        @ok="$emit('batch-remove')"
      >
        <a-button status="danger" :loading="deleteLoading" :disabled="!selectedKeys.length || reviewLoading || deleteLoading">
          批量删除
        </a-button>
      </a-popconfirm>
    </div>

    <div class="toolbar-meta">
      <a-tag bordered>评论总数 {{ totalCount }}</a-tag>
      <a-tag color="orange" bordered>待审核 {{ pendingCount }}</a-tag>
      <a-tag color="arcoblue" bordered>回复数 {{ replyCount }}</a-tag>
      <a-tag v-if="selectedKeys.length" color="purple" bordered>已选择 {{ selectedKeys.length }}</a-tag>
    </div>

    <a-alert v-if="loadError" type="error" :show-icon="true" class="page-alert">{{ loadError }}</a-alert>

    <a-table
      :data="items"
      row-key="id"
      :pagination="{ pageSize: 20 }"
      :default-expand-all-rows="true"
      :row-selection="rowSelection"
      :loading="loading"
      v-model:selectedKeys="selectedKeysProxy"
    >
      <template #empty>
        <div class="table-empty">
          <strong>{{ keyword || statusFilter !== 'all' ? '没有匹配的评论' : '暂无评论' }}</strong>
          <span>{{ keyword || statusFilter !== 'all' ? '调整筛选条件后再试。' : '有用户留言后会显示在这里。' }}</span>
        </div>
      </template>

      <template #columns>
        <a-table-column title="作者" :width="240">
          <template #cell="{ record }">
            <a-space direction="vertical" :size="4">
              <a-space>
                <strong>{{ record.author }}</strong>
                <a-badge v-if="record.hasPendingInTree" dot color="#f53f3f" />
                <a-tag size="small" :color="record.parentId ? 'arcoblue' : 'purple'">
                  {{ record.parentId ? '回复' : '主评论' }}
                </a-tag>
              </a-space>
              <span class="author-email">{{ record.email }}</span>
            </a-space>
          </template>
        </a-table-column>

        <a-table-column title="内容">
          <template #cell="{ record }">
            <a-space direction="vertical" :size="6" fill>
              <div class="comment-content">{{ record.content }}</div>
              <div v-if="record.parent" class="reply-reference">
                回复 {{ record.parent.author }}：{{ truncate(record.parent.content) }}
              </div>
            </a-space>
          </template>
        </a-table-column>

        <a-table-column title="文章" :width="220">
          <template #cell="{ record }">
            {{ record.post?.title || '-' }}
          </template>
        </a-table-column>

        <a-table-column title="状态" :width="120" align="center">
          <template #cell="{ record }">
            <a-tag :color="record.approved ? 'green' : 'orange'">
              {{ record.approved ? '已通过' : '待审核' }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="时间" :width="180" align="center">
          <template #cell="{ record }">
            {{ formatDate(record.createdAt) }}
          </template>
        </a-table-column>

        <a-table-column title="操作" :width="250" fixed="right" align="center">
          <template #cell="{ record }">
            <a-space wrap>
              <a-button
                v-if="canModerateComments"
                size="mini"
                status="success"
                :disabled="record.approved"
                @click="$emit('review', record, true)"
              >
                通过
              </a-button>
              <a-button
                v-if="canModerateComments"
                size="mini"
                status="warning"
                :disabled="!record.approved"
                @click="$emit('review', record, false)"
              >
                驳回
              </a-button>
              <a-popconfirm v-if="canDeleteComments" content="确认删除这条评论吗？" @ok="$emit('remove', record.id)">
                <a-button size="mini" status="danger">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { CommentRecord, CommentStatusFilter } from '../types';

const props = defineProps<{
  items: CommentRecord[];
  loading: boolean;
  loadError: string;
  keyword: string;
  statusFilter: CommentStatusFilter;
  selectedKeys: string[];
  reviewLoading: boolean;
  deleteLoading: boolean;
  canModerateComments: boolean;
  canDeleteComments: boolean;
  rowSelection?: Record<string, unknown>;
  totalCount: number;
  pendingCount: number;
  replyCount: number;
  selectWidth: { width: string; minWidth: string };
  formatDate: (value: string) => string;
}>();

const emit = defineEmits<{
  'update:keyword': [value: string];
  'update:statusFilter': [value: CommentStatusFilter];
  'update:selectedKeys': [value: string[]];
  'open-rules': [];
  'batch-review': [approved: boolean];
  'batch-remove': [];
  review: [record: CommentRecord, approved: boolean];
  remove: [id: string];
}>();

const keywordProxy = computed({
  get: () => props.keyword,
  set: (value: string) => emit('update:keyword', value),
});

const statusFilterProxy = computed({
  get: () => props.statusFilter,
  set: (value: CommentStatusFilter) => emit('update:statusFilter', value),
});

const selectedKeysProxy = computed({
  get: () => props.selectedKeys,
  set: (value: string[]) => emit('update:selectedKeys', value),
});

function truncate(value: string, max = 80) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}
</script>

<style scoped>
.pane {
  display: grid;
  gap: 0;
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
  width: 240px;
  min-width: 240px;
  flex: none;
}

.toolbar-select {
  width: 104px;
  min-width: 104px;
  flex: none;
}

.toolbar :deep(.arco-select),
.toolbar > .arco-btn,
.toolbar :deep(.arco-popconfirm-popup-trigger) {
  flex: none;
}

.toolbar :deep(.arco-input-wrapper),
.toolbar :deep(.arco-select-view),
.toolbar > .arco-btn,
.toolbar :deep(.arco-popconfirm-popup-trigger) {
  white-space: nowrap;
}

.toolbar-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
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

.author-email {
  color: var(--color-text-3);
  font-size: 12px;
}

.comment-content {
  white-space: pre-wrap;
  line-height: 1.7;
}

.reply-reference {
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--color-fill-2);
  color: var(--color-text-3);
  font-size: 12px;
}
</style>
