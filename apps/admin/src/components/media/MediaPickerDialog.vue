<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="min(1180px, calc(100vw - 32px))"
    :footer="false"
    unmount-on-close
    @update:visible="handleVisibleChange"
  >
    <div class="media-picker-dialog">
      <a-tabs :active-key="activeTab" @change="handleTabChange">
        <a-tab-pane key="library" title="本地媒体">
          <div class="picker-toolbar">
            <div class="picker-toolbar__left">
              <a-select
                v-model="folderId"
                allow-clear
                class="picker-folder-select"
                placeholder="全部文件夹"
                @change="handleFolderChange"
              >
                <a-option value="">全部文件夹</a-option>
                <a-option v-for="folder in folders" :key="folder.id" :value="folder.id">
                  {{ folder.name }}
                </a-option>
              </a-select>
            </div>

            <div class="picker-toolbar__right">
              <a-upload v-if="allowUpload" :auto-upload="false" :show-file-list="false" @change="handleQuickUpload">
                <template #upload-button>
                  <a-button type="primary">{{ uploadButtonText }}</a-button>
                </template>
              </a-upload>
              <a-button :loading="libraryLoading" @click="loadMedia(media.meta.page || 1)">刷新</a-button>
            </div>
          </div>

          <div v-if="media.items.length" class="picker-grid" :style="gridStyle">
            <a-card
              v-for="item in media.items"
              :key="item.id"
              class="picker-card"
              :class="{ 'picker-card--active': isSelected(item) }"
              :bordered="false"
            >
              <button type="button" class="picker-card__trigger" @click="handleLocalSelect(item)">
                <div class="picker-card__media">
                  <img
                    v-if="item.thumbUrl || item.url"
                    :src="item.thumbUrl || item.url"
                    :alt="item.fileName"
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-else class="picker-card__placeholder">无缩略图</span>
                </div>
              </button>
              <div class="picker-card__meta">
                <span class="picker-card__title">{{ item.fileName }}</span>
                <small>{{ item.groupName || '未分组' }} · {{ formatMediaSize(item.size) }}</small>
              </div>
            </a-card>
          </div>
          <a-empty v-else class="picker-empty" description="当前没有可选媒体" />

          <div class="picker-footer" v-if="media.meta.total > 0">
            <a-pagination
              :current="media.meta.page"
              :page-size="media.meta.pageSize"
              :total="media.meta.total"
              :show-total="true"
              @change="handleMediaPageChange"
            />
          </div>
        </a-tab-pane>

        <a-tab-pane v-if="allowExternal" key="external" title="Pexels 图库">
          <div class="picker-search">
            <a-input-search
              v-model="searchKeyword"
              allow-clear
              search-button
              placeholder="搜索图片，例如 workspace、technology、coffee"
              @search="handleSearchExternalMedia"
              @clear="handleSearchExternalMedia"
            />
          </div>

          <div v-if="externalMedia.items.length" class="picker-grid" :style="gridStyle">
            <a-card
              v-for="item in externalMedia.items"
              :key="item.id"
              class="picker-card picker-card--external"
              :bordered="false"
            >
              <button type="button" class="picker-card__trigger" @click="handleExternalSelect(item)">
                <div class="picker-card__media">
                  <img :src="item.previewUrl || item.thumbUrl || item.url" :alt="item.title || item.fileName" loading="lazy" decoding="async" />
                </div>
              </button>
              <div class="picker-card__meta">
                <span class="picker-card__title">{{ item.title || item.fileName }}</span>
                <small>{{ item.photographer }} · {{ item.width }} × {{ item.height }}</small>
              </div>
              <a-button type="primary" size="small" :loading="importingId === item.id" @click="handleExternalSelect(item)">
                导入并选择
              </a-button>
            </a-card>
          </div>
          <a-empty v-else class="picker-empty" description="没有找到匹配图片" />

          <div class="picker-footer" v-if="externalMedia.meta.total > 0">
            <a-pagination
              :current="externalMedia.meta.page"
              :page-size="externalMedia.meta.pageSize"
              :total="externalMedia.meta.total"
              :show-total="true"
              @change="handleExternalMediaPageChange"
            />
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import type { ExternalMediaItem, MediaFolderSummary, MediaItem, PaginatedResponse } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { computed, ref, watch } from 'vue';

import { mediaApi } from '../../api/modules';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    selectedUrl?: string;
    allowUpload?: boolean;
    allowExternal?: boolean;
    aspectRatio?: string;
    uploadButtonText?: string;
  }>(),
  {
    title: '选择媒体',
    selectedUrl: '',
    allowUpload: true,
    allowExternal: true,
    aspectRatio: '5 / 6',
    uploadButtonText: '上传图片',
  },
);

const emit = defineEmits<{
  'update:visible': [value: boolean];
  select: [item: MediaItem];
}>();

const folders = ref<MediaFolderSummary[]>([]);
const folderId = ref('');
const searchKeyword = ref('');
const activeTab = ref<'library' | 'external'>('library');
const libraryLoading = ref(false);
const importingId = ref('');
const media = ref<PaginatedResponse<MediaItem>>({
  items: [],
  meta: { page: 1, pageSize: 18, total: 0, pageCount: 0 },
});
const externalMedia = ref<PaginatedResponse<ExternalMediaItem>>({
  items: [],
  meta: { page: 1, pageSize: 18, total: 0, pageCount: 0 },
});

const gridStyle = computed(() => ({ '--picker-media-aspect': props.aspectRatio }));

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      return;
    }
    await ensureInitialData();
  },
);

