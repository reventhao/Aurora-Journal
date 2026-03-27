<template>
  <a-card :bordered="false" class="media-library-card">
    <template #title>媒体库</template>

    <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
      <a-tab-pane key="library" title="本地媒体">
        <div class="toolbar">
          <a-input-search
            v-model="libraryKeyword"
            allow-clear
            search-button
            :style="searchWidth"
            class="toolbar-search"
            placeholder="搜索媒体"
            @search="handleSearchLibrary"
            @clear="handleSearchLibrary"
          />
          <a-select
            v-model="referenceFilter"
            class="toolbar-select"
            :style="referenceSelectWidth"
            placeholder="引用状态"
            @change="handleSearchLibrary"
          >
            <a-option value="all">全部引用</a-option>
            <a-option value="referenced">已引用</a-option>
            <a-option value="unreferenced">未引用</a-option>
          </a-select>
          <a-upload v-if="canUploadMedia" :auto-upload="false" @change="handleUploadChange">
            <template #upload-button>
              <a-button type="primary">上传图片</a-button>
            </template>
          </a-upload>
        </div>

        <div class="toolbar-meta">
          <a-tag bordered>总数 {{ allMediaTotal }}</a-tag>
          <a-tag color="arcoblue" bordered>文件夹 {{ folders.length }}</a-tag>
          <a-tag color="orange" bordered>已引用 {{ referencedCount }}</a-tag>
          <a-tag color="green" bordered>未引用 {{ unreferencedCount }}</a-tag>
        </div>

        <a-alert v-if="localError" type="error" :show-icon="true" class="page-alert">{{ localError }}</a-alert>

        <div class="library-layout">
          <aside class="folder-panel">
            <div class="folder-panel-header">
              <span>文件夹</span>
              <a-button size="mini" type="text" @click="startCreateFolder">新建</a-button>
            </div>
            <button
              type="button"
              class="folder-tile"
              :class="{ 'folder-tile-active': folderFilter === '' }"
              @click="selectFolder('')"
            >
              <span class="folder-tile-icon" aria-hidden="true"></span>
              <span class="folder-tile-body">
                <strong>全部文件</strong>
                <span>{{ allMediaTotal }} 个媒体项</span>
              </span>
            </button>

            <button
              v-for="folder in folders"
              :key="folder.id"
              type="button"
              class="folder-tile"
              :class="{ 'folder-tile-active': folderFilter === folder.id }"
              @click="selectFolder(folder.id)"
            >
              <span class="folder-tile-icon" aria-hidden="true"></span>
              <span class="folder-tile-body">
                <strong :title="folder.name">{{ folder.name }}</strong>
                <span>{{ folder.description || `${folder.mediaCount || 0} 个媒体项` }}</span>
              </span>
              <span class="folder-tile-actions" @click.stop>
                <a-button size="mini" type="text" @click="editFolder(folder)">编辑</a-button>
                <a-button size="mini" type="text" status="danger" :disabled="(folder.mediaCount || 0) > 0" @click="removeFolder(folder)">
                  删除
                </a-button>
              </span>
            </button>
          </aside>

          <div class="library-content">
            <div v-if="folderFilter && activeFolder" class="active-folder-bar">
              <div class="active-folder-summary">
                <span class="active-folder-icon" aria-hidden="true"></span>
                <div>
                  <strong>{{ activeFolder.name }}</strong>
                  <span>{{ activeFolder.description || `当前文件夹共 ${activeFolder.mediaCount || 0} 个媒体项` }}</span>
                </div>
              </div>
              <a-button size="mini" @click="selectFolder('')">查看全部</a-button>
            </div>

            <div v-if="localMedia.items.length" class="media-grid local-grid">
              <a-card v-for="item in localMedia.items" :key="item.id" class="media-card local-media-card" :bordered="false">
                <button type="button" class="media-preview-trigger" @click="openPreview(item.url, item.fileName)">
                  <div class="media-visual">
                    <img
                      v-if="item.thumbUrl"
                      :src="item.thumbUrl"
                      :alt="item.altText || item.fileName"
                      loading="lazy"
                      decoding="async"
                      width="320"
                      height="384"
                    />
                    <span v-else class="local-thumb-placeholder-card">无缩略图</span>
                  </div>
                </button>
                <div class="media-meta">
                  <strong :title="item.fileName">{{ item.fileName }}</strong>
                  <span>{{ formatFileSize(item.size) }} · {{ formatDate(item.createdAt) }}</span>
                  <div class="local-media-tags">
                    <a-tag size="small" :color="item.source === 'PEXELS' ? 'arcoblue' : 'green'">
                      {{ item.source === 'PEXELS' ? 'Pexels' : '本地' }}
                    </a-tag>
                    <a-tag v-if="item.groupName" size="small">{{ item.groupName }}</a-tag>
                    <a-tooltip
                      v-if="item.referenceCount"
                      :content="item.referencedPostTitles?.length ? `已被 ${item.referencedPostTitles.join('、')} 等文章引用` : '已被文章引用'"
                    >
                      <a-tag color="orange" size="small">引用 {{ item.referenceCount }}</a-tag>
                    </a-tooltip>
                    <a-tag v-else color="green" size="small">未引用</a-tag>
                    <a-tag v-for="tag in item.tags || []" :key="tag" size="small" color="purple">{{ tag }}</a-tag>
                  </div>
                  <a-space wrap>
                    <a-button size="mini" @click="openPreview(item.url, item.fileName)">预览</a-button>
                    <a-button size="mini" @click="openMetaEditor(item)">编辑信息</a-button>
                    <a-button size="mini" @click="copyMediaUrl(item.url)">复制链接</a-button>
                    <a-button v-if="canDeleteMedia" size="mini" status="danger" @click="removeMedia(item.id)">删除</a-button>
                  </a-space>
                </div>
              </a-card>
            </div>

            <a-empty
              v-else
              class="media-empty"
              :description="libraryKeyword ? '没有匹配的本地媒体' : folderFilter ? '当前文件夹下还没有媒体' : '当前没有符合条件的媒体'"
            />
          </div>
        </div>

        <div class="pagination-wrap" v-if="localMedia.meta.total > 0">
          <a-pagination
            :current="localMedia.meta.page"
            :page-size="localMedia.meta.pageSize"
            :total="localMedia.meta.total"
            :show-total="true"
            @change="handleLibraryPageChange"
          />
        </div>
      </a-tab-pane>

      <a-tab-pane key="external" title="Pexels 图库">
        <div class="toolbar">
          <a-input-search
            v-model="searchKeyword"
            allow-clear
            search-button
            :style="searchWidth"
            class="toolbar-search"
            placeholder="搜索图片，例如 workspace、technology、coffee"
            @search="handleSearchExternal"
            @clear="handleSearchExternal"
          />
        </div>

        <a-alert v-if="externalError" type="error" :show-icon="true" class="page-alert">{{ externalError }}</a-alert>

        <div v-if="externalMedia.items.length" class="media-grid external-grid">
          <a-card v-for="item in externalMedia.items" :key="item.id" class="media-card" :bordered="false">
            <button type="button" class="media-preview-trigger" @click="openPreview(item.url, item.title || item.fileName, item.photographer)">
              <div class="media-visual">
                <img
                  :src="item.previewUrl"
                  :alt="item.title || item.fileName"
                  loading="lazy"
                  decoding="async"
                  width="320"
                  height="384"
                />
              </div>
            </button>
            <div class="media-meta">
              <strong :title="item.title || item.fileName">{{ item.title || item.fileName }}</strong>
              <span>{{ item.photographer }} · {{ item.width }} × {{ item.height }}</span>
              <a-space wrap>
                <a-button size="mini" @click="openSource(item.sourcePage)">来源页面</a-button>
                <a-button v-if="canImportMedia" size="mini" type="primary" @click="importExternal(item)">导入媒体库</a-button>
              </a-space>
            </div>
          </a-card>
        </div>

        <a-empty v-else class="media-empty" :description="searchKeyword ? '没有匹配的搜索结果' : '输入关键词后即可搜索图片'" />

        <div class="pagination-wrap" v-if="externalMedia.meta.total > 0">
          <a-pagination
            :current="externalMedia.meta.page"
            :page-size="externalMedia.meta.pageSize"
            :total="externalMedia.meta.total"
            :show-total="true"
            @change="handleExternalPageChange"
          />
        </div>
      </a-tab-pane>
    </a-tabs>
  </a-card>

  <a-drawer v-model:visible="metaEditorVisible" title="媒体信息" width="460px" :footer="false">
    <a-form layout="vertical" :model="metaForm" class="meta-form">
      <a-form-item label="文件名">
        <a-input :model-value="metaForm.fileName" disabled />
      </a-form-item>
      <a-form-item label="文件夹">
        <a-select v-model="metaForm.folderId" allow-clear placeholder="选择文件夹，可留空">
          <a-option v-for="folder in folders" :key="folder.id" :value="folder.id">{{ folder.name }}</a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="Alt 文本">
        <a-input v-model="metaForm.altText" placeholder="用于前台图片说明和无障碍描述" />
      </a-form-item>
      <a-form-item label="标签">
        <a-input
          v-model="metaTagsText"
          placeholder="多个标签用中文逗号、英文逗号或换行分隔"
        />
      </a-form-item>
      <a-form-item label="来源">
        <a-input :model-value="metaForm.source === 'PEXELS' ? 'Pexels' : '本地上传'" disabled />
      </a-form-item>
      <a-space>
        <a-button type="primary" :loading="metaSaving" @click="submitMeta">保存</a-button>
        <a-button @click="metaEditorVisible = false">取消</a-button>
      </a-space>
    </a-form>
  </a-drawer>

  <a-modal
    v-model:visible="folderModalVisible"
    :title="folderEditingId ? '编辑文件夹' : '新建文件夹'"
    width="560px"
    :footer="false"
    unmount-on-close
    @close="resetFolderForm"
  >
    <div class="folder-modal">
      <a-form layout="vertical">
        <a-form-item label="文件夹名称" required>
          <a-input v-model="folderForm.name" placeholder="输入文件夹名称" @input="handleFolderNameInput" />
        </a-form-item>
        <a-form-item label="标识">
          <a-input v-model="folderForm.slug" placeholder="名称变化时自动生成" @input="handleFolderSlugInput" />
        </a-form-item>
        <a-form-item label="说明">
          <a-input v-model="folderForm.description" placeholder="说明，可选" />
        </a-form-item>
        <div class="folder-modal-actions">
          <a-button type="primary" :loading="folderSaving" @click="submitFolder">
            {{ folderEditingId ? '保存修改' : '创建文件夹' }}
          </a-button>
          <a-button @click="closeFolderModal">取消</a-button>
        </div>
      </a-form>
    </div>
  </a-modal>

  <a-modal
    v-model:visible="previewVisible"
    :footer="false"
    width="min(1100px, calc(100vw - 48px))"
    modal-class="media-preview-modal"
  >
    <div v-if="previewImageUrl" class="media-preview-content">
      <img :src="previewImageUrl" :alt="previewTitle" class="media-preview-image" loading="eager" decoding="async" />
      <div class="media-preview-meta">
        <strong>{{ previewTitle }}</strong>
        <span v-if="previewSubtitle">{{ previewSubtitle }}</span>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import type { ExternalMediaItem, MediaFolderSummary, MediaItem, PaginatedResponse } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { mediaApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';

type MediaMetaForm = MediaItem & {
  folderId?: string | null;
};

const activeTab = ref<'library' | 'external'>('library');
const authStore = useAuthStore();
const searchWidth = { width: '240px', minWidth: '240px' };
const referenceSelectWidth = { width: '132px', minWidth: '132px' };
const libraryKeyword = ref('');
const folderFilter = ref('');
const referenceFilter = ref<'all' | 'referenced' | 'unreferenced'>('all');
const searchKeyword = ref('');
const previewVisible = ref(false);
const previewImageUrl = ref('');
const previewTitle = ref('');
const previewSubtitle = ref('');
const metaEditorVisible = ref(false);
const metaSaving = ref(false);
const metaTagsText = ref('');
const localError = ref('');
const externalError = ref('');
const folders = ref<MediaFolderSummary[]>([]);
const allMediaTotal = ref(0);
const folderSaving = ref(false);
const folderModalVisible = ref(false);
const folderEditingId = ref('');
const folderForm = reactive({
  name: '',
  slug: '',
  description: '',
});
const folderSlugTouched = ref(false);
const metaForm = ref<MediaMetaForm>({
  id: '',
  fileName: '',
  url: '',
  mimeType: '',
  size: 0,
  createdAt: '',
  source: 'LOCAL',
  folderId: null,
  groupName: '',
  tags: [],
  altText: '',
});
const localMedia = ref<PaginatedResponse<MediaItem>>({
  items: [],
  meta: { page: 1, pageSize: 20, total: 0, pageCount: 0 },
});
const externalMedia = ref<PaginatedResponse<ExternalMediaItem>>({
  items: [],
  meta: { page: 1, pageSize: 18, total: 0, pageCount: 0 },
});
const localLoaded = ref(false);
const externalLoaded = ref(false);
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const canUploadMedia = computed(() => authStore.hasPermission('media.upload'));
const canDeleteMedia = computed(() => authStore.hasPermission('media.delete'));
const canImportMedia = computed(() => authStore.hasPermission('media.import'));
const activeFolder = computed(() => folders.value.find((folder) => folder.id === folderFilter.value) ?? null);
const referencedCount = computed(() => localMedia.value.items.filter((item) => (item.referenceCount ?? 0) > 0).length);
const unreferencedCount = computed(() => localMedia.value.items.filter((item) => (item.referenceCount ?? 0) === 0).length);

function resolveReferencedParam() {
  if (referenceFilter.value === 'referenced') return true;
  if (referenceFilter.value === 'unreferenced') return false;
  return undefined;
}

async function loadFolders() {
  try {
    folders.value = await mediaApi.listFolders();
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '加载文件夹失败');
  }
}

