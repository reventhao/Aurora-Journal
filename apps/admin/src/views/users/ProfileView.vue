<template>
  <div class="profile-page">
    <a-card :bordered="false" class="profile-summary-card" :loading="loading">
      <div class="profile-summary">
        <a-avatar :size="88" :image-url="avatarPreview" class="profile-summary__avatar">{{ form.name?.slice(0, 1) || 'U' }}</a-avatar>
        <div class="profile-summary__copy">
          <strong>{{ form.name || authStore.user?.name || '未设置姓名' }}</strong>
          <span>{{ authStore.user?.email || '未设置邮箱' }}</span>
          <div class="profile-summary__meta">
            <a-tag :color="authStore.user?.status === 'ACTIVE' ? 'green' : 'red'">
              {{ authStore.user?.status === 'ACTIVE' ? '正常' : '已封禁' }}
            </a-tag>
            <a-tag v-for="role in authStore.user?.roles || []" :key="role.id" color="arcoblue" bordered>{{ role.name }}</a-tag>
          </div>
        </div>
      </div>
    </a-card>

    <div class="profile-grid">
      <a-card :bordered="false" class="profile-card" :loading="loading">
        <template #title>个人资料</template>

        <a-alert v-if="loadError" type="error" :show-icon="true" class="profile-alert">{{ loadError }}</a-alert>

        <div class="profile-avatar-panel">
          <a-avatar :size="80" :image-url="avatarPreview">{{ form.name?.slice(0, 1) || 'U' }}</a-avatar>
          <div class="profile-avatar-panel__body">
            <div class="profile-avatar-panel__actions">
              <a-button :loading="pexelsLoading" @click="pickRandomPexelsAvatar">随机 Pexels</a-button>
              <a-button :disabled="!canViewMedia" @click="openAvatarPicker">媒体库选择</a-button>
              <a-button @click="clearAvatar">清空头像</a-button>
            </div>
            <a-input v-model="form.avatar" placeholder="也可以手动填写头像地址" />
            <small>保存后右上角头像会同步更新。</small>
          </div>
        </div>

        <a-form layout="vertical" :model="form" class="profile-form-grid">
          <a-form-item field="name" label="姓名" :validate-status="fieldErrors.name ? 'error' : undefined" :help="fieldErrors.name">
            <a-input v-model="form.name" placeholder="请输入姓名" />
          </a-form-item>
          <a-form-item field="email" label="邮箱">
            <a-input :model-value="authStore.user?.email || ''" disabled />
          </a-form-item>
          <a-form-item field="jobTitle" label="职位">
            <a-input v-model="form.jobTitle" placeholder="例如：主编 / 设计师 / 工程师" />
          </a-form-item>
          <a-form-item field="phone" label="手机号">
            <a-input v-model="form.phone" placeholder="请输入手机号" />
          </a-form-item>
          <a-form-item field="location" label="所在地">
            <a-input v-model="form.location" placeholder="例如：上海 / 远程" />
          </a-form-item>
          <a-form-item field="website" label="个人网站" :validate-status="fieldErrors.website ? 'error' : undefined" :help="fieldErrors.website">
            <a-input v-model="form.website" placeholder="https://..." />
          </a-form-item>
          <a-form-item class="profile-form-grid__full" field="bio" label="简介">
            <a-textarea v-model="form.bio" :auto-size="{ minRows: 4, maxRows: 6 }" placeholder="介绍你的职责、擅长方向或个性签名" />
          </a-form-item>
        </a-form>

        <div class="profile-actions">
          <a-button type="primary" :loading="saving" :disabled="profileInvalid" @click="submitProfile">保存资料</a-button>
        </div>
      </a-card>

      <a-card :bordered="false" class="profile-card">
        <template #title>账户信息</template>
        <div class="account-meta">
          <div class="account-meta__item">
            <span>创建时间</span>
            <strong>{{ authStore.user ? formatDate(profileMeta.createdAt) : '-' }}</strong>
          </div>
          <div class="account-meta__item">
            <span>最近更新</span>
            <strong>{{ authStore.user ? formatDate(profileMeta.updatedAt) : '-' }}</strong>
          </div>
          <div class="account-meta__item">
            <span>最近改密</span>
            <strong>{{ profileMeta.passwordUpdatedAt ? formatDate(profileMeta.passwordUpdatedAt) : '未修改' }}</strong>
          </div>
        </div>
      </a-card>
    </div>

    <MediaPickerDialog
      v-model:visible="avatarPickerVisible"
      title="选择头像"
      :selected-url="form.avatar"
      :allow-upload="canUploadMedia"
      :allow-external="canImportMedia"
      aspect-ratio="1 / 1"
      upload-button-text="上传头像"
      @select="handleAvatarPick"
    />
  </div>
</template>

<script setup lang="ts">
import type { ExternalMediaItem, MediaItem, PaginatedResponse, UserSummary } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { mediaApi, usersApi } from '../../api/modules';
import MediaPickerDialog from '../../components/media/MediaPickerDialog.vue';
import { useAuthStore } from '../../stores/auth';

const URL_PATTERN = /^https?:\/\/.+/i;
const PEXELS_KEYWORDS = ['portrait', 'workspace portrait', 'creative people', 'developer portrait', 'designer portrait', 'team avatar'];

