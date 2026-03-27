<template>
  <div class="pane">
    <div class="toolbar">
      <a-input-search
        v-model="keywordProxy"
        allow-clear
        class="toolbar-search"
        placeholder="搜索会话"
        @search="$emit('refresh')"
        @clear="$emit('refresh')"
      />
      <a-select v-model="statusFilterProxy" class="toolbar-select" :style="selectWidth" @change="$emit('refresh')">
        <a-option value="all">全部</a-option>
        <a-option value="pending">待处理</a-option>
        <a-option value="approved">已通过</a-option>
      </a-select>
      <a-button @click="$emit('refresh')">刷新</a-button>
    </div>

    <div class="toolbar-meta">
      <a-tag bordered>会话总数 {{ totalCount }}</a-tag>
      <a-tag color="orange" bordered>待处理会话 {{ pendingCount }}</a-tag>
      <a-tag color="arcoblue" bordered>总回复 {{ replyCount }}</a-tag>
    </div>

    <a-alert v-if="loadError" type="error" :show-icon="true" class="page-alert">{{ loadError }}</a-alert>

    <a-table :data="items" row-key="id" :loading="loading" :pagination="{ pageSize: 10 }" class="data-table">
      <template #empty>
        <div class="table-empty">
          <strong>{{ keyword || statusFilter !== 'all' ? '没有匹配的会话' : '暂无会话' }}</strong>
          <span>{{ keyword || statusFilter !== 'all' ? '调整筛选条件后再试。' : '有回复链后会显示在这里。' }}</span>
        </div>
      </template>

      <template #columns>
        <a-table-column title="文章" data-index="postTitle" :width="220" align="center" />
        <a-table-column title="发起评论" :width="320" align="center">
          <template #cell="{ record }">
            <div class="stack-cell">
              <strong>{{ record.rootComment.author }}</strong>
              <span>{{ truncate(record.rootComment.content, 80) }}</span>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="回复数" :width="100" align="center" data-index="totalReplies" />
        <a-table-column title="待处理" :width="100" align="center">
          <template #cell="{ record }">
            <a-tag :color="record.pendingReplies ? 'orange' : 'green'">{{ record.pendingReplies }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="最近活动" :width="180" align="center">
          <template #cell="{ record }">{{ formatDate(record.lastActivityAt) }}</template>
        </a-table-column>
        <a-table-column title="操作" :width="120" align="center">
          <template #cell="{ record }">
            <a-button size="mini" @click="$emit('open-thread', record)">查看会话</a-button>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { CommentConversation, CommentStatusFilter } from '../types';

const props = defineProps<{
  items: CommentConversation[];
  loading: boolean;
  loadError: string;
  keyword: string;
  statusFilter: CommentStatusFilter;
  totalCount: number;
  pendingCount: number;
  replyCount: number;
  selectWidth: { width: string; minWidth: string };
  formatDate: (value: string) => string;
}>();

const emit = defineEmits<{
  'update:keyword': [value: string];
  'update:statusFilter': [value: CommentStatusFilter];
  refresh: [];
  'open-thread': [thread: CommentConversation];
}>();

const keywordProxy = computed({
  get: () => props.keyword,
  set: (value: string) => emit('update:keyword', value),
});

const statusFilterProxy = computed({
  get: () => props.statusFilter,
  set: (value: CommentStatusFilter) => emit('update:statusFilter', value),
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
.toolbar > .arco-btn {
  flex: none;
}

.toolbar :deep(.arco-input-wrapper),
.toolbar :deep(.arco-select-view),
.toolbar > .arco-btn {
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

.stack-cell {
  display: grid;
  gap: 4px;
}

.stack-cell span {
  color: var(--color-text-3);
  font-size: 12px;
}
</style>
