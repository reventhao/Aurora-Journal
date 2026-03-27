<template>
  <div class="editor-page">
    <a-card :bordered="false">
      <template #title>{{ isEdit ? '编辑文章' : '新建文章' }}</template>
      <template #extra>
        <a-space>
          <span class="save-status">{{ saveStatusText }}</span>
          <a-button @click="settingsDrawerVisible = true">文章设置</a-button>
          <a-button @click="goBack">返回列表</a-button>
          <a-button type="primary" :disabled="!canSavePost" @click="submitForm">保存文章</a-button>
        </a-space>
      </template>

      <a-alert v-if="draftBannerVisible" class="draft-alert" type="info" show-icon closable @close="draftBannerVisible = false">
        <template #title>检测到本地草稿</template>
        <template #default>
          <div class="draft-alert-content">
            <span>{{ draftBannerText }}</span>
            <a-space>
              <a-button size="mini" type="outline" @click="restoreDraft">恢复草稿</a-button>
              <a-button size="mini" status="warning" @click="discardDraft">丢弃草稿</a-button>
            </a-space>
          </div>
        </template>
      </a-alert>

      <section class="editor-overview">
        <div class="editor-overview__summary">
          <div class="editor-overview__eyebrow">Editor Workbench</div>
          <div class="editor-overview__headline">
            <strong>{{ form.title.trim() || '未命名文章' }}</strong>
            <span>{{ isEdit ? '正在编辑已有内容' : '新文章草稿，先把结构搭起来' }}</span>
          </div>
        </div>

        <div class="editor-overview__meta">
          <div class="overview-chip" :data-tone="overviewStatusTone">
            <span class="overview-chip__label">状态</span>
            <strong>{{ overviewStatusText }}</strong>
            <small>{{ overviewStatusHint }}</small>
          </div>
          <div class="overview-chip" data-tone="category">
            <span class="overview-chip__label">分类</span>
            <strong>{{ selectedCategoryName }}</strong>
            <small>{{ form.featured ? '已加入精选推荐' : '当前未加入精选' }}</small>
          </div>
          <div class="overview-chip" data-tone="tags">
            <span class="overview-chip__label">标签</span>
            <strong>{{ tagSummaryText }}</strong>
            <small>{{ tagSummaryHint }}</small>
          </div>
          <div class="overview-chip" data-tone="cover">
            <span class="overview-chip__label">封面</span>
            <strong>{{ coverSummaryText }}</strong>
            <small>{{ coverSummaryHint }}</small>
          </div>
          <div v-if="isEdit" class="overview-chip" data-tone="revision">
            <span class="overview-chip__label">修订</span>
            <strong>{{ revisionSummaryText }}</strong>
            <small>{{ hasUnsavedChanges ? '当前有未保存修改' : '当前内容已同步' }}</small>
          </div>
        </div>

        <div class="editor-overview__actions">
          <span class="save-status">{{ saveStatusText }}</span>
          <a-button type="outline" @click="settingsDrawerVisible = true">打开完整设置</a-button>
        </div>
      </section>

      <div class="editor-layout">
        <section class="editor-main">
          <a-form layout="vertical" :model="form" class="editor-form">
            <a-form-item field="title" label="标题">
              <a-input v-model="form.title" placeholder="请输入文章标题" />
            </a-form-item>
            <a-form-item field="content" label="正文内容" class="editor-content-item">
              <MdEditor
                v-model="form.content"
                class="pro-editor"
                language="zh-CN"
                :theme="themeStore.isDark ? 'dark' : 'light'"
                preview-theme="github"
                :code-theme="themeStore.isDark ? 'atom' : 'github'"
                :toolbars="toolbars"
                :on-upload-img="handleUploadImages"
                show-code-row-number
              />
            </a-form-item>
          </a-form>
        </section>
      </div>
    </a-card>

    <a-drawer
      v-model:visible="settingsDrawerVisible"
      class="settings-drawer"
      title="文章设置"
      placement="right"
      :width="drawerWidth"
      :footer="false"
      :unmount-on-close="false"
    >
      <div class="editor-sidebar">
        <section class="sidebar-card">
          <div class="sidebar-card__header">
            <strong>发布信息</strong>
          </div>

          <a-form layout="vertical" :model="form">
            <a-form-item field="excerpt" label="摘要">
              <a-textarea v-model="form.excerpt" :auto-size="{ minRows: 4, maxRows: 6 }" />
            </a-form-item>

            <div class="sidebar-grid">
              <a-form-item field="categoryId" label="分类">
                <a-select v-model="form.categoryId" allow-clear placeholder="选择分类" :disabled="!canViewCategories">
                  <a-option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</a-option>
                </a-select>
              </a-form-item>
              <a-form-item field="status" label="状态">
                <a-select v-model="form.status" :disabled="!canPublishPost">
                  <a-option value="DRAFT">草稿</a-option>
                  <a-option value="PUBLISHED">发布</a-option>
                </a-select>
              </a-form-item>
            </div>

            <div class="sidebar-grid">
              <a-form-item field="featured" label="精选推荐">
                <a-switch v-model="form.featured" :disabled="!canFeaturePost" />
              </a-form-item>
              <a-form-item field="tagIds" label="标签">
                <a-select v-model="form.tagIds" multiple allow-clear placeholder="选择标签" :disabled="!canViewTags">
                  <a-option v-for="item in tags" :key="item.id" :value="item.id">{{ item.name }}</a-option>
                </a-select>
              </a-form-item>
            </div>

            <div class="schedule-panel">
              <div class="schedule-panel__header">
                <strong>内容排期</strong>
              </div>
              <div class="sidebar-grid">
                <a-form-item field="scheduledPublishAt" label="定时发布">
                  <a-date-picker
                    v-model="form.scheduledPublishAt"
                    show-time
                    format="YYYY-MM-DD HH:mm"
                    value-format="YYYY-MM-DD HH:mm"
                    placeholder="选择发布时间"
                    style="width: 100%"
                  />
                </a-form-item>
                <a-form-item field="scheduledUnpublishAt" label="定时下线">
                  <a-date-picker
                    v-model="form.scheduledUnpublishAt"
                    show-time
                    format="YYYY-MM-DD HH:mm"
                    value-format="YYYY-MM-DD HH:mm"
                    placeholder="选择下线时间"
                    style="width: 100%"
                  />
                </a-form-item>
              </div>
            </div>

            <a-form-item field="revisionReason" label="修订说明">
              <a-input v-model="form.revisionReason" placeholder="例如：补充封面、修正文案、调整发布时间" />
            </a-form-item>
          </a-form>
        </section>

        <section class="sidebar-card">
          <div class="sidebar-card__header">
            <strong>封面与 SEO</strong>
          </div>

          <a-form layout="vertical" :model="form">
            <a-form-item field="coverImage" label="封面图片">
              <div class="cover-field">
                <button type="button" class="cover-selector-card" @click="canViewMedia && openMediaPicker('cover')">
                  <div class="cover-selector-card__media">
                    <img v-if="coverPreviewUrl" :src="coverPreviewUrl" alt="cover preview" loading="lazy" decoding="async" />
                    <img v-else-if="form.coverImage" :src="form.coverImage" alt="cover preview" loading="lazy" decoding="async" />
                    <span v-else class="cover-selector-card__placeholder">选择封面</span>
                  </div>
                </button>

                <div class="cover-field__controls">
                  <div class="cover-actions">
                    <a-button v-if="canViewMedia" type="primary" @click="openMediaPicker('cover')">媒体库选择</a-button>
                    <a-button v-if="form.coverImage" status="warning" @click="clearCoverImage">清空</a-button>
                  </div>

                  <a-input v-model="form.coverImage" placeholder="粘贴图片地址" />
                </div>
              </div>
            </a-form-item>

            <a-form-item field="seoTitle" label="SEO 标题"><a-input v-model="form.seoTitle" /></a-form-item>
            <a-form-item field="seoDescription" label="SEO 描述"><a-input v-model="form.seoDescription" /></a-form-item>
          </a-form>
        </section>

        <section class="sidebar-card">
          <div class="sidebar-card__header">
            <strong>媒体</strong>
          </div>

          <a-space wrap>
            <a-upload v-if="canUploadMedia" :auto-upload="false" @change="handleQuickUpload">
              <template #upload-button><a-button type="primary" size="small">上传并插入</a-button></template>
            </a-upload>
            <a-button v-if="canViewMedia" size="small" @click="openMediaPicker('content')">打开媒体选择器</a-button>
          </a-space>

          <div v-if="media.items.length" class="media-strip">
            <button v-for="item in media.items.slice(0, 4)" :key="item.id" type="button" class="media-chip" @click="handleRecentMediaClick(item)">
              <img v-if="item.thumbUrl" :src="item.thumbUrl" :alt="item.fileName" loading="lazy" decoding="async" />
              <span v-else class="thumb-placeholder">无缩略图</span>
              <span>{{ item.fileName }}</span>
            </button>
          </div>
        </section>

        <section v-if="isEdit" class="sidebar-card">
          <div class="sidebar-card__header">
            <strong>修订历史</strong>
          </div>

          <div class="revision-list" v-if="revisions.length">
            <article v-for="item in revisions" :key="item.id" class="revision-card">
              <div class="revision-card__meta">
                <strong>版本 #{{ item.version }}</strong>
                <span>{{ item.reason || '未填写说明' }}</span>
                <small>{{ formatDateTime(item.createdAt) }}<template v-if="item.createdByName"> · {{ item.createdByName }}</template></small>
              </div>
              <a-button size="mini" :loading="revisionsLoading" @click="restoreRevision(item)">恢复此版本</a-button>
            </article>
          </div>
          <a-empty v-else :description="revisionsLoading ? '正在加载修订历史' : '暂无修订记录'" />
        </section>
      </div>
    </a-drawer>

    <MediaPickerDialog
      v-model:visible="mediaPickerVisible"
      :title="mediaPickerMode === 'cover' ? '选择封面图片' : '选择媒体插入正文'"
      :selected-url="mediaPickerMode === 'cover' ? form.coverImage : ''"
      :allow-upload="canUploadMedia"
      :allow-external="canImportMedia"
      @select="handleMediaPick"
    />
  </div>