async function loadMedia(page = 1) {
  localError.value = '';
  try {
    localMedia.value = await mediaApi.list({
      page,
      pageSize: localMedia.value.meta.pageSize,
      keyword: libraryKeyword.value.trim() || undefined,
      referenced: resolveReferencedParam(),
      folderId: folderFilter.value || undefined,
    });
    localLoaded.value = true;
  } catch (error: any) {
    localMedia.value = {
      items: [],
      meta: { page, pageSize: localMedia.value.meta.pageSize, total: 0, pageCount: 0 },
    };
    localError.value = error?.response?.data?.message || '加载媒体库失败';
    Message.error(localError.value);
  }
}

async function loadAllMediaTotal() {
  try {
    const response = await mediaApi.list({
      page: 1,
      pageSize: 1,
    });
    allMediaTotal.value = response.meta.total;
  } catch {
    allMediaTotal.value = 0;
  }
}

async function handleUploadChange(fileList: any[]) {
  const file = fileList.at(-1)?.file;
  if (!file) return;

  try {
    const uploaded = await mediaApi.upload(file);
    localMedia.value.items = [uploaded, ...localMedia.value.items].slice(0, localMedia.value.meta.pageSize);
    localMedia.value.meta.total += 1;
    localMedia.value.meta.page = 1;
    localLoaded.value = true;
    allMediaTotal.value += 1;
    Message.success('上传成功');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '上传失败');
  }
}

