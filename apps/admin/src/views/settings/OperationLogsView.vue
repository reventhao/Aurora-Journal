<template>
  <a-card :bordered="false" class="logs-card">
    <template #title>操作日志</template>

    <div class="toolbar">
      <a-input-search
        v-model="keyword"
        allow-clear
        placeholder="搜索动作、对象或操作人"
        class="toolbar-search"
        @search="loadLogs(1)"
        @clear="loadLogs(1)"
      />
      <a-button @click="loadLogs(logs.meta.page)">刷新</a-button>
    </div>

    <a-table :data="logs.items" row-key="id" :pagination="false" :loading="loading" :bordered="false" class="logs-table">
      <template #empty>
        <a-empty description="暂无操作日志" />
      </template>

      <template #columns>
        <a-table-column title="时间" :width="180">
          <template #cell="{ record }">
            <div class="time-cell">
              <strong>{{ formatDate(record.createdAt) }}</strong>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="对象" :width="100">
          <template #cell="{ record }">
            <div class="type-cell">
              <a-tag size="small" :color="getTargetTagColor(record.targetType)">{{ getTargetTypeLabel(record.targetType) }}</a-tag>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="动作" :width="220">
          <template #cell="{ record }">
            <div class="action-cell">
              <a-button type="text" class="action-link" @click="openDetail(record)">
                {{ getActionLabel(record.action) }}
              </a-button>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="对象名" :width="320">
          <template #cell="{ record }">
            <div class="basic-cell basic-cell--target">
              <strong :title="record.targetLabel || '-'">{{ record.targetLabel || '-' }}</strong>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="对象ID" :width="260">
          <template #cell="{ record }">
            <div class="basic-cell basic-cell--id">
              <span>{{ record.targetId || '-' }}</span>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="操作人" :width="160">
          <template #cell="{ record }">
            <div class="basic-cell">
              <strong>{{ record.actorName || '系统' }}</strong>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="摘要">
          <template #cell="{ record }">
            <div class="summary-cell">
              <div v-if="getDetailHighlights(record).length" class="detail-summary">
                <a-tag v-for="item in getDetailHighlights(record)" :key="item" size="small">{{ item }}</a-tag>
              </div>
              <span v-else>无附加信息</span>
            </div>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div class="pagination-wrap" v-if="logs.meta.total > 0">
      <a-pagination :current="logs.meta.page" :page-size="logs.meta.pageSize" :total="logs.meta.total" :show-total="true" @change="loadLogs" />
    </div>

    <a-modal v-model:visible="detailVisible" title="操作详情" width="760px" :footer="false">
      <div v-if="currentRecord" class="expanded-panel">
        <section class="detail-panel">
          <strong>动作说明</strong>
          <p>{{ getActionLabel(currentRecord.action) }}</p>
          <p>{{ getActionSentence(currentRecord) }}</p>
          <p v-if="getDetailNarrative(currentRecord)">{{ getDetailNarrative(currentRecord) }}</p>
          <p v-else>这次操作没有额外说明。</p>
        </section>

        <section class="detail-panel">
          <strong>原始详情</strong>
          <pre>{{ formatDetailPretty(currentRecord.detail) }}</pre>
        </section>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import type { OperationLogEntry, PaginatedResponse } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { onMounted, ref } from 'vue';

import { operationLogsApi } from '../../api/modules';

const keyword = ref('');
const loading = ref(false);
const detailVisible = ref(false);
const currentRecord = ref<OperationLogEntry | null>(null);
const logs = ref<PaginatedResponse<OperationLogEntry>>({
  items: [],
  meta: { page: 1, pageSize: 20, total: 0, pageCount: 0 },
});

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const actionLabelMap: Record<string, string> = {
  'posts.create': '创建文章',
  'posts.update': '更新文章',
  'posts.toggleStatus': '修改发布状态',
  'posts.toggleFeatured': '调整精选状态',
  'posts.restoreRevision': '恢复修订版本',
  'posts.remove': '删除文章',
  'comments.updateRules': '更新评论审核规则',
  'comments.update': '修改评论',
  'comments.approve': '通过评论',
  'comments.reject': '驳回评论',
  'comments.remove': '删除评论',
  'settings.updateSite': '更新站点设置',
  'settings.restoreVersion': '恢复配置版本',
  'media.createFolder': '新建文件夹',
  'media.updateFolder': '修改文件夹',
  'media.removeFolder': '删除文件夹',
  'media.upload': '上传媒体',
  'media.importExternal': '导入外部媒体',
  'media.updateMeta': '更新媒体信息',
  'media.remove': '删除媒体',
  'recycleBin.archivePost': '移入回收站（文章）',
  'recycleBin.archiveComment': '移入回收站（评论）',
  'recycleBin.archiveMedia': '移入回收站（媒体）',
  'recycleBin.restore': '从回收站恢复',
  'recycleBin.purge': '从回收站彻底删除',
};

const targetTypeLabelMap: Record<string, string> = {
  post: '文章',
  comment: '评论',
  media: '媒体',
  setting: '配置',
};