</template>

<script setup lang="ts">
import type { MediaItem, PaginatedResponse, PostRevisionSummary } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { MdEditor, type ToolbarNames } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { categoriesApi, mediaApi, postsApi, tagsApi } from '../../api/modules';
import MediaPickerDialog from '../../components/media/MediaPickerDialog.vue';
import { useAuthStore } from '../../stores/auth';
import { useThemeStore } from '../../stores/theme';

type PostForm = {
  title: string;
  excerpt: string;
  coverImage: string;
  content: string;
  categoryId?: string;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  tagIds: string[];
  seoTitle: string;
  seoDescription: string;
  scheduledPublishAt: string;
  scheduledUnpublishAt: string;
  revisionReason: string;
};

type DraftPayload = { savedAt: string; data: PostForm };

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const categories = ref<any[]>([]);
const tags = ref<any[]>([]);
const media = ref<PaginatedResponse<MediaItem>>({ items: [], meta: { page: 1, pageSize: 18, total: 0, pageCount: 0 } });
const mediaPickerVisible = ref(false);
const mediaPickerMode = ref<'content' | 'cover'>('content');
const settingsDrawerVisible = ref(false);
const revisions = ref<PostRevisionSummary[]>([]);
const revisionsLoading = ref(false);
const restoringDraft = ref(false);
const suppressAutoSave = ref(true);
const serverSnapshot = ref('');
const saveStatusText = ref('未保存');
const localDraft = ref<DraftPayload | null>(null);
const draftBannerVisible = ref(false);
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
let autoSaveTimer: ReturnType<typeof setTimeout> | undefined;