async function removeMedia(id: string) {
  try {
    await mediaApi.remove(id);
    const nextItems = localMedia.value.items.filter((item) => item.id !== id);
    const removedCurrentPageLastItem = localMedia.value.items.length === 1 && localMedia.value.meta.page > 1;

    localMedia.value.items = nextItems;
    localMedia.value.meta.total = Math.max(0, localMedia.value.meta.total - 1);
    allMediaTotal.value = Math.max(0, allMediaTotal.value - 1);
    Message.success('媒体文件已删除');

    if (removedCurrentPageLastItem) {
      await loadMedia(localMedia.value.meta.page - 1);
    }
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除失败');
  }
}

function handleLibraryPageChange(page: number) {
  void loadMedia(page);
}

function selectFolder(id: string) {
  if (folderFilter.value === id) return;
  folderFilter.value = id;
  void loadMedia(1);
}

function handleSearchLibrary() {
  void loadMedia(1);
}

async function handleSearchExternal(page = 1) {
  externalError.value = '';
  try {
    externalMedia.value = await mediaApi.searchExternal({
      provider: 'pexels',
      keyword: searchKeyword.value.trim() || undefined,
      page,
      pageSize: externalMedia.value.meta.pageSize,
    });
    externalLoaded.value = true;
  } catch (error: any) {
    externalMedia.value = {
      items: [],
      meta: { page, pageSize: externalMedia.value.meta.pageSize, total: 0, pageCount: 0 },
    };
    externalError.value = error?.response?.data?.message || 'Pexels 图库搜索失败';
    Message.error(externalError.value);
  }
}