async function loadLogs(page = 1) {
  loading.value = true;
  try {
    logs.value = await operationLogsApi.list({
      page,
      pageSize: logs.value.meta.pageSize,
      keyword: keyword.value.trim() || undefined,
    });
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '加载操作日志失败');
  } finally {
    loading.value = false;
  }
}

function openDetail(record: OperationLogEntry) {
  currentRecord.value = record;
  detailVisible.value = true;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function getActionLabel(action: string) {
  return actionLabelMap[action] || action;
}

function getTargetTypeLabel(type: string) {
  return targetTypeLabelMap[type] || type;
}

function getTargetTagColor(type: string) {
  if (type === 'post') return 'arcoblue';
  if (type === 'comment') return 'orange';
  if (type === 'media') return 'green';
  if (type === 'setting') return 'purple';
  return 'gray';
}

function getActionSentence(record: OperationLogEntry) {
  const actor = record.actorName || '系统';
  const target = record.targetLabel || getTargetTypeLabel(record.targetType);
  return `${actor}对 ${target} 执行了“${getActionLabel(record.action)}”操作。`;
}

function getStatusLabel(status: string) {
  if (status === 'PUBLISHED') return '发布';
  if (status === 'DRAFT') return '草稿';
  return status;
}

function getDetailHighlights(record: OperationLogEntry) {
  const detail = record.detail || {};
  const result: string[] = [];

  if (typeof detail.status === 'string') result.push(`状态：${getStatusLabel(detail.status)}`);
  if (typeof detail.featured === 'boolean') result.push(detail.featured ? '已设为精选' : '已取消精选');
  if (typeof detail.approved === 'boolean') result.push(detail.approved ? '审核结果：通过' : '审核结果：驳回');
  if (typeof detail.groupName === 'string' && detail.groupName) result.push(`分组：${detail.groupName}`);
  if (typeof detail.provider === 'string' && detail.provider) result.push(`来源：${detail.provider}`);
  if (typeof detail.heroTitle === 'string' && detail.heroTitle) result.push(`首页标题：${detail.heroTitle}`);
  if (Array.isArray(detail.tags) && detail.tags.length) result.push(`标签数：${detail.tags.length}`);
  if (Array.isArray(detail.homeSections) && detail.homeSections.length) result.push(`首页模块：${detail.homeSections.length} 个`);

  return result;
}

function getDetailNarrative(record: OperationLogEntry) {
  const detail = record.detail || {};
  const fragments: string[] = [];

  if (typeof detail.reason === 'string' && detail.reason) fragments.push(`补充说明：“${detail.reason}”`);
  if (typeof detail.provider === 'string' && detail.provider) fragments.push(`媒体来源为 ${detail.provider}`);
  if (typeof detail.groupName === 'string' && detail.groupName) fragments.push(`分组已调整为 ${detail.groupName}`);
  if (typeof detail.heroTitle === 'string' && detail.heroTitle) fragments.push(`首页标题已更新为“${detail.heroTitle}”`);

  return fragments.length ? `${fragments.join('，')}。` : '';
}

function formatDetailPretty(detail?: Record<string, unknown> | null) {
  if (!detail || !Object.keys(detail).length) return '-';
  return JSON.stringify(detail, null, 2);
}

onMounted(() => {
  void loadLogs();
});
</script>

<style scoped>
.logs-card {
  overflow: hidden;
}

.toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.toolbar-search {
  width: 220px;
  min-width: 220px;
  flex: none;
}

.toolbar :deep(.arco-input-wrapper),
.toolbar > .arco-btn {
  white-space: nowrap;
}

.toolbar > .arco-btn {
  flex: none;
}

.logs-table :deep(.arco-table-th),
.logs-table :deep(.arco-table-td) {
  text-align: center;
  vertical-align: middle;
}

.logs-table :deep(.arco-table-th .arco-table-cell) {
  justify-content: center;
  text-align: center;
}

.logs-table :deep(.arco-table-th-item-title) {
  width: 100%;
  text-align: center;
}

.time-cell,
.basic-cell,
.type-cell,
.action-cell,
.summary-cell {
  display: grid;
  gap: 6px;
  justify-items: center;
  align-content: center;
}

.type-cell :deep(.arco-tag) {
  margin: 0 auto;
}

.time-cell strong,
.basic-cell strong,
.action-cell strong {
  font-size: 13px;
}

.basic-cell span,
.summary-cell span {
  color: var(--admin-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.time-cell strong,
.basic-cell strong,
.basic-cell span,
.action-link,
.summary-cell span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.basic-cell--target strong {
  max-width: 260px;
}

.action-link {
  padding: 0;
  justify-content: flex-start;
  font-weight: 600;
}

.action-link :deep(span) {
  text-align: center;
}

.action-cell :deep(.arco-btn) {
  justify-content: center;
}

.basic-cell--id span {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

.detail-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.expanded-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 8px 0;
}

.detail-panel {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: var(--color-fill-1);
  border: 1px solid var(--color-neutral-3);
}

.detail-panel p,
.detail-panel pre {
  margin: 0;
  color: var(--admin-text-secondary);
  line-height: 1.7;
}

.detail-panel pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 900px) {
  .toolbar {
    flex-direction: column;
  }

  .toolbar-search {
    width: 100%;
  }

  .expanded-panel {
    grid-template-columns: 1fr;
  }
}
</style>