const toolbars: ToolbarNames[] = ['bold', 'underline', 'italic', '-', 'title', 'strikeThrough', 'quote', 'unorderedList', 'orderedList', 'task', '-', 'codeRow', 'code', 'link', 'image', 'table', 'mermaid', 'katex', '=', 'preview', 'previewOnly', 'catalog', 'fullscreen'];
const initialForm = (): PostForm => ({ title: '', excerpt: '', coverImage: '', content: '# 新文章\n\n开始创作吧。', categoryId: undefined, status: 'DRAFT', featured: false, tagIds: [], seoTitle: '', seoDescription: '', scheduledPublishAt: '', scheduledUnpublishAt: '', revisionReason: '' });
const form = reactive<PostForm>(initialForm());
const isEdit = computed(() => Boolean(route.params.id));
const canCreatePost = computed(() => authStore.hasPermission('posts.create'));
const canUpdatePost = computed(() => authStore.hasPermission('posts.update'));
const canPublishPost = computed(() => authStore.hasPermission('posts.publish'));
const canFeaturePost = computed(() => authStore.hasPermission('posts.feature'));
const canViewCategories = computed(() => authStore.hasPermission('categories.view'));
const canViewTags = computed(() => authStore.hasPermission('tags.view'));
const canViewMedia = computed(() => authStore.hasPermission('media.view'));
const canUploadMedia = computed(() => authStore.hasPermission('media.upload'));
const canImportMedia = computed(() => authStore.hasPermission('media.import'));
const canSavePost = computed(() => (isEdit.value ? canUpdatePost.value : canCreatePost.value));
const draftKey = computed(() => (isEdit.value ? `aurora_post_draft_${String(route.params.id)}` : 'aurora_post_draft_new'));
const hasUnsavedChanges = computed(() => currentSnapshot() !== serverSnapshot.value);
const selectedCategoryName = computed(() => getCategoryNameById(form.categoryId));
const overviewStatusText = computed(() => (form.status === 'PUBLISHED' ? '已发布' : '草稿中'));
const overviewStatusTone = computed(() => (form.status === 'PUBLISHED' ? 'published' : 'draft'));
const overviewStatusHint = computed(() => (form.status === 'PUBLISHED' ? '前台已经可以访问' : '还不会在前台显示'));
const tagSummaryText = computed(() => (form.tagIds.length ? `${form.tagIds.length} 个标签` : '未设置标签'));
const tagSummaryHint = computed(() => {
  const names = getTagNameList(form.tagIds);
  return names.length ? names.slice(0, 2).join(' · ') : '建议补 2-4 个主题标签';
});
const coverSummaryText = computed(() => (form.coverImage ? '封面已就绪' : '缺少封面'));
const coverSummaryHint = computed(() => (form.coverImage ? '列表和详情首屏观感更完整' : '建议补一张横向视觉图'));
const revisionSummaryText = computed(() => `${revisions.value.length} 个版本`);
const coverPreviewState = ref({ url: '', thumbUrl: '' });
const coverPreviewUrl = computed(() => {
  if (!form.coverImage.trim()) {
    return '';
  }
  return coverPreviewState.value.url === form.coverImage || coverPreviewState.value.thumbUrl === form.coverImage
    ? coverPreviewState.value.thumbUrl || form.coverImage
    : form.coverImage;
});
const draftBannerText = computed(() => (localDraft.value ? `本地草稿保存于 ${formatDateTime(localDraft.value.savedAt)}，可恢复继续编辑。` : ''));
const drawerWidth = computed(() => (window.innerWidth <= 900 ? '100vw' : '640px'));