function handleExternalPageChange(page: number) {
  void handleSearchExternal(page);
}

async function importExternal(item: ExternalMediaItem) {
  try {
    const imported = await mediaApi.importExternal({
      provider: 'pexels',
      fileName: item.fileName,
      url: item.url,
      thumbUrl: item.thumbUrl,
    });
    Message.success('已导入媒体库');
    if (activeTab.value === 'library' || localLoaded.value) {
      localMedia.value.items = [imported, ...localMedia.value.items].slice(0, localMedia.value.meta.pageSize);
      localMedia.value.meta.total += 1;
      localMedia.value.meta.page = 1;
      localLoaded.value = true;
    }
    allMediaTotal.value += 1;
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '导入媒体失败');
  }
}

function openMetaEditor(item: MediaItem) {
  const itemWithFolder = item as MediaMetaForm;
  metaForm.value = {
    ...itemWithFolder,
    folderId: itemWithFolder.folderId ?? null,
    groupName: itemWithFolder.groupName || '',
    tags: [...(itemWithFolder.tags || [])],
    altText: itemWithFolder.altText || '',
  };
  metaTagsText.value = (item.tags || []).join(', ');
  metaEditorVisible.value = true;
}

async function submitMeta() {
  if (!metaForm.value.id) return;

  metaSaving.value = true;
  try {
    const updated = await mediaApi.updateMeta(metaForm.value.id, {
      folderId: metaForm.value.folderId || null,
      altText: metaForm.value.altText?.trim() || '',
      tags: metaTagsText.value
        .split(/[\n,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    });

    localMedia.value.items = localMedia.value.items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
    metaForm.value = updated;
    metaTagsText.value = (updated.tags || []).join(', ');
    metaEditorVisible.value = false;
    Message.success('媒体信息已更新');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '保存媒体信息失败');
  } finally {
    metaSaving.value = false;
  }
}

function resetFolderForm() {
  folderEditingId.value = '';
  folderForm.name = '';
  folderForm.slug = '';
  folderForm.description = '';
  folderSlugTouched.value = false;
}

function closeFolderModal() {
  folderModalVisible.value = false;
  resetFolderForm();
}

function editFolder(folder: MediaFolderSummary) {
  folderModalVisible.value = true;
  folderEditingId.value = folder.id;
  folderForm.name = folder.name;
  folderForm.slug = folder.slug;
  folderForm.description = folder.description || '';
  folderSlugTouched.value = true;
}

function startCreateFolder() {
  resetFolderForm();
  folderModalVisible.value = true;
}

function slugifyFolderName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function handleFolderNameInput(value: string | number | undefined) {
  const nextValue = `${value ?? ''}`;
  folderForm.name = nextValue;
  if (!folderSlugTouched.value) {
    folderForm.slug = slugifyFolderName(nextValue);
  }
}

function handleFolderSlugInput(value: string | number | undefined) {
  folderSlugTouched.value = true;
  folderForm.slug = slugifyFolderName(`${value ?? ''}`);
}

async function submitFolder() {
  if (!folderForm.name.trim()) {
    Message.error('请先填写文件夹名称');
    return;
  }

  folderSaving.value = true;
  try {
    const isEditing = Boolean(folderEditingId.value);
    const payload = {
      name: folderForm.name.trim(),
      slug: folderForm.slug.trim() || undefined,
      description: folderForm.description.trim() || undefined,
    };
    const nextFolders = folderEditingId.value
      ? await mediaApi.updateFolder(folderEditingId.value, payload)
      : await mediaApi.createFolder(payload);
    folders.value = nextFolders;
    closeFolderModal();
    Message.success(isEditing ? '文件夹已更新' : '文件夹已创建');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '保存文件夹失败');
  } finally {
    folderSaving.value = false;
  }
}