const authStore = useAuthStore();
const canViewMedia = computed(() => authStore.hasPermission('media.view'));
const canUploadMedia = computed(() => authStore.hasPermission('media.upload'));
const canImportMedia = computed(() => authStore.hasPermission('media.import'));
const loading = ref(false);
const saving = ref(false);
const loadError = ref('');
const pexelsLoading = ref(false);
const avatarPickerVisible = ref(false);

const form = reactive({
  name: '',
  avatar: '',
  jobTitle: '',
  phone: '',
  location: '',
  website: '',
  bio: '',
});

const profileMeta = reactive({
  createdAt: '',
  updatedAt: '',
  passwordUpdatedAt: '',
});

const fieldErrors = reactive({
  name: '',
  website: '',
  avatar: '',
});

const dateFormatter = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
const avatarPreview = computed(() => form.avatar.trim());
const profileInvalid = computed(() => Boolean(validateProfile(false)));

function formatDate(value: string) {
  return value ? dateFormatter.format(new Date(value)) : '-';
}

function assignProfile(profile: UserSummary) {
  form.name = profile.name || '';
  form.avatar = profile.avatar || '';
  form.jobTitle = profile.jobTitle || '';
  form.phone = profile.phone || '';
  form.location = profile.location || '';
  form.website = profile.website || '';
  form.bio = profile.bio || '';
  profileMeta.createdAt = profile.createdAt || '';
  profileMeta.updatedAt = profile.updatedAt || '';
  profileMeta.passwordUpdatedAt = profile.passwordUpdatedAt || '';
}

function resetFieldErrors() {
  fieldErrors.name = '';
  fieldErrors.website = '';
  fieldErrors.avatar = '';
}

function validateProfile(showErrors: boolean) {
  const nextErrors = { name: '', website: '', avatar: '' };
  if (form.name.trim().length < 2) nextErrors.name = '姓名至少 2 个字';
  if (form.website.trim() && !URL_PATTERN.test(form.website.trim())) nextErrors.website = '个人网站必须是 http 或 https 链接';
  if (form.avatar.trim() && !/^(https?:\/\/.+|\/.+)$/i.test(form.avatar.trim())) nextErrors.avatar = '头像地址必须是 http(s) 或站内 / 路径';
  if (showErrors) Object.assign(fieldErrors, nextErrors);
  return Object.values(nextErrors).find(Boolean) || '';
}

async function pickRandomPexelsAvatar() {
  pexelsLoading.value = true;
  try {
    const keyword = PEXELS_KEYWORDS[Math.floor(Math.random() * PEXELS_KEYWORDS.length)];
    const response = (await mediaApi.searchExternal({
      provider: 'pexels',
      keyword,
      page: 1,
      pageSize: 12,
    })) as PaginatedResponse<ExternalMediaItem>;

    if (!response.items.length) {
      Message.warning('没有找到可用的 Pexels 图片');
      return;
    }

    const picked = response.items[Math.floor(Math.random() * response.items.length)];
    form.avatar = picked.previewUrl || picked.thumbUrl || picked.url;
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '获取 Pexels 头像失败');
  } finally {
    pexelsLoading.value = false;
  }
}

function clearAvatar() {
  form.avatar = '';
}

function openAvatarPicker() {
  if (!canViewMedia.value) {
    Message.error('当前账号没有查看媒体库的权限');
    return;
  }
  avatarPickerVisible.value = true;
}

function handleAvatarPick(item: MediaItem) {
  form.avatar = item.thumbUrl || item.url;
}

async function loadProfile() {
  loading.value = true;
  loadError.value = '';
  try {
    const profile = await usersApi.profile();
    assignProfile(profile);
  } catch (error: any) {
    loadError.value = error?.response?.data?.message || '加载个人资料失败';
    Message.error(loadError.value);
  } finally {
    loading.value = false;
  }
}

async function submitProfile() {
  if (saving.value) return;
  const validationError = validateProfile(true);
  if (validationError) return;

  saving.value = true;
  try {
    await usersApi.updateProfile({
      name: form.name.trim(),
      avatar: form.avatar.trim(),
      jobTitle: form.jobTitle.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      website: form.website.trim(),
      bio: form.bio.trim(),
    });
    await authStore.fetchProfile(true);
    await loadProfile();
    Message.success('个人资料已保存');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '保存个人资料失败');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  resetFieldErrors();
  await loadProfile();
});
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: 16px;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(300px, 0.7fr);
  gap: 16px;
}

.profile-card,
.profile-summary-card {
  overflow: hidden;
}

.profile-summary,
.profile-avatar-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.profile-summary__copy,
.profile-avatar-panel__body,
.account-meta {
  display: grid;
  gap: 10px;
}

.profile-summary__copy strong {
  color: var(--admin-text);
  font-size: 20px;
}

.profile-summary__copy span,
.profile-avatar-panel small {
  color: var(--admin-text-secondary);
}

.profile-summary__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-alert {
  margin-bottom: 16px;
}

.profile-avatar-panel {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--admin-border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--admin-surface-strong) 96%, transparent);
}

.profile-avatar-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.profile-form-grid__full {
  grid-column: 1 / -1;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.account-meta__item {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--admin-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--admin-surface-strong) 96%, transparent);
}

.account-meta__item span {
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.account-meta__item strong {
  color: var(--admin-text);
}

@media (max-width: 1080px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .profile-summary,
  .profile-avatar-panel,
  .profile-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