async function loadOptions() {
  categories.value = canViewCategories.value ? await categoriesApi.list().catch(() => []) : [];
  tags.value = canViewTags.value ? await tagsApi.list().catch(() => []) : [];
  if (!canViewCategories.value) form.categoryId = undefined;
  if (!canViewTags.value) form.tagIds = [];
}

async function loadMedia(page = 1) {
  if (!canViewMedia.value) return;
  media.value = await mediaApi.list({
    page,
    pageSize: media.value.meta.pageSize,
  });
}

async function loadRevisions() {
  if (!isEdit.value) return (revisions.value = []);
  revisionsLoading.value = true;
  try { revisions.value = await postsApi.revisions(String(route.params.id)); } finally { revisionsLoading.value = false; }
}

function toPickerValue(value?: string | null) {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 16).replace('T', ' ') : value;
}

function normalizeDateTimeSubmit(value?: string | null) {
  if (!value?.trim()) return null;
  const normalized = value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function loadPost() {
  if (!isEdit.value) {
    applyForm(initialForm());
    coverPreviewState.value = { url: '', thumbUrl: '' };
    revisions.value = [];
    markServerSnapshot();
    return;
  }
  const detail = await postsApi.detail(String(route.params.id));
  applyForm({
    title: detail.title,
    excerpt: detail.excerpt,
    coverImage: detail.coverImage,
    content: detail.content,
    categoryId: detail.categoryId,
    status: detail.status,
    featured: detail.featured,
    tagIds: detail.tags.map((item: any) => item.id),
    seoTitle: detail.seoTitle,
    seoDescription: detail.seoDescription,
    scheduledPublishAt: toPickerValue(detail.scheduledPublishAt),
    scheduledUnpublishAt: toPickerValue(detail.scheduledUnpublishAt),
    revisionReason: '',
  });
  coverPreviewState.value = {
    url: detail.coverImage || '',
    thumbUrl: detail.coverThumbUrl || '',
  };
  await loadRevisions();
  markServerSnapshot();
}

function applyForm(payload: PostForm) { Object.assign(form, payload); }
function serializeForm(): PostForm { return { title: form.title.trim(), excerpt: form.excerpt, coverImage: form.coverImage.trim(), content: form.content, categoryId: form.categoryId || undefined, status: form.status, featured: form.featured, tagIds: [...form.tagIds], seoTitle: form.seoTitle.trim(), seoDescription: form.seoDescription.trim(), scheduledPublishAt: form.scheduledPublishAt, scheduledUnpublishAt: form.scheduledUnpublishAt, revisionReason: form.revisionReason.trim() }; }
function currentSnapshot() { return JSON.stringify(serializeForm()); }
function markServerSnapshot() { serverSnapshot.value = currentSnapshot(); }

function readServerForm(): PostForm | null {
  if (!serverSnapshot.value) return null;
  try {
    return JSON.parse(serverSnapshot.value) as PostForm;
  } catch {
    return null;
  }
}

function getCategoryNameById(id?: string) {
  return categories.value.find((item) => item.id === id)?.name || '未分类';
}

function getTagNameList(ids: string[]) {
  return ids
    .map((id) => tags.value.find((item) => item.id === id)?.name)
    .filter((item): item is string => Boolean(item));
}

function buildAutoRevisionReason() {
  const current = serializeForm();
  const previous = readServerForm();
  if (!previous) return '更新文章内容';

  const changes: string[] = [];

  if (current.title !== previous.title) changes.push('调整标题');
  if (current.excerpt.trim() !== previous.excerpt.trim()) changes.push('更新摘要');
  if (current.content.trim() !== previous.content.trim()) changes.push('修改正文');
  if (current.coverImage !== previous.coverImage) changes.push(current.coverImage ? '更换封面图' : '移除封面图');
  if (current.categoryId !== previous.categoryId) changes.push(`分类改为“${getCategoryNameById(current.categoryId)}”`);
  if (current.status !== previous.status) changes.push(current.status === 'PUBLISHED' ? '改为发布状态' : '切换为草稿');
  if (current.featured !== previous.featured) changes.push(current.featured ? '设为精选推荐' : '取消精选推荐');
  if (current.seoTitle !== previous.seoTitle) changes.push('更新 SEO 标题');
  if (current.seoDescription !== previous.seoDescription) changes.push('更新 SEO 描述');
  if (current.scheduledPublishAt !== previous.scheduledPublishAt) changes.push(current.scheduledPublishAt ? '调整定时发布时间' : '清除定时发布时间');
  if (current.scheduledUnpublishAt !== previous.scheduledUnpublishAt) changes.push(current.scheduledUnpublishAt ? '调整定时下线时间' : '清除定时下线时间');

  const currentTags = [...current.tagIds].sort();
  const previousTags = [...previous.tagIds].sort();
  if (JSON.stringify(currentTags) !== JSON.stringify(previousTags)) {
    const tagNames = getTagNameList(current.tagIds);
    changes.push(tagNames.length ? `调整标签为“${tagNames.join('、')}”` : '清空标签');
  }

  if (!changes.length) return '更新文章内容';
  return changes.slice(0, 3).join('，');
}

function serializeSubmitPayload() {
  const payload: Record<string, unknown> = {
    ...serializeForm(),
    revisionReason: form.revisionReason.trim() || buildAutoRevisionReason(),
    scheduledPublishAt: normalizeDateTimeSubmit(form.scheduledPublishAt),
    scheduledUnpublishAt: normalizeDateTimeSubmit(form.scheduledUnpublishAt),
  };
  if (!isEdit.value || canPublishPost.value) payload.status = form.status;
  if (!isEdit.value) {
    payload.featured = canFeaturePost.value ? form.featured : false;
    if (!canPublishPost.value && form.status === 'PUBLISHED') payload.status = 'DRAFT';
  } else if (canFeaturePost.value) payload.featured = form.featured;
  return payload;
}

async function submitForm() {
  if (!canSavePost.value) return Message.error('当前账号没有保存文章的权限');
  try {
    if (isEdit.value) {
      await postsApi.update(String(route.params.id), serializeSubmitPayload());
      await loadRevisions();
      markServerSnapshot();
      clearDraft();
      saveStatusText.value = '已保存到服务器';
      return Message.success('文章已保存');
    }
    const created = await postsApi.create(serializeSubmitPayload());
    clearDraft();
    markServerSnapshot();
    saveStatusText.value = '已保存到服务器';
    Message.success('文章已创建');
    await router.replace(`/posts/${created.id}/edit`);
  } catch {
    Message.error('保存失败，请检查内容是否完整');
  }
}

async function restoreRevision(item: PostRevisionSummary) {
  if (!isEdit.value) return;
  try {
    await postsApi.restoreRevision(String(route.params.id), item.id, { reason: form.revisionReason.trim() || `恢复到版本 #${item.version}` });
    await loadPost();
    clearDraft();
    saveStatusText.value = '已从修订历史恢复';
    Message.success(`已恢复到版本 #${item.version}`);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '恢复修订失败');
  }
}