async function removeFolder(folder: MediaFolderSummary) {
  try {
    folders.value = await mediaApi.removeFolder(folder.id);
    if (folderFilter.value === folder.id) {
      folderFilter.value = '';
      await loadMedia(1);
    }
    Message.success('文件夹已删除');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除文件夹失败');
  }
}

async function copyMediaUrl(url: string) {
  await navigator.clipboard.writeText(url);
  Message.success('图片链接已复制');
}

function openSource(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openPreview(url: string, title: string, subtitle = '') {
  previewImageUrl.value = url;
  previewTitle.value = title;
  previewSubtitle.value = subtitle;
  previewVisible.value = true;
}

function handleTabChange(key: string | number) {
  if (key === 'library' && !localLoaded.value) {
    void loadMedia();
  }
  if (key === 'external' && !externalLoaded.value) {
    void handleSearchExternal();
  }
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatFileSize(size: number) {
  if (size <= 0) return '-';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

onMounted(() => {
  void Promise.all([loadFolders(), loadMedia(), loadAllMediaTotal()]);
});

watch(
  () => folderForm.name,
  (value) => {
    if (!folderSlugTouched.value) {
      folderForm.slug = slugifyFolderName(value);
    }
  },
);
</script>

<style scoped>
.media-library-card {
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
  width: 240px;
  min-width: 240px;
  flex: none;
}

.toolbar-select {
  flex: none;
}

.toolbar-select :deep(.arco-select-view-value) {
  white-space: nowrap;
}

.toolbar-select :deep(.arco-select-view-placeholder) {
  white-space: nowrap;
}

.toolbar-select :deep(.arco-select-view-single) {
  padding-right: 28px;
  flex: none;
}

.toolbar > .arco-upload,
.toolbar > .arco-btn {
  flex: none;
}

.toolbar :deep(.arco-input-wrapper),
.toolbar :deep(.arco-select-view),
.toolbar > .arco-upload,
.toolbar > .arco-btn {
  white-space: nowrap;
}

.toolbar :deep(.arco-select-view-single) {
  padding-right: 28px;
}

.toolbar :deep(.arco-input-wrapper input),
.toolbar :deep(.arco-select-view-value) {
  font-size: 12px;
}

.toolbar-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.library-layout {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.folder-panel {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 8px;
  border: 1px solid var(--color-border-2);
  border-radius: 16px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(246 248 252 / 0.96));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.7), 0 10px 24px rgb(15 23 42 / 0.04);
}

.folder-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 10px 10px;
  color: var(--color-text-3);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.folder-modal {
  display: grid;
  gap: 12px;
}

.folder-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.folder-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background 140ms ease,
    color 140ms ease;
}

.folder-tile:hover {
  background: var(--color-fill-2);
}

.folder-tile-active {
  background: rgb(var(--primary-1));
}

.folder-tile-icon,
.active-folder-icon {
  position: relative;
  flex: none;
  width: 22px;
  height: 16px;
  border-radius: 4px 4px 6px 6px;
  background: linear-gradient(180deg, #f8d97a, #e7b847);
  box-shadow: inset 0 -2px 0 rgb(166 115 18 / 0.18);
}

.folder-tile-icon::before,
.active-folder-icon::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 3px;
  width: 10px;
  height: 5px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(180deg, #fbe7a8, #f6cd67);
}

.folder-tile-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.folder-tile-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 140ms ease;
}

.folder-tile:hover .folder-tile-actions,
.folder-tile-active .folder-tile-actions {
  opacity: 1;
}

.folder-tile-body strong,
.active-folder-summary strong {
  overflow: hidden;
  color: var(--color-text-1);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1.3;
  font-weight: 500;
}

.folder-tile-body span,
.active-folder-summary span {
  overflow: hidden;
  color: var(--color-text-3);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  line-height: 1.4;
}

.library-content {
  min-width: 0;
}

.active-folder-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 18px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(245 247 250 / 0.96));
  box-shadow: 0 10px 24px rgb(15 23 42 / 0.05);
}

