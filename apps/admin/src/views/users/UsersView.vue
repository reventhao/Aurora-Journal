<template>
  <a-card :bordered="false" class="users-card">
    <template #title>用户管理</template>

    <div class="toolbar">
      <a-input-search v-model="keyword" allow-clear placeholder="搜索姓名、邮箱或角色" class="toolbar-search" />
      <a-select
        v-model="selectedRoleId"
        allow-clear
        placeholder="按角色筛选"
        class="toolbar-select"
        :style="selectWidth"
        @change="handleRoleFilterChange"
        @clear="clearRoleFilter"
      >
        <a-option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</a-option>
      </a-select>
      <a-button v-if="canManageUsers" type="primary" @click="openCreateModal">新建用户</a-button>
    </div>

    <div v-if="activeRoleName" class="toolbar-meta">
      <a-tag color="arcoblue" bordered>角色筛选：{{ activeRoleName }}</a-tag>
    </div>

    <a-alert v-if="loadError" type="error" :show-icon="true" class="page-alert">{{ loadError }}</a-alert>

    <a-table :data="filteredUsers" row-key="id" :pagination="{ pageSize: 10 }" :loading="loading" :scroll="{ x: 1380 }">
      <template #empty>
        <div class="table-empty">
          <strong>{{ keyword || selectedRoleId ? '没有匹配的用户' : '暂无用户' }}</strong>
          <span>{{ keyword || selectedRoleId ? '调整筛选条件后再试。' : '新建后会显示在这里。' }}</span>
        </div>
      </template>
      <template #columns>
        <a-table-column title="用户" :width="280">
          <template #cell="{ record }">
            <div class="user-cell">
              <a-avatar class="user-avatar" :image-url="record.avatar || ''">{{ record.name?.slice(0, 1) || 'U' }}</a-avatar>
              <div class="user-copy">
                <strong>{{ record.name }}</strong>
                <p>{{ record.email }}</p>
                <span v-if="record.jobTitle">{{ record.jobTitle }}</span>
              </div>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="状态" :width="110" align="center">
          <template #cell="{ record }">
            <a-tag :color="record.status === 'ACTIVE' ? 'green' : 'red'">
              {{ record.status === 'ACTIVE' ? '正常' : '已封禁' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="角色" :width="320">
          <template #cell="{ record }">
            <div class="role-stack">
              <a-tag v-for="role in record.roles" :key="role.id" color="arcoblue" bordered>{{ role.name }}</a-tag>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="资料" :width="220">
          <template #cell="{ record }">
            <div class="info-stack">
              <span>{{ record.location || '未设置地区' }}</span>
              <span>{{ record.phone || '未设置手机' }}</span>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="权限数" :width="90" align="center">
          <template #cell="{ record }">{{ record.permissions.length }}</template>
        </a-table-column>
        <a-table-column title="最近改密" :width="176">
          <template #cell="{ record }">{{ record.passwordUpdatedAt ? formatDate(record.passwordUpdatedAt) : '未修改' }}</template>
        </a-table-column>
        <a-table-column title="创建时间" :width="176">
          <template #cell="{ record }">{{ formatDate(record.createdAt) }}</template>
        </a-table-column>
        <a-table-column title="操作" :width="340" fixed="right">
          <template #cell="{ record }">
            <a-space wrap>
              <a-button v-if="canManageUsers" size="mini" @click="openEditModal(record)">编辑</a-button>
              <a-button v-if="canManageUsers" size="mini" @click="openPasswordModal(record)">修改密码</a-button>
              <a-button
                v-if="canManageUsers && !isProtectedUser(record)"
                size="mini"
                :status="record.status === 'ACTIVE' ? 'warning' : 'success'"
                @click="toggleUserStatus(record)"
              >
                {{ record.status === 'ACTIVE' ? '封禁' : '解封' }}
              </a-button>
              <a-popconfirm
                v-if="canManageUsers && !isProtectedUser(record)"
                content="确认删除该用户吗？"
                @ok="removeUser(record.id)"
              >
                <a-button size="mini" status="danger">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </a-card>

  <a-modal
    v-model:visible="editorVisible"
    :title="editorMode === 'create' ? '新建用户' : '编辑用户'"
    :width="820"
    :ok-loading="saving"
    :ok-button-props="{ disabled: editorInvalid }"
    unmount-on-close
    @ok="submitEditor"
    @cancel="handleEditorCancel"
  >
    <a-alert v-if="editorError" type="error" :show-icon="true" class="modal-alert">{{ editorError }}</a-alert>

    <div class="avatar-panel">
      <a-avatar :size="72" :image-url="editorAvatarPreview" class="editor-avatar">{{ editorForm.name?.slice(0, 1) || 'U' }}</a-avatar>
      <div class="avatar-panel__body">
        <div class="avatar-panel__actions">
          <a-button @click="pickRandomPexelsAvatar">随机 Pexels</a-button>
          <a-button :disabled="!canViewMedia" @click="openAvatarPicker">媒体库选择</a-button>
          <a-button @click="clearAvatar">清空头像</a-button>
        </div>
        <a-input v-model="editorForm.avatar" placeholder="也可以手动填写头像地址" />
        <small v-if="fieldErrors.avatar" class="field-error">{{ fieldErrors.avatar }}</small>
      </div>
    </div>

    <a-form layout="vertical" :model="editorForm" class="editor-form-grid">
      <a-form-item field="name" label="姓名" :validate-status="fieldErrors.name ? 'error' : undefined" :help="fieldErrors.name">
        <a-input v-model="editorForm.name" placeholder="请输入姓名" />
      </a-form-item>
      <a-form-item field="email" label="邮箱" :validate-status="fieldErrors.email ? 'error' : undefined" :help="fieldErrors.email">
        <a-input v-model="editorForm.email" placeholder="请输入邮箱" />
      </a-form-item>
      <a-form-item field="jobTitle" label="职位">
        <a-input v-model="editorForm.jobTitle" placeholder="例如：内容编辑、前端工程师" />
      </a-form-item>
      <a-form-item field="phone" label="手机号">
        <a-input v-model="editorForm.phone" placeholder="请输入手机号" />
      </a-form-item>
      <a-form-item field="location" label="所在地">
        <a-input v-model="editorForm.location" placeholder="例如：上海 / 远程" />
      </a-form-item>
      <a-form-item field="website" label="个人网站" :validate-status="fieldErrors.website ? 'error' : undefined" :help="fieldErrors.website">
        <a-input v-model="editorForm.website" placeholder="https://..." />
      </a-form-item>
      <a-form-item class="editor-form-grid__full" field="bio" label="简介">
        <a-textarea v-model="editorForm.bio" :auto-size="{ minRows: 3, maxRows: 5 }" placeholder="补充这个用户的简介、职责或备注" />
      </a-form-item>
      <a-form-item
        class="editor-form-grid__full"
        field="roleIds"
        label="角色"
        :validate-status="fieldErrors.roleIds ? 'error' : undefined"
        :help="fieldErrors.roleIds"
      >
        <a-select v-model="editorForm.roleIds" multiple allow-search placeholder="至少选择一个角色">
          <a-option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</a-option>
        </a-select>
      </a-form-item>
      <a-form-item
        v-if="editorMode === 'create'"
        class="editor-form-grid__full"
        field="password"
        label="初始密码"
        :validate-status="fieldErrors.password ? 'error' : undefined"
        :help="fieldErrors.password"
      >
        <a-input-password v-model="editorForm.password" placeholder="至少 8 位" />
      </a-form-item>
    </a-form>
  </a-modal>

  <MediaPickerDialog
    v-model:visible="avatarPickerVisible"
    title="选择头像"
    :selected-url="editorForm.avatar"
    :allow-upload="canUploadMedia"
    :allow-external="canImportMedia"
    aspect-ratio="1 / 1"
    upload-button-text="上传头像"
    @select="handleAvatarPick"
  />

  <a-modal
    v-model:visible="passwordVisible"
    title="修改密码"
    :ok-loading="passwordSaving"
    :ok-button-props="{ disabled: passwordInvalid }"
    unmount-on-close
    @ok="submitPassword"
    @cancel="handlePasswordCancel"
  >
    <a-alert v-if="passwordError" type="error" :show-icon="true" class="modal-alert">{{ passwordError }}</a-alert>
    <a-form layout="vertical" :model="passwordForm">
      <a-form-item field="password" label="新密码" :validate-status="passwordFieldError ? 'error' : undefined" :help="passwordFieldError">
        <a-input-password v-model="passwordForm.password" placeholder="至少 8 位" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import type { ExternalMediaItem, MediaItem, PaginatedResponse, RoleSummary, UserSummary } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { mediaApi, rolesApi, usersApi } from '../../api/modules';
import MediaPickerDialog from '../../components/media/MediaPickerDialog.vue';
import { useAuthStore } from '../../stores/auth';

type UserFieldErrors = {
  name: string;
  email: string;
  avatar: string;
  website: string;
  password: string;
  roleIds: string;
};

const PROTECTED_ADMIN_EMAILS = ['admin@aurora.local'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_PATTERN = /^(https?:\/\/.+|\/.+)$/i;
const URL_PATTERN = /^https?:\/\/.+/i;
const PEXELS_KEYWORDS = ['portrait', 'workspace portrait', 'creative people', 'developer portrait', 'designer portrait', 'team avatar'];

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const canManageUsers = computed(() => authStore.hasPermission('users.manage'));
const canViewRoles = computed(() => authStore.hasPermission('roles.view'));
const canViewMedia = computed(() => authStore.hasPermission('media.view'));
const canUploadMedia = computed(() => authStore.hasPermission('media.upload'));
const canImportMedia = computed(() => authStore.hasPermission('media.import'));

const users = ref<UserSummary[]>([]);
const roles = ref<RoleSummary[]>([]);
const keyword = ref('');
const loading = ref(false);
const loadError = ref('');
const selectedRoleId = ref('');
const avatarPickerVisible = ref(false);
const editorVisible = ref(false);
const passwordVisible = ref(false);
const saving = ref(false);
const passwordSaving = ref(false);
const editorMode = ref<'create' | 'edit'>('create');
const currentUserId = ref('');
const editorError = ref('');
const passwordError = ref('');
const passwordFieldError = ref('');
const pexelsLoading = ref(false);

const editorForm = reactive({
  name: '',
  email: '',
  avatar: '',
  jobTitle: '',
  phone: '',
  location: '',
  website: '',
  bio: '',
  password: '',
  roleIds: [] as string[],
});
const passwordForm = reactive({ password: '' });
const fieldErrors = reactive<UserFieldErrors>({ name: '', email: '', avatar: '', website: '', password: '', roleIds: '' });

const dateFormatter = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
const selectWidth = { width: '144px', minWidth: '144px' };
const activeRoleName = computed(() => roles.value.find((role) => role.id === selectedRoleId.value)?.name || '');
const editorAvatarPreview = computed(() => editorForm.avatar.trim());

const filteredUsers = computed(() => {
  const term = keyword.value.trim().toLowerCase();
  return users.value.filter((user) => {
    const matchesRole = !selectedRoleId.value || user.roles.some((role) => role.id === selectedRoleId.value);
    if (!matchesRole) return false;
    if (!term) return true;
    const roleNames = user.roles.map((role) => role.name).join(' ');
    const profileTerms = [user.jobTitle, user.location, user.phone].join(' ');
    return [user.name, user.email, roleNames, profileTerms].some((value) => value.toLowerCase().includes(term));
  });
});

const editorInvalid = computed(() => Boolean(validateEditor(false)));
const passwordInvalid = computed(() => Boolean(validatePassword(false)));

function syncRoleFilterFromRoute() {
  selectedRoleId.value = typeof route.query.role === 'string' ? route.query.role : '';
}

async function loadPageData() {
  loading.value = true;
  loadError.value = '';
  try {
    const userList = await usersApi.list();
    users.value = userList;
    if (canViewRoles.value) {
      roles.value = await rolesApi.list();
    } else {
      const roleMap = new Map<string, RoleSummary>();
      for (const user of userList) {
        for (const role of user.roles) roleMap.set(role.id, role);
      }
      roles.value = [...roleMap.values()].sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
    }
    if (selectedRoleId.value && !roles.value.some((role) => role.id === selectedRoleId.value)) {
      selectedRoleId.value = '';
      void router.replace({ query: { ...route.query, role: undefined } });
    }
  } catch (error: any) {
    users.value = [];
    roles.value = [];
    loadError.value = error?.response?.data?.message || '加载用户列表失败';
    Message.error(loadError.value);
  } finally {
    loading.value = false;
  }
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function isProtectedUser(user: UserSummary) {
  return PROTECTED_ADMIN_EMAILS.includes(user.email.toLowerCase());
}

function resetFieldErrors() {
  fieldErrors.name = '';
  fieldErrors.email = '';
  fieldErrors.avatar = '';
  fieldErrors.website = '';
  fieldErrors.password = '';
  fieldErrors.roleIds = '';
}

function validateEditor(showErrors: boolean) {
  const nextErrors: UserFieldErrors = { name: '', email: '', avatar: '', website: '', password: '', roleIds: '' };
  if (editorForm.name.trim().length < 2) nextErrors.name = '姓名至少 2 个字';
  if (!EMAIL_PATTERN.test(editorForm.email.trim())) nextErrors.email = '请输入有效邮箱';
  if (editorForm.avatar.trim() && !AVATAR_PATTERN.test(editorForm.avatar.trim())) nextErrors.avatar = '头像地址必须是 http(s) 或站内 / 路径';
  if (editorForm.website.trim() && !URL_PATTERN.test(editorForm.website.trim())) nextErrors.website = '个人网站必须是 http 或 https 链接';
  if (!editorForm.roleIds.length) nextErrors.roleIds = '至少选择一个角色';
  if (editorMode.value === 'create' && editorForm.password.trim().length < 8) nextErrors.password = '初始密码至少 8 位';
  if (showErrors) Object.assign(fieldErrors, nextErrors);
  return Object.values(nextErrors).find(Boolean) || '';
}

function validatePassword(showErrors: boolean) {
  const message = passwordForm.password.trim().length < 8 ? '新密码至少 8 位' : '';
  if (showErrors) passwordFieldError.value = message;
  return message;
}

function resetEditorForm() {
  editorForm.name = '';
  editorForm.email = '';
  editorForm.avatar = '';
  editorForm.jobTitle = '';
  editorForm.phone = '';
  editorForm.location = '';
  editorForm.website = '';
  editorForm.bio = '';
  editorForm.password = '';
  editorForm.roleIds = [];
  currentUserId.value = '';
  editorError.value = '';
  resetFieldErrors();
}

function handleEditorCancel() {
  saving.value = false;
  editorError.value = '';
  resetFieldErrors();
}

function handlePasswordCancel() {
  passwordSaving.value = false;
  passwordError.value = '';
  passwordFieldError.value = '';
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
    editorForm.avatar = picked.previewUrl || picked.thumbUrl || picked.url;
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '获取 Pexels 头像失败');
  } finally {
    pexelsLoading.value = false;
  }
}

function clearAvatar() {
  editorForm.avatar = '';
}

function openAvatarPicker() {
  avatarPickerVisible.value = true;
}

function handleAvatarPick(item: MediaItem) {
  editorForm.avatar = item.thumbUrl || item.url;
}

function openCreateModal() {
  editorMode.value = 'create';
  resetEditorForm();
  if (roles.value.length > 0) editorForm.roleIds = [roles.value[0].id];
  editorVisible.value = true;
  if (!editorForm.avatar.trim()) {
    void pickRandomPexelsAvatar();
  }
}

function openEditModal(user: UserSummary) {
  editorMode.value = 'edit';
  resetEditorForm();
  currentUserId.value = user.id;
  editorForm.name = user.name;
  editorForm.email = user.email;
  editorForm.avatar = user.avatar || '';
  editorForm.jobTitle = user.jobTitle || '';
  editorForm.phone = user.phone || '';
  editorForm.location = user.location || '';
  editorForm.website = user.website || '';
  editorForm.bio = user.bio || '';
  editorForm.roleIds = user.roles.map((role) => role.id);
  editorVisible.value = true;
}

async function submitEditor() {
  if (saving.value) return;
  editorError.value = '';
  const validationError = validateEditor(true);
  if (validationError) return;

  const payload = {
    name: editorForm.name.trim(),
    email: editorForm.email.trim(),
    avatar: editorForm.avatar.trim(),
    jobTitle: editorForm.jobTitle.trim(),
    phone: editorForm.phone.trim(),
    location: editorForm.location.trim(),
    website: editorForm.website.trim(),
    bio: editorForm.bio.trim(),
    roleIds: [...editorForm.roleIds],
  };

  saving.value = true;
  try {
    if (editorMode.value === 'create') {
      await usersApi.create({ ...payload, password: editorForm.password.trim() });
      Message.success('用户已创建');
    } else {
      await usersApi.update(currentUserId.value, payload);
      if (authStore.user?.id === currentUserId.value) await authStore.fetchProfile(true);
      Message.success('用户信息已更新');
    }
    editorVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    editorError.value = error?.response?.data?.message || '用户保存失败';
  } finally {
    saving.value = false;
  }
}

function openPasswordModal(user: UserSummary) {
  currentUserId.value = user.id;
  passwordForm.password = '';
  passwordError.value = '';
  passwordFieldError.value = '';
  passwordVisible.value = true;
}

async function submitPassword() {
  if (passwordSaving.value) return;
  passwordError.value = '';
  const validationError = validatePassword(true);
  if (validationError) return;
  passwordSaving.value = true;
  try {
    await usersApi.updatePassword(currentUserId.value, passwordForm.password.trim());
    passwordVisible.value = false;
    Message.success('密码已更新');
    await loadPageData();
  } catch (error: any) {
    passwordError.value = error?.response?.data?.message || '密码更新失败';
  } finally {
    passwordSaving.value = false;
  }
}

async function toggleUserStatus(user: UserSummary) {
  try {
    const nextStatus = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    await usersApi.updateStatus(user.id, nextStatus);
    user.status = nextStatus;
    if (authStore.user?.id === user.id) await authStore.fetchProfile(true);
    Message.success(`${user.name} 已${nextStatus === 'ACTIVE' ? '解封' : '封禁'}`);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '更新用户状态失败');
  }
}

async function removeUser(id: string) {
  try {
    await usersApi.remove(id);
    Message.success('用户已删除');
    await loadPageData();
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除用户失败');
  }
}

function handleRoleFilterChange(value: string | number | Record<string, any> | (string | number | Record<string, any>)[] | undefined) {
  selectedRoleId.value = typeof value === 'string' ? value : '';
  void router.replace({ query: { ...route.query, role: selectedRoleId.value || undefined } });
}

function clearRoleFilter() {
  selectedRoleId.value = '';
  void router.replace({ query: { ...route.query, role: undefined } });
}

watch(() => route.query.role, syncRoleFilterFromRoute);

onMounted(() => {
  syncRoleFilterFromRoute();
  void loadPageData();
});
</script>

<style scoped>
.users-card {
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
  width: 240px;
  min-width: 240px;
  flex: none;
}

.toolbar-select {
  width: 144px;
  min-width: 144px;
  flex: none;
}

.toolbar > .arco-btn {
  flex: none;
  white-space: nowrap;
}

.toolbar-meta,
.modal-alert {
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  flex: none;
}

.user-copy,
.info-stack {
  display: grid;
  gap: 4px;
}

.user-copy strong {
  color: var(--admin-text);
}

.user-copy p,
.user-copy span,
.info-stack span,
.avatar-panel small {
  margin: 0;
  color: var(--admin-text-secondary);
}

.field-error {
  color: rgb(var(--danger-6));
}

.role-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.avatar-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--admin-border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--admin-surface-strong) 96%, transparent);
}

.avatar-panel__body {
  display: grid;
  gap: 10px;
}

.avatar-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.editor-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.editor-form-grid__full {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .avatar-panel,
  .editor-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