function insertMedia(url: string) {
  form.content = `${form.content}\n\n![](${url})\n`;
  if (!form.coverImage) {
    form.coverImage = url;
    coverPreviewState.value = { url, thumbUrl: '' };
  }
  Message.success('图片已插入正文');
}

function openMediaPicker(mode: 'content' | 'cover') {
  if (!canViewMedia.value) return Message.error('当前账号没有查看媒体库的权限');
  mediaPickerMode.value = mode;
  mediaPickerVisible.value = true;
}

function handleMediaPick(item: MediaItem) {
  if (mediaPickerMode.value === 'cover') {
    form.coverImage = item.url;
    coverPreviewState.value = {
      url: item.url,
      thumbUrl: item.thumbUrl || '',
    };
    return Message.success('已设为封面图片');
  }
  insertMedia(item.url);
}

function handleRecentMediaClick(item: MediaItem) {
  mediaPickerMode.value = 'content';
  handleMediaPick(item);
}

async function handleUploadImages(files: File[], callback: (urls: string[]) => void) {
  if (!canUploadMedia.value) return Message.error('当前账号没有上传媒体的权限');
  try {
    const uploaded = await Promise.all(files.map((file) => mediaApi.upload(file)));
    const urls = uploaded.map((item) => item.url);
    callback(urls);
    if (!form.coverImage && uploaded[0]) {
      form.coverImage = uploaded[0].url;
      coverPreviewState.value = {
        url: uploaded[0].url,
        thumbUrl: uploaded[0].thumbUrl || '',
      };
    }
    await loadMedia(1);
    Message.success('图片已上传并插入正文');
  } catch {
    Message.error('图片上传失败');
  }
}