.active-folder-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.page-alert {
  margin-bottom: 16px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 12px;
}

.external-grid,
.local-grid {
  margin-top: 8px;
}

.media-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  content-visibility: auto;
  contain-intrinsic-size: 240px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(246 248 252 / 0.96));
  box-shadow: 0 10px 24px rgb(15 23 42 / 0.05);
  opacity: 0;
  transform: translateY(0);
  animation: media-card-enter 320ms ease forwards;
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.media-card :deep(.arco-card-body) {
  padding: 10px;
}

.media-card:nth-child(2n) {
  animation-delay: 30ms;
}

.media-card:nth-child(3n) {
  animation-delay: 60ms;
}

.media-card:nth-child(4n) {
  animation-delay: 90ms;
}

.local-media-card {
  border: 1px solid var(--color-neutral-3);
}

.media-preview-trigger {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}

.media-visual {
  position: relative;
  overflow: hidden;
  aspect-ratio: 5 / 6;
  border-radius: 12px;
  background: var(--color-fill-2);
}

.media-visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgb(15 23 42 / 0.08) 100%);
  opacity: 0;
  transition: opacity 220ms ease;
  pointer-events: none;
}

.media-preview-trigger img {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 5 / 6;
  object-fit: cover;
  transition: transform 320ms ease, filter 320ms ease;
}