watch(
  () => props.allowExternal,
  (allowExternal) => {
    if (!allowExternal && activeTab.value === 'external') {
      activeTab.value = 'library';
    }
  },
);

async function ensureInitialData() {
  if (!folders.value.length) {
    folders.value = await mediaApi.listFolders().catch(() => []);
  }
  if (!media.value.items.length) {
    await loadMedia(1);
  }
  if (props.allowExternal && activeTab.value === 'external' && !externalMedia.value.items.length) {
    await loadExternalMedia(1);
  }
}

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function closeDialog() {
  emit('update:visible', false);
}

function isSelected(item: MediaItem) {
  const selected = props.selectedUrl.trim();
  return Boolean(selected) && [item.url, item.thumbUrl || ''].includes(selected);
}

async function loadMedia(page = 1) {
  libraryLoading.value = true;
  try {
    media.value = await mediaApi.list({
      page,
      pageSize: media.value.meta.pageSize,
      folderId: folderId.value || undefined,
    });
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '加载媒体失败');
  } finally {
    libraryLoading.value = false;
  }
}

async function loadExternalMedia(page = 1) {
  try {
    externalMedia.value = await mediaApi.searchExternal({
      provider: 'pexels',
      keyword: searchKeyword.value.trim() || undefined,
      page,
      pageSize: externalMedia.value.meta.pageSize,
    });
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '搜索 Pexels 图片失败');
  }
}

function handleMediaPageChange(page: number) {
  void loadMedia(page);
}

function handleExternalMediaPageChange(page: number) {
  void loadExternalMedia(page);
}

function handleFolderChange() {
  void loadMedia(1);
}

function handleTabChange(key: string | number) {
  activeTab.value = key === 'external' && props.allowExternal ? 'external' : 'library';
  if (activeTab.value === 'library' && !media.value.items.length) {
    void loadMedia(1);
  }
  if (activeTab.value === 'external' && !externalMedia.value.items.length) {
    void loadExternalMedia(1);
  }
}

async function handleSearchExternalMedia() {
  await loadExternalMedia(1);
}

function handleLocalSelect(item: MediaItem) {
  emit('select', item);
  closeDialog();
}

async function handleExternalSelect(item: ExternalMediaItem) {
  importingId.value = item.id;
  try {
    const imported = (await mediaApi.importExternal({
      provider: 'pexels',
      fileName: item.fileName,
      url: item.url,
      thumbUrl: item.thumbUrl,
    })) as MediaItem;
    emit('select', imported);
    closeDialog();
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '导入 Pexels 图片失败');
  } finally {
    importingId.value = '';
  }
}

async function handleQuickUpload(fileList: any[]) {
  const file = fileList.at(-1)?.file;
  if (!file) {
    return;
  }

  try {
    const uploaded = (await mediaApi.upload(file)) as MediaItem;
    await loadMedia(1);
    emit('select', uploaded);
    closeDialog();
    Message.success('图片上传成功');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '上传图片失败');
  }
}

function formatMediaSize(size: number) {
  if (size <= 0) return '-';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<style scoped>
.media-picker-dialog {
  display: grid;
  gap: 16px;
}

.picker-toolbar,
.picker-toolbar__left,
.picker-toolbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.picker-toolbar {
  justify-content: space-between;
  margin-bottom: 16px;
}

.picker-folder-select {
  width: 180px;
  min-width: 180px;
}

.picker-search {
  margin-bottom: 16px;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  max-height: min(62vh, 720px);
  overflow: auto;
  align-items: start;
}

.picker-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  content-visibility: auto;
  contain-intrinsic-size: 240px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(246 248 252 / 0.96));
  box-shadow: 0 10px 24px rgb(15 23 42 / 0.05);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.picker-card :deep(.arco-card-body) {
  display: grid;
  gap: 10px;
  padding: 10px;
}

.picker-card__trigger {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.picker-card__media {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: var(--color-fill-2);
  aspect-ratio: var(--picker-media-aspect, 5 / 6);
}

.picker-card__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgb(15 23 42 / 0.08) 100%);
  opacity: 0;
  transition: opacity 220ms ease;
  pointer-events: none;
}

.picker-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 320ms ease;
}

.picker-card__placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--color-text-3);
  font-size: 11px;
  text-align: center;
  background: linear-gradient(135deg, var(--color-fill-2), var(--color-fill-3));
}

.picker-card__meta {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.picker-card__title,
.picker-card__meta small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-card__title {
  font-size: 12px;
  font-weight: 500;
}

.picker-card__meta small {
  color: var(--admin-text-secondary);
}

.picker-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgb(15 23 42 / 0.1);
}

.picker-card:hover .picker-card__media::after {
  opacity: 1;
}

.picker-card:hover .picker-card__media img {
  transform: scale(1.05);
}

.picker-card--active {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 0 0 1px rgb(var(--primary-6) / 0.22);
}

.picker-card--external {
  grid-template-rows: auto auto auto;
}

.picker-card--external :deep(.arco-btn) {
  justify-self: flex-start;
}

.picker-empty {
  padding: 24px 0 16px;
}

.picker-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

[data-admin-theme='dark'] .picker-card {
  background: linear-gradient(180deg, rgb(20 29 43 / 0.98), rgb(16 24 37 / 0.96));
  box-shadow: 0 12px 28px rgb(0 0 0 / 0.22);
}

[data-admin-theme='dark'] .picker-card:hover {
  box-shadow: 0 20px 40px rgb(0 0 0 / 0.3);
}

@media (max-width: 1200px) {
  .picker-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .picker-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .picker-toolbar__right {
    justify-content: flex-end;
  }

  .picker-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