async function handleQuickUpload(fileList: any[]) {
  const file = fileList.at(-1)?.file;
  if (!file) return;
  if (!canUploadMedia.value) return Message.error('当前账号没有上传媒体的权限');
  try {
    const uploaded = await mediaApi.upload(file);
    if (mediaPickerMode.value === 'cover' && mediaPickerVisible.value) {
      form.coverImage = uploaded.url;
      coverPreviewState.value = {
        url: uploaded.url,
        thumbUrl: uploaded.thumbUrl || '',
      };
      Message.success('上传成功，已设为封面');
    } else {
      insertMedia(uploaded.url);
    }
    await loadMedia(1);
  } catch {
    Message.error('上传失败');
  }
}

function clearCoverImage() {
  form.coverImage = '';
  coverPreviewState.value = { url: '', thumbUrl: '' };
}

function goBack() { void router.push('/posts'); }
function formatDateTime(value: string) { return dateFormatter.format(new Date(value)); }
function readDraft(): DraftPayload | null {
  const raw = localStorage.getItem(draftKey.value);
  if (!raw) return null;
  try { return JSON.parse(raw) as DraftPayload; } catch { localStorage.removeItem(draftKey.value); return null; }
}

function clearDraft() { localStorage.removeItem(draftKey.value); localDraft.value = null; draftBannerVisible.value = false; }

function saveDraft() {
  if (suppressAutoSave.value) return;
  const snapshot = currentSnapshot();
  if (snapshot === serverSnapshot.value) {
    clearDraft();
    saveStatusText.value = '已与服务器同步';
    return;
  }
  const payload: DraftPayload = { savedAt: new Date().toISOString(), data: serializeForm() };
  localStorage.setItem(draftKey.value, JSON.stringify(payload));
  localDraft.value = payload;
  saveStatusText.value = `草稿已自动保存 · ${formatDateTime(payload.savedAt)}`;
}

function scheduleAutoSave() {
  if (suppressAutoSave.value) return;
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  saveStatusText.value = hasUnsavedChanges.value ? '正在编辑，等待自动保存…' : '已与服务器同步';
  autoSaveTimer = setTimeout(saveDraft, 800);
}

function checkDraftBanner() {
  const draft = readDraft();
  localDraft.value = draft;
  draftBannerVisible.value = !!draft && JSON.stringify(draft.data) !== serverSnapshot.value;
}

