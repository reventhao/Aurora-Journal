<template>
  <a-card :bordered="false" class="page-card">
    <template #title>配置版本</template>

    <div class="toolbar">
      <a-select v-model="settingKey" class="toolbar-select" :style="selectWidth" @change="loadVersions(1)">
        <a-option value="site">站点</a-option>
        <a-option value="comment-moderation-rules">评论</a-option>
      </a-select>
      <a-button @click="loadVersions(versions.meta.page)">刷新</a-button>
    </div>

    <a-table :data="versions.items" row-key="id" :loading="loading" :pagination="false" class="data-table">
      <template #columns>
        <a-table-column title="配置项" :width="160" align="center">
          <template #cell="{ record }">{{ keyLabelMap[record.settingKey] || record.settingKey }}</template>
        </a-table-column>
        <a-table-column title="变更摘要" data-index="summary" align="center" />
        <a-table-column title="操作人" :width="140" align="center">
          <template #cell="{ record }">{{ record.createdByName || '系统' }}</template>
        </a-table-column>
        <a-table-column title="时间" :width="180" align="center">
          <template #cell="{ record }">{{ formatDate(record.createdAt) }}</template>
        </a-table-column>
        <a-table-column title="操作" :width="220" align="center">
          <template #cell="{ record }">
            <a-space>
              <a-button size="mini" @click="openDetail(record)">详情</a-button>
              <a-button v-if="canRestore" size="mini" type="primary" @click="restoreVersion(record.id)">恢复</a-button>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div class="pagination-wrap" v-if="versions.meta.total > 0">
      <a-pagination
        :current="versions.meta.page"
        :page-size="versions.meta.pageSize"
        :total="versions.meta.total"
        show-total
        @change="loadVersions"
      />
    </div>
  </a-card>

  <a-drawer v-model:visible="detailVisible" title="版本详情" width="680px" :footer="false">
    <div v-if="currentVersion" class="version-detail">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="配置项">{{ keyLabelMap[currentVersion.settingKey] || currentVersion.settingKey }}</a-descriptions-item>
        <a-descriptions-item label="变更摘要">{{ currentVersion.summary }}</a-descriptions-item>
        <a-descriptions-item label="操作人">{{ currentVersion.createdByName || '系统' }}</a-descriptions-item>
        <a-descriptions-item label="时间">{{ formatDate(currentVersion.createdAt) }}</a-descriptions-item>
      </a-descriptions>
      <pre>{{ JSON.stringify(currentVersion.valuePreview, null, 2) }}</pre>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import type { PaginatedResponse, SettingVersionEntry } from '@aurora/shared';
import { PERMISSIONS } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, ref } from 'vue';

import { settingsApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const detailVisible = ref(false);
const currentVersion = ref<SettingVersionEntry | null>(null);
const settingKey = ref<'site' | 'comment-moderation-rules'>('site');
const selectWidth = { width: '96px', minWidth: '96px' };
const versions = ref<PaginatedResponse<SettingVersionEntry>>({
  items: [],
  meta: { page: 1, pageSize: 12, total: 0, pageCount: 0 },
});

const keyLabelMap: Record<string, string> = {
  site: '站点设置',
  'comment-moderation-rules': '评论审核规则',
};

const canRestore = computed(() => authStore.hasPermission(PERMISSIONS.SETTINGS_VERSIONS_RESTORE));

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

async function loadVersions(page = 1) {
  loading.value = true;
  try {
    versions.value = await settingsApi.versions({
      page,
      pageSize: versions.value.meta.pageSize,
      settingKey: settingKey.value,
    });
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '加载配置版本失败');
  } finally {
    loading.value = false;
  }
}

function openDetail(record: SettingVersionEntry) {
  currentVersion.value = record;
  detailVisible.value = true;
}

async function restoreVersion(id: string) {
  try {
    await settingsApi.restoreVersion(id);
    Message.success('配置已恢复');
    await loadVersions(1);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '恢复配置失败');
  }
}

onMounted(() => {
  void loadVersions();
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
  margin-bottom: 16px;
  overflow: hidden;
}

.toolbar-select {
  flex: none;
}

.toolbar :deep(.arco-select-view),
.toolbar > .arco-btn {
  white-space: nowrap;
}

.toolbar :deep(.arco-select),
.toolbar > .arco-btn {
  flex: none;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.version-detail {
  display: grid;
  gap: 16px;
}

.version-detail pre {
  margin: 0;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--color-fill-2);
  overflow: auto;
}
</style>