.local-thumb-placeholder-card {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 5 / 6;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-fill-2), var(--color-fill-3));
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.3;
  text-align: center;
  transition: transform 220ms ease, background 220ms ease;
}

.media-meta {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  transition: transform 220ms ease;
}

.media-meta strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1.4;
}

.media-meta span {
  font-size: 12px;
  color: var(--color-text-3);
}

.local-media-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.media-empty {
  padding: 44px 0 28px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.media-preview-content,
.media-preview-meta,
.meta-form,
.folder-modal {
  display: grid;
  gap: 12px;
}

.folder-toolbar {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.2fr auto auto;
  gap: 12px;
}

.media-preview-image {
  width: 100%;
  max-height: calc(100vh - 220px);
  object-fit: contain;
  border-radius: 16px;
  background: rgb(15 23 42 / 0.8);
  animation: media-preview-enter 240ms ease;
}

.media-preview-meta span {
  color: var(--color-text-3);
}

.media-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgb(15 23 42 / 0.1);
}

.media-card:hover .media-visual::after {
  opacity: 1;
}

.media-card:hover .media-preview-trigger img {
  transform: scale(1.035);
  filter: saturate(1.04);
}

.media-card:hover .local-thumb-placeholder-card {
  transform: scale(1.02);
}

.media-card:hover .media-meta {
  transform: translateY(-1px);
}

[data-admin-theme='dark'] .media-card {
  background: linear-gradient(180deg, rgb(20 29 43 / 0.98), rgb(16 24 37 / 0.96));
  box-shadow: 0 12px 28px rgb(0 0 0 / 0.22);
}

[data-admin-theme='dark'] .folder-tile,
[data-admin-theme='dark'] .active-folder-bar {
  background: linear-gradient(180deg, rgb(20 29 43 / 0.98), rgb(16 24 37 / 0.96));
  box-shadow: 0 12px 28px rgb(0 0 0 / 0.22);
}

[data-admin-theme='dark'] .folder-panel {
  border-color: rgb(255 255 255 / 0.08);
  background: linear-gradient(180deg, rgb(20 29 43 / 0.98), rgb(16 24 37 / 0.96));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.03), 0 12px 28px rgb(0 0 0 / 0.22);
}

[data-admin-theme='dark'] .folder-tile:hover {
  background: rgb(255 255 255 / 0.06);
}

[data-admin-theme='dark'] .folder-tile-active {
  background: rgb(var(--primary-6) / 0.22);
}

[data-admin-theme='dark'] .media-card:hover {
  box-shadow: 0 20px 40px rgb(0 0 0 / 0.3);
}

[data-admin-theme='dark'] .media-visual::after {
  background: linear-gradient(180deg, transparent 0%, rgb(8 15 26 / 0.22) 100%);
}

@keyframes media-card-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes media-preview-enter {
  from {
    opacity: 0;
    transform: scale(0.985);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 1600px) {
  .media-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}

@media (max-width: 1360px) {
  .library-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .media-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .folder-toolbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1120px) {
  .library-layout {
    grid-template-columns: 1fr;
  }

  .folder-panel {
    position: static;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .media-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .active-folder-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .media-grid,
  .folder-toolbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