function restoreDraft() {
  if (!localDraft.value) return;
  restoringDraft.value = true;
  applyForm(localDraft.value.data);
  draftBannerVisible.value = false;
  saveStatusText.value = `已恢复本地草稿 · ${formatDateTime(localDraft.value.savedAt)}`;
  setTimeout(() => { restoringDraft.value = false; }, 0);
}

function discardDraft() {
  clearDraft();
  saveStatusText.value = hasUnsavedChanges.value ? '当前内容尚未保存' : '已与服务器同步';
  Message.success('本地草稿已丢弃');
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value) return;
  event.preventDefault();
  event.returnValue = '';
}

watch(() => currentSnapshot(), () => { if (!suppressAutoSave.value && !restoringDraft.value) scheduleAutoSave(); });
onBeforeRouteLeave(() => (!hasUnsavedChanges.value ? true : window.confirm('当前有未保存内容，确认离开当前编辑页吗？')));

onMounted(async () => {
  suppressAutoSave.value = true;
  await Promise.all([loadOptions(), loadMedia(), loadPost()]);
  checkDraftBanner();
  saveStatusText.value = '已与服务器同步';
  suppressAutoSave.value = false;
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
.editor-page{display:grid;height:100%;min-height:0}
.draft-alert{margin-bottom:16px}
.draft-alert-content{display:flex;align-items:center;justify-content:space-between;gap:12px}
.editor-overview{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1.8fr) auto;gap:16px;align-items:start;margin-bottom:16px;padding:18px 20px;border:1px solid color-mix(in srgb,var(--admin-border) 78%,rgb(59 130 246 / .12));border-radius:24px;background:radial-gradient(circle at top right,rgb(59 130 246 / .12),transparent 26%),linear-gradient(180deg,color-mix(in srgb,var(--admin-surface-strong) 96%,white 4%),color-mix(in srgb,var(--admin-surface) 94%,transparent));box-shadow:0 18px 42px rgb(15 23 42 / .06)}
.editor-overview__summary{display:grid;gap:8px;min-width:0}
.editor-overview__eyebrow{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgb(59 130 246)}
.editor-overview__headline{display:grid;gap:5px;min-width:0}
.editor-overview__headline strong{overflow:hidden;color:var(--admin-text);font-size:22px;line-height:1.18;text-overflow:ellipsis;white-space:nowrap}
.editor-overview__headline span{color:var(--admin-text-secondary);font-size:13px;line-height:1.5}
.editor-overview__meta{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.overview-chip{position:relative;display:grid;gap:6px;min-width:0;padding:14px 14px 13px;border-radius:18px;background:linear-gradient(180deg,rgb(255 255 255 / .86),rgb(247 249 252 / .92));border:1px solid color-mix(in srgb,var(--admin-border) 74%,rgb(255 255 255 / .36));box-shadow:inset 0 1px 0 rgb(255 255 255 / .74)}
.overview-chip::before{content:"";position:absolute;left:14px;top:12px;width:7px;height:7px;border-radius:999px;background:var(--overview-chip-accent,#3b82f6);box-shadow:0 0 0 5px color-mix(in srgb,var(--overview-chip-accent,#3b82f6) 16%,transparent)}
.overview-chip[data-tone='published']{--overview-chip-accent:#22c55e}
.overview-chip[data-tone='draft']{--overview-chip-accent:#f59e0b}
.overview-chip[data-tone='category']{--overview-chip-accent:#3b82f6}
.overview-chip[data-tone='tags']{--overview-chip-accent:#d946ef}
.overview-chip[data-tone='cover']{--overview-chip-accent:#f97316}
.overview-chip[data-tone='revision']{--overview-chip-accent:#8b5cf6}
.overview-chip__label,.save-status,.revision-card__meta span,.revision-card__meta small,.sidebar-card__header span,.cover-selector-card__meta span{color:var(--admin-text-secondary);font-size:12px}
.overview-chip__label{padding-left:16px;font-weight:700;letter-spacing:.02em}
.overview-chip strong{overflow:hidden;color:var(--admin-text);font-size:16px;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}
.overview-chip small{overflow:hidden;color:var(--admin-text-secondary);font-size:12px;line-height:1.45;text-overflow:ellipsis;white-space:nowrap}
.editor-overview__actions{display:grid;justify-items:end;gap:12px;align-self:stretch}
.save-status{display:inline-flex;align-items:center;justify-content:flex-end;min-height:20px;padding-top:2px;text-align:right}
.editor-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;min-height:0}
.editor-main,.editor-sidebar{min-height:0}
.editor-main{display:flex;min-width:0}
.editor-form{display:flex;flex:1;min-height:0;flex-direction:column}
.editor-content-item{flex:1;min-height:0}
.editor-content-item :deep(.arco-form-item-content){min-height:0}
.editor-sidebar{display:grid;gap:14px;overflow:auto;align-content:start;padding:4px}
.sidebar-card{display:grid;gap:16px;padding:18px;border:1px solid var(--admin-border);border-radius:22px;background:color-mix(in srgb,var(--admin-surface-strong) 92%,transparent)}
.sidebar-card__header,.schedule-panel__header,.revision-card__meta,.panel-copy,.cover-selector-card__meta{display:grid;gap:4px}
.sidebar-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px}
.schedule-panel{display:grid;gap:12px;padding:14px;border-radius:16px;background:var(--color-fill-1);border:1px solid var(--color-neutral-3)}
.pro-editor{height:min(76vh,960px)}
.cover-field{display:grid;grid-template-columns:160px minmax(0,1fr);gap:14px;align-items:start}
.cover-field__controls{display:grid;gap:12px;min-width:0}
.cover-selector-card{display:grid;gap:10px;width:160px;padding:10px;border:1px solid var(--color-neutral-3);border-radius:16px;background:linear-gradient(180deg,rgb(255 255 255 / .98),rgb(246 248 252 / .96));box-shadow:0 10px 24px rgb(15 23 42 / .05);text-align:left;cursor:pointer;transition:transform 220ms ease,box-shadow 220ms ease,border-color 220ms ease}
.cover-selector-card:hover{transform:translateY(-4px);border-color:rgb(var(--primary-6));box-shadow:0 18px 36px rgb(15 23 42 / .1)}
.cover-selector-card__media{overflow:hidden;border-radius:12px;background:var(--color-fill-2);aspect-ratio:5/6}
.cover-selector-card__media img{display:block;width:100%;height:100%;object-fit:cover}
.cover-selector-card__placeholder,.thumb-placeholder{display:grid;place-items:center;background:var(--color-fill-2);color:var(--color-text-3);font-size:11px;text-align:center}
.cover-selector-card__placeholder{width:100%;height:100%}
.cover-selector-card__meta strong{font-size:13px;line-height:1.4}
.cover-actions{display:flex;flex-wrap:wrap;gap:10px}
.media-strip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.media-chip{display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:10px;padding:8px;border:1px solid var(--color-neutral-3);border-radius:12px;background:var(--color-bg-2);cursor:pointer;text-align:left}
.media-chip img,.thumb-placeholder{width:48px;height:48px;border-radius:10px;object-fit:cover}
.media-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.revision-list{display:grid;gap:10px}
.revision-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border-radius:16px;background:var(--color-fill-1);border:1px solid var(--color-neutral-3)}
.media-chip:hover{border-color:rgb(var(--primary-6))}
[data-admin-theme='dark'] .cover-selector-card{background:linear-gradient(180deg,rgb(20 29 43 / .98),rgb(16 24 37 / .96));box-shadow:0 12px 28px rgb(0 0 0 / .22)}
[data-admin-theme='dark'] .cover-selector-card:hover{box-shadow:0 20px 40px rgb(0 0 0 / .3)}
.settings-drawer :deep(.arco-drawer-body){padding:0;background:var(--color-bg-1)}
.settings-drawer :deep(.arco-drawer-header){padding:18px 20px;border-bottom:1px solid var(--admin-border)}
@media (max-width:1400px){.editor-overview{grid-template-columns:minmax(0,1fr)}.editor-overview__meta{grid-template-columns:repeat(3,minmax(0,1fr))}.editor-overview__actions{justify-items:start}}
@media (max-width:1200px){.draft-alert-content{flex-direction:column;align-items:flex-start}.editor-overview__meta{grid-template-columns:repeat(2,minmax(0,1fr))}.pro-editor{height:62vh}}
@media (max-width:768px){.sidebar-grid,.media-strip,.cover-field,.editor-overview__meta{grid-template-columns:1fr}.revision-card{grid-template-columns:1fr}.editor-overview{padding:16px}.editor-overview__headline strong{font-size:18px}.overview-chip small,.overview-chip strong{white-space:normal}.cover-selector-card{width:100%}}
</style>
