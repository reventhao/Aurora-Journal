<template>
  <a-card :bordered="false" class="roles-card">
    <template #title>角色权限</template>

    <div class="toolbar">
      <a-input v-model="keyword" allow-clear placeholder="搜索角色名称或编码" class="toolbar-search" />
      <a-button v-if="canManageRoles" type="primary" @click="openCreateModal">新建角色</a-button>
    </div>

    <a-alert v-if="loadError" type="error" :show-icon="true" class="page-alert">{{ loadError }}</a-alert>

    <a-table :data="filteredRoles" row-key="id" :pagination="{ pageSize: 10 }" :loading="loading">
      <template #empty>
        <div class="table-empty">
          <strong>{{ keyword ? '没有匹配的角色' : '暂无角色' }}</strong>
          <span>{{ keyword ? '换个关键词试试。' : '新建后会显示在这里。' }}</span>
        </div>
      </template>
      <template #columns>
        <a-table-column title="角色" :width="240">
          <template #cell="{ record }">
            <div class="role-title">
              <strong>{{ record.name }}</strong>
              <span>{{ record.code }}</span>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="说明">
          <template #cell="{ record }">{{ record.description || '未填写说明' }}</template>
        </a-table-column>
        <a-table-column title="权限" :width="260">
          <template #cell="{ record }">
            <div class="permission-tag-row">
              <a-tag v-for="permission in record.permissions.slice(0, 3)" :key="permission.code" size="small" bordered>
                {{ permission.name }}
              </a-tag>
              <a-tag v-if="record.permissions.length > 3" size="small" color="gray">+{{ record.permissions.length - 3 }}</a-tag>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="用户数" :width="100" align="center">
          <template #cell="{ record }">{{ record.userCount ?? 0 }}</template>
        </a-table-column>
        <a-table-column title="类型" :width="100" align="center">
          <template #cell="{ record }">
            <a-tag :color="record.isSystem ? 'gold' : 'gray'">{{ record.isSystem ? '系统' : '自定义' }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="260">
          <template #cell="{ record }">
            <a-space wrap>
              <a-button size="mini" @click="openUsersOfRole(record)">查看用户</a-button>
              <a-button v-if="canManageRoles" size="mini" @click="openDuplicateModal(record)">复制</a-button>
              <a-button v-if="canManageRoles" size="mini" @click="openEditModal(record)">编辑</a-button>
              <a-popconfirm
                v-if="canManageRoles && !record.isSystem && !record.userCount"
                content="确认删除该角色吗？"
                @ok="removeRole(record.id)"
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
    :title="editorTitle"
    width="min(1320px, calc(100vw - 32px))"
    :ok-loading="saving"
    :ok-button-props="{ disabled: editorInvalid }"
    modal-class="roles-editor-modal"
    @ok="submitEditor"
    @cancel="handleCancel"
  >
    <a-alert v-if="submitError" type="error" :show-icon="true" class="modal-alert">{{ submitError }}</a-alert>

    <a-form layout="vertical" :model="editorForm" class="role-editor-form">
      <div class="role-editor-topbar">
        <a-form-item field="name" label="角色名称" :validate-status="fieldErrors.name ? 'error' : undefined" :help="fieldErrors.name">
          <a-input v-model="editorForm.name" placeholder="例如：运营编辑" />
        </a-form-item>
        <a-form-item field="code" label="角色编码" :validate-status="fieldErrors.code ? 'error' : undefined" :help="fieldErrors.code">
          <a-input v-model="editorForm.code" :disabled="editorMode === 'edit' && currentRoleSystem" placeholder="例如：content-editor" />
        </a-form-item>
        <a-form-item field="description" label="角色说明" class="role-description-item">
          <a-input v-model="editorForm.description" placeholder="说明这个角色负责什么工作" :max-length="120" show-word-limit />
        </a-form-item>
      </div>

      <a-form-item
        field="permissions"
        label="权限"
        class="role-permission-item"
        :validate-status="fieldErrors.permissions ? 'error' : undefined"
        :help="fieldErrors.permissions"
      >
        <div class="permission-editor-shell permission-editor-shell-wide">
          <div class="permission-editor-summary">
            <div class="permission-summary-copy">
              <strong>权限配置</strong>
              <span>按模块勾选需要的权限，减少来回滚动。</span>
            </div>
            <a-tag color="arcoblue" bordered>已选择 {{ editorForm.permissions.length }} / {{ permissions.length }}</a-tag>
          </div>

          <div class="permission-group-grid">
            <section v-for="group in permissionGroups" :key="group.key" class="permission-group-card">
              <header class="permission-card-header">
                <div class="permission-card-title">
                  <strong>{{ group.label }}</strong>
                  <span>{{ selectedCount(group.key) }}/{{ group.items.length }}</span>
                </div>
                <a-button size="mini" type="text" @click="toggleGroup(group.key)">
                  {{ isGroupFullySelected(group.key) ? '取消全选' : '全选' }}
                </a-button>
              </header>

              <div class="permission-option-grid">
                <a-tooltip v-for="permission in group.items" :key="permission.code" :content="permission.description" mini>
                  <label class="permission-option-card" :class="{ 'permission-option-card-active': editorForm.permissions.includes(permission.code) }">
                    <a-checkbox :model-value="editorForm.permissions.includes(permission.code)" @change="togglePermission(permission.code)" />
                    <div class="permission-option-copy">
                      <strong>{{ permission.name }}</strong>
                      <code>{{ permission.code }}</code>
                    </div>
                  </label>
                </a-tooltip>
              </div>
            </section>
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import type { PermissionCode, PermissionDefinition, RoleSummary } from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { rolesApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';

type RoleEditorMode = 'create' | 'edit' | 'duplicate';
type RoleFieldErrors = { name: string; code: string; permissions: string };

const router = useRouter();
const authStore = useAuthStore();
const canManageRoles = computed(() => authStore.hasPermission('roles.manage'));

const groupLabels: Record<string, string> = {
  dashboard: '仪表盘',
  posts: '文章',
  categories: '分类',
  tags: '标签',
  comments: '评论',
  media: '媒体',
  users: '用户',
  roles: '角色',
  settings: '设置',
};

const roles = ref<RoleSummary[]>([]);
const permissions = ref<PermissionDefinition[]>([]);
const keyword = ref('');
const loading = ref(false);
const loadError = ref('');
const editorVisible = ref(false);
const saving = ref(false);
const editorMode = ref<RoleEditorMode>('create');
const currentRoleId = ref('');
const currentRoleSystem = ref(false);
const submitError = ref('');

const editorForm = reactive({
  name: '',
  code: '',
  description: '',
  permissions: [] as PermissionCode[],
});

const fieldErrors = reactive<RoleFieldErrors>({ name: '', code: '', permissions: '' });

const permissionGroups = computed(() =>
  Object.entries(
    permissions.value.reduce<Record<string, PermissionDefinition[]>>((accumulator, item) => {
      accumulator[item.group] ??= [];
      accumulator[item.group].push(item);
      return accumulator;
    }, {}),
  )
    .map(([key, items]) => ({ key, label: groupLabels[key] || key, items: [...items].sort((a, b) => a.code.localeCompare(b.code)) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN')),
);

const filteredRoles = computed(() => {
  const term = keyword.value.trim().toLowerCase();
  if (!term) return roles.value;
  return roles.value.filter((role) => [role.name, role.code, role.description].some((value) => value.toLowerCase().includes(term)));
});

const editorTitle = computed(() => (editorMode.value === 'edit' ? '编辑角色' : editorMode.value === 'duplicate' ? '复制角色' : '新建角色'));
const editorInvalid = computed(() => Boolean(validateEditor(false)));

function resetFieldErrors() {
  fieldErrors.name = '';
  fieldErrors.code = '';
  fieldErrors.permissions = '';
}

function validateEditor(showErrors: boolean) {
  const nextErrors: RoleFieldErrors = { name: '', code: '', permissions: '' };
  if (editorForm.name.trim().length < 2) nextErrors.name = '角色名称至少 2 个字';
  if (!currentRoleSystem.value && editorForm.code.trim().length < 2) nextErrors.code = '角色编码至少 2 个字符';
  if (!editorForm.permissions.length) nextErrors.permissions = '至少选择一个权限';
  if (showErrors) Object.assign(fieldErrors, nextErrors);
  return nextErrors.name || nextErrors.code || nextErrors.permissions;
}

function resetEditorForm() {
  editorForm.name = '';
  editorForm.code = '';
  editorForm.description = '';
  editorForm.permissions = [];
  currentRoleId.value = '';
  currentRoleSystem.value = false;
  submitError.value = '';
  resetFieldErrors();
}

function handleCancel() {
  saving.value = false;
  submitError.value = '';
  resetFieldErrors();
}

async function loadPageData() {
  loading.value = true;
  loadError.value = '';
  try {
    const [roleList, permissionList] = await Promise.all([rolesApi.list(), rolesApi.listPermissions()]);
    roles.value = roleList;
    permissions.value = permissionList;
  } catch (error: any) {
    roles.value = [];
    permissions.value = [];
    loadError.value = error?.response?.data?.message || '加载角色列表失败';
    Message.error(loadError.value);
  } finally {
    loading.value = false;
  }
}

function applyRoleToForm(role: RoleSummary) {
  currentRoleId.value = role.id;
  currentRoleSystem.value = role.isSystem;
  editorForm.name = role.name;
  editorForm.code = role.code;
  editorForm.description = role.description;
  editorForm.permissions = role.permissions.map((permission) => permission.code);
  submitError.value = '';
  resetFieldErrors();
}

function openCreateModal() {
  editorMode.value = 'create';
  resetEditorForm();
  editorVisible.value = true;
}

function openDuplicateModal(role: RoleSummary) {
  editorMode.value = 'duplicate';
  resetEditorForm();
  applyRoleToForm(role);
  currentRoleId.value = '';
  currentRoleSystem.value = false;
  editorForm.name = `${role.name} 副本`;
  editorForm.code = `${role.code}-copy`;
  editorVisible.value = true;
}

function openEditModal(role: RoleSummary) {
  editorMode.value = 'edit';
  resetEditorForm();
  applyRoleToForm(role);
  editorVisible.value = true;
}

function openUsersOfRole(role: RoleSummary) {
  void router.push({ path: '/users', query: { role: role.id } });
}

function isGroupFullySelected(groupKey: string) {
  const codes = permissionGroups.value.find((group) => group.key === groupKey)?.items.map((item) => item.code) ?? [];
  return codes.length > 0 && codes.every((code) => editorForm.permissions.includes(code));
}

function selectedCount(groupKey: string) {
  const codes = permissionGroups.value.find((group) => group.key === groupKey)?.items.map((item) => item.code) ?? [];
  return codes.filter((code) => editorForm.permissions.includes(code)).length;
}

function togglePermission(code: PermissionCode) {
  if (editorForm.permissions.includes(code)) {
    editorForm.permissions = editorForm.permissions.filter((item) => item !== code);
    return;
  }
  editorForm.permissions = [...editorForm.permissions, code];
}

function toggleGroup(groupKey: string) {
  const codes = permissionGroups.value.find((group) => group.key === groupKey)?.items.map((item) => item.code) ?? [];
  if (!codes.length) return;
  if (codes.every((code) => editorForm.permissions.includes(code))) {
    editorForm.permissions = editorForm.permissions.filter((code) => !codes.includes(code));
    return;
  }
  editorForm.permissions = [...new Set([...editorForm.permissions, ...codes])];
}

async function maybeRefreshAuthProfile(roleId: string) {
  const currentUserRoleIds = authStore.user?.roles.map((role) => role.id) ?? [];
  if (!currentUserRoleIds.includes(roleId)) return;
  try {
    await authStore.fetchProfile(true);
  } catch {
    authStore.logout();
  }
}

async function submitEditor() {
  if (saving.value) return;
  submitError.value = '';
  const validationError = validateEditor(true);
  if (validationError) return;
  const payload = {
    name: editorForm.name.trim(),
    code: editorForm.code.trim(),
    description: editorForm.description.trim(),
    permissions: [...editorForm.permissions],
  };
  saving.value = true;
  try {
    let savedRole: RoleSummary;
    if (editorMode.value === 'edit') {
      savedRole = await rolesApi.update(currentRoleId.value, payload);
      Message.success('角色已更新');
    } else {
      savedRole = await rolesApi.create(payload);
      Message.success(editorMode.value === 'duplicate' ? '角色已复制' : '角色已创建');
    }
    await maybeRefreshAuthProfile(savedRole.id);
    await loadPageData();
    editorVisible.value = false;
  } catch (error: any) {
    submitError.value = error?.response?.data?.message || '角色保存失败';
  } finally {
    saving.value = false;
  }
}

async function removeRole(id: string) {
  try {
    await rolesApi.remove(id);
    Message.success('角色已删除');
    await loadPageData();
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除角色失败');
  }
}

onMounted(() => {
  void loadPageData();
});
</script>

<style scoped>
.roles-card {
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

.toolbar > .arco-btn {
  flex: none;
  white-space: nowrap;
}

.toolbar :deep(.arco-input-wrapper) {
  white-space: nowrap;
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

.role-title {
  display: grid;
  gap: 4px;
}

.role-title span,
.permission-summary-copy span,
.permission-card-title span,
.permission-option-copy code {
  color: var(--admin-text-secondary);
}

.permission-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-editor-form {
  display: grid;
  gap: 8px;
}

.role-editor-topbar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.role-description-item,
.role-permission-item {
  margin-bottom: 0;
}

.modal-alert {
  margin-bottom: 16px;
}

.permission-editor-shell {
  display: grid;
  gap: 16px;
}

.permission-editor-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--admin-border);
  border-radius: 16px;
  background: radial-gradient(circle at top right, rgba(24, 144, 255, 0.08), transparent 32%), var(--admin-surface);
}

.permission-summary-copy {
  display: grid;
  gap: 4px;
}

.permission-group-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.permission-group-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--admin-border);
  border-radius: 14px;
  background: var(--admin-surface);
}

.permission-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.permission-card-title {
  display: grid;
  gap: 4px;
}

.permission-option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.permission-option-card {
  display: inline-grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 32px;
  padding: 5px 9px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.permission-option-card:hover {
  border-color: rgba(24, 144, 255, 0.35);
  background: rgba(15, 23, 42, 0.02);
}

.permission-option-card-active {
  border-color: rgba(24, 144, 255, 0.42);
  background: rgba(24, 144, 255, 0.06);
}

.permission-option-copy {
  display: grid;
  gap: 0;
  min-width: 0;
  line-height: 1.2;
}

.permission-option-copy strong,
.permission-option-copy code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.permission-option-copy strong {
  font-size: 11px;
  font-weight: 600;
}

.permission-option-copy code {
  font-size: 10px;
}

.permission-option-card :deep(.arco-checkbox) {
  margin-right: 0;
}

[data-admin-theme='dark'] .permission-option-card {
  border-color: rgb(255 255 255 / 0.08);
  background: linear-gradient(180deg, rgb(26 35 49 / 0.96), rgb(20 28 41 / 0.96));
}

[data-admin-theme='dark'] .permission-option-card:hover {
  border-color: rgb(76 111 255 / 0.42);
  background: linear-gradient(180deg, rgb(31 43 63 / 0.98), rgb(23 33 49 / 0.98));
}

[data-admin-theme='dark'] .permission-option-card-active {
  border-color: rgb(76 111 255 / 0.58);
  background: linear-gradient(180deg, rgb(34 50 82 / 0.98), rgb(25 39 66 / 0.98));
  box-shadow: inset 0 0 0 1px rgb(76 111 255 / 0.12);
}

@media (max-width: 960px) {
  .role-editor-topbar,
  .permission-group-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .role-editor-topbar,
  .permission-group-grid {
    grid-template-columns: 1fr;
  }

  .permission-editor-summary,
  .permission-card-header {
    flex-direction: column;
    align-items: stretch;
  }
}

:global(.roles-editor-modal .arco-modal) {
  top: 16px;
  width: min(1320px, calc(100vw - 32px)) !important;
  max-width: none;
}

:global(.roles-editor-modal .arco-modal-content) {
  max-height: calc(100vh - 32px);
}

:global(.roles-editor-modal .arco-modal-body) {
  max-height: calc(100vh - 180px);
  overflow: auto;
}
</style>
