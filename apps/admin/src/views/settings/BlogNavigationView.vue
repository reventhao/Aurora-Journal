<template>
  <a-card :bordered="false" class="navigation-card-page" :loading="loading">
    <template #title>博客菜单</template>

    <div class="toolbar">
      <div class="toolbar-actions">
        <a-button :disabled="!canUpdateSettings" @click="openCreateModal">
          <template #icon>
            <icon-plus />
          </template>
          新增菜单
        </a-button>

        <a-button type="primary" :loading="saving" :disabled="!canUpdateSettings" @click="submit">
          保存菜单
        </a-button>
      </div>

      <div class="toolbar-meta">
        <a-tag color="arcoblue" bordered>总数 {{ form.navigationMenu.length }}</a-tag>
        <a-tag color="green" bordered>显示 {{ visibleCount }}</a-tag>
        <a-tag bordered>隐藏 {{ hiddenCount }}</a-tag>
      </div>
    </div>

    <Draggable
      v-if="form.navigationMenu.length"
      v-model="form.navigationMenu"
      item-key="key"
      class="navigation-list"
      ghost-class="navigation-item--ghost"
      chosen-class="navigation-item--chosen"
      drag-class="navigation-item--dragging"
      :animation="180"
      :disabled="!canUpdateSettings"
      :filter="dragFilter"
      :prevent-on-filter="false"
      @end="syncNavigationOrder"
    >
      <template #item="{ element: item, index }">
        <article
          class="navigation-item"
          :class="{ 'navigation-item--hidden': !item.visible }"
          :style="{ '--navigation-icon-color': resolveIconColor(item) }"
        >
          <div class="navigation-item__main">
            <div class="navigation-item__identity">
              <span class="navigation-item__order">{{ `${index + 1}`.padStart(2, '0') }}</span>

              <span class="navigation-item__icon">
                <component :is="resolveIcon(item)" />
              </span>

              <div class="navigation-item__copy">
                <div class="navigation-item__line">
                  <strong class="navigation-item__title">{{ item.label || '未命名菜单' }}</strong>
                  <span class="navigation-item__route">{{ item.path || '/' }}</span>
                  <a-tag :color="isBuiltinItem(item) ? 'arcoblue' : 'purple'" bordered>
                    {{ isBuiltinItem(item) ? '内置' : '自定义' }}
                  </a-tag>
                  <a-tag :color="item.visible ? 'green' : 'gray'" bordered>
                    {{ item.visible ? '展示中' : '已隐藏' }}
                  </a-tag>
                  <a-tag :color="item.external ? 'orangered' : 'cyan'" bordered>
                    {{ item.external ? '外部链接' : '站内页面' }}
                  </a-tag>
                </div>
              </div>
            </div>

            <div class="navigation-item__actions">
              <div class="navigation-item__visibility">
                <span>{{ item.visible ? '显示中' : '隐藏' }}</span>
                <a-switch
                  :model-value="item.visible"
                  :disabled="!canUpdateSettings"
                  @change="updateMenuVisible(item, $event)"
                />
              </div>

              <a-button size="small" :disabled="!canUpdateSettings" @click="openEditModal(item)">
                编辑
              </a-button>

              <a-popconfirm
                v-if="!isBuiltinItem(item)"
                content="确认删除这个菜单吗？"
                @ok="removeMenu(item.key)"
              >
                <a-button size="small" status="danger" :disabled="!canUpdateSettings">
                  删除
                </a-button>
              </a-popconfirm>
            </div>
          </div>
        </article>
      </template>
    </Draggable>

    <div v-else class="navigation-empty">
      <strong>暂无博客菜单</strong>
      <span>新增后会显示在这里</span>
    </div>
  </a-card>

  <a-modal
    v-model:visible="editorVisible"
    :title="editingKey ? '编辑菜单' : '新增菜单'"
    :ok-loading="editorSaving"
    width="640px"
    @before-ok="submitEditor"
    @cancel="closeEditor"
  >
    <a-form layout="vertical" :model="editorForm" class="editor-form">
      <a-form-item field="label" label="菜单名称">
        <a-input v-model="editorForm.label" allow-clear placeholder="请输入菜单名称" class="capsule-field" />
      </a-form-item>

      <a-form-item field="path" label="菜单路由">
        <a-input
          v-model="editorForm.path"
          allow-clear
          placeholder="站内示例：/posts，外链示例：https://example.com"
          class="capsule-field"
        />
        <div class="editor-tip">站内填相对路径，外链填完整网址。</div>
      </a-form-item>

      <div class="editor-grid">
        <a-form-item field="external" label="链接类型">
          <a-select v-model="editorForm.external" class="capsule-field">
            <a-option :value="false">站内页面</a-option>
            <a-option :value="true">外部链接</a-option>
          </a-select>
        </a-form-item>
      </div>

      <a-form-item field="visible" label="前台显示">
        <div class="editor-switch">
          <span>{{ editorForm.visible ? '显示中' : '已隐藏' }}</span>
          <a-switch v-model="editorForm.visible" />
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import type {
  BuiltinNavigationMenuKey,
  NavigationMenuItem,
  SiteSettings,
} from '@aurora/shared';
import { Message } from '@arco-design/web-vue';
import {
  IconBook,
  IconBookmark,
  IconFolder,
  IconHome,
  IconInfo,
  IconLaunch,
  IconLink,
  IconPlus,
  IconSettings,
  IconTags,
} from '@arco-design/web-vue/es/icon';
import { computed, onMounted, reactive, ref, type Component } from 'vue';
import Draggable from 'vuedraggable';

import { settingsApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';
import { createDefaultSiteSettings } from './site-settings';

const authStore = useAuthStore();
const canUpdateSettings = computed(() => authStore.hasPermission('settings.update'));
const loading = ref(false);
const saving = ref(false);
const editorVisible = ref(false);
const editorSaving = ref(false);
const editingKey = ref<string | null>(null);
const customMenuCounter = ref(0);
const dragFilter = '.navigation-item__actions, .navigation-item__visibility, .arco-switch, .arco-btn';

const form = reactive(createDefaultSiteSettings());
const editorForm = reactive<NavigationMenuItem>({
  key: '',
  builtinKey: null,
  label: '',
  path: '/',
  visible: true,
  order: 0,
  external: false,
});

const visibleCount = computed(() => form.navigationMenu.filter((item) => item.visible).length);
const hiddenCount = computed(() => form.navigationMenu.length - visibleCount.value);

const builtinIconMap: Record<BuiltinNavigationMenuKey, Component> = {
  home: IconHome,
  posts: IconBook,
  readingList: IconBookmark,
  categories: IconFolder,
  tags: IconTags,
  about: IconInfo,
  admin: IconSettings,
};

const builtinColorMap: Record<BuiltinNavigationMenuKey, string> = {
  home: '#3b82f6',
  posts: '#f97316',
  readingList: '#22c55e',
  categories: '#14b8a6',
  tags: '#ec4899',
  about: '#8b5cf6',
  admin: '#ef4444',
};

function isBuiltinItem(item: NavigationMenuItem) {
  return Boolean(item.builtinKey);
}

function resolveIcon(item: NavigationMenuItem) {
  if (item.builtinKey) {
    return builtinIconMap[item.builtinKey];
  }

  return item.external ? IconLaunch : IconLink;
}

function resolveIconColor(item: NavigationMenuItem) {
  if (item.builtinKey) {
    return builtinColorMap[item.builtinKey];
  }

  return item.external ? '#f97316' : '#06b6d4';
}

function replaceNavigationMenu(items: NavigationMenuItem[]) {
  form.navigationMenu.splice(
    0,
    form.navigationMenu.length,
    ...items.map((item, order) => ({
      ...item,
      order,
    })),
  );
}

function syncNavigationOrder() {
  replaceNavigationMenu(form.navigationMenu);
}

function resetEditorForm() {
  Object.assign(editorForm, {
    key: '',
    builtinKey: null,
    label: '',
    path: '/',
    visible: true,
    order: 0,
    external: false,
  } satisfies NavigationMenuItem);
}

function createCustomMenuItem(): NavigationMenuItem {
  customMenuCounter.value += 1;
  return {
    key: `custom-${Date.now()}-${customMenuCounter.value}`,
    builtinKey: null,
    label: `新菜单 ${customMenuCounter.value}`,
    path: '/',
    visible: true,
    order: form.navigationMenu.length,
    external: false,
  };
}

function openCreateModal() {
  if (!canUpdateSettings.value) {
    return;
  }

  editingKey.value = null;
  Object.assign(editorForm, createCustomMenuItem());
  editorVisible.value = true;
}

function openEditModal(item: NavigationMenuItem) {
  if (!canUpdateSettings.value) {
    return;
  }

  editingKey.value = item.key;
  Object.assign(editorForm, { ...item });
  editorVisible.value = true;
}

function closeEditor() {
  editorVisible.value = false;
  editingKey.value = null;
  resetEditorForm();
}

function removeMenu(key: string) {
  if (!canUpdateSettings.value) {
    return;
  }

  replaceNavigationMenu(form.navigationMenu.filter((item) => item.key !== key));
}

function updateMenuVisible(item: NavigationMenuItem, visible: string | number | boolean) {
  item.visible = Boolean(visible);
}

async function submitEditor() {
  if (editorSaving.value) {
    return false;
  }

  const label = editorForm.label.trim();
  const path = editorForm.path.trim();

  if (!label) {
    Message.warning('菜单名称不能为空');
    return false;
  }

  if (!path) {
    Message.warning('菜单路由不能为空');
    return false;
  }

  editorSaving.value = true;

  try {
    const payload = {
      ...editorForm,
      label,
      path,
    } satisfies NavigationMenuItem;

    if (editingKey.value) {
      const target = form.navigationMenu.find((item) => item.key === editingKey.value);
      if (target) {
        Object.assign(target, payload);
      }
    } else {
      form.navigationMenu.push(payload);
    }

    syncNavigationOrder();
    closeEditor();
    return true;
  } finally {
    editorSaving.value = false;
  }
}

function buildPayload(): SiteSettings {
  syncNavigationOrder();

  return {
    ...form,
    navigationMenu: form.navigationMenu.map((item, order) => ({
      ...item,
      label: item.label.trim() || '未命名菜单',
      path: item.path.trim() || '/',
      order,
    })),
    homeSections: form.homeSections.map((section) => ({
      ...section,
    })),
  };
}

async function loadSettings() {
  loading.value = true;
  try {
    Object.assign(form, createDefaultSiteSettings(), await settingsApi.get(true));
    replaceNavigationMenu(form.navigationMenu);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '加载博客菜单失败');
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (saving.value || !canUpdateSettings.value) {
    return;
  }

  saving.value = true;
  try {
    const payload = buildPayload();
    const response = await settingsApi.update(payload);

    Object.assign(form, createDefaultSiteSettings(), response);
    replaceNavigationMenu(
      Array.isArray(response?.navigationMenu) && response.navigationMenu.length
        ? response.navigationMenu
        : payload.navigationMenu,
    );
    Message.success('博客菜单已保存');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '保存博客菜单失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadSettings();
});
</script>

<style scoped>
.navigation-card-page {
  overflow: hidden;
}

.toolbar,
.toolbar-actions,
.toolbar-meta,
.navigation-item__main,
.navigation-item__identity,
.navigation-item__line,
.navigation-item__actions,
.navigation-item__visibility {
  display: flex;
  align-items: center;
}

.toolbar {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.toolbar-actions,
.toolbar-meta {
  flex-wrap: wrap;
  gap: 10px;
}

.navigation-list {
  display: grid;
  gap: 12px;
}

.navigation-item {
  position: relative;
  padding: 12px 16px;
  border: 1px solid var(--admin-border);
  border-radius: 16px;
  background: linear-gradient(180deg, rgb(255 255 255 / 98%), rgb(248 250 252 / 96%));
  box-shadow: 0 10px 24px rgb(15 23 42 / 6%);
  cursor: grab;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
}

.navigation-item::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 0;
  width: 4px;
  border-radius: 0 999px 999px 0;
  background: var(--navigation-icon-color);
}

.navigation-item:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, rgb(59 130 246 / 24%) 50%, var(--admin-border));
  box-shadow: 0 16px 32px rgb(15 23 42 / 9%);
}

.navigation-item--ghost {
  opacity: 0.42;
}

.navigation-item--chosen,
.navigation-item--dragging {
  border-color: color-mix(in srgb, rgb(59 130 246 / 38%) 52%, var(--admin-border));
  box-shadow: 0 18px 36px rgb(59 130 246 / 12%);
}

.navigation-item--dragging {
  cursor: grabbing;
}

.navigation-item--hidden {
  opacity: 0.72;
}

.navigation-item__main {
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
}

.navigation-item__identity {
  min-width: 0;
  flex: 1;
  gap: 12px;
}

.navigation-item__order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-fill-2) 86%, transparent);
  color: var(--admin-text-secondary);
  font-size: 12px;
  font-weight: 700;
  flex: none;
}

.navigation-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--navigation-icon-color) 14%, white);
  color: var(--navigation-icon-color);
  flex: none;
}

.navigation-item__icon :deep(.arco-icon) {
  font-size: 18px;
}

.navigation-item__copy {
  min-width: 0;
  flex: 1;
}

.navigation-item__line {
  flex-wrap: wrap;
  row-gap: 6px;
  column-gap: 10px;
  min-width: 0;
}

.navigation-item__title {
  color: var(--admin-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.navigation-item__route {
  max-width: 320px;
  overflow: hidden;
  padding: 0 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-fill-2) 88%, transparent);
  color: var(--admin-text-secondary);
  font-size: 12px;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navigation-item__line :deep(.arco-tag) {
  margin: 0;
  line-height: 22px;
}

.navigation-item__actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  flex: none;
}

.navigation-item__visibility {
  gap: 8px;
  min-height: 24px;
  padding: 0;
  color: var(--admin-text-secondary);
  font-size: 12px;
  line-height: 1;
}

.navigation-empty {
  display: grid;
  gap: 6px;
  justify-items: center;
  padding: 40px 16px;
  color: var(--admin-text-secondary);
}

.navigation-empty strong {
  color: var(--admin-text);
}

.editor-form {
  display: grid;
  gap: 2px;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.editor-tip {
  margin-top: 6px;
  color: var(--admin-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.capsule-field :deep(.arco-input-wrapper),
.capsule-field :deep(.arco-select-view) {
  min-height: 44px;
  border-radius: 14px;
  padding-inline: 14px;
  background: linear-gradient(180deg, rgb(255 255 255 / 99%), rgb(248 250 252 / 97%));
}

.editor-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  padding: 6px 0 2px;
}

.editor-switch span {
  color: var(--admin-text-secondary);
  font-size: 13px;
}

[data-admin-theme='dark'] .navigation-item {
  background: linear-gradient(180deg, rgb(20 29 43 / 98%), rgb(16 24 38 / 96%));
  box-shadow: 0 16px 32px rgb(0 0 0 / 24%);
}

[data-admin-theme='dark'] .navigation-item__icon {
  background: color-mix(in srgb, var(--navigation-icon-color) 18%, rgb(15 23 42));
}

[data-admin-theme='dark'] .navigation-item__visibility,
[data-admin-theme='dark'] .capsule-field :deep(.arco-input-wrapper),
[data-admin-theme='dark'] .capsule-field :deep(.arco-select-view) {
  background: rgb(255 255 255 / 4%);
  border-color: rgb(148 163 184 / 18%);
}

@media (max-width: 900px) {
  .toolbar,
  .navigation-item__main {
    align-items: stretch;
    flex-direction: column;
  }

  .navigation-item__actions {
    justify-content: flex-start;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .navigation-item {
    padding: 12px 14px;
  }

  .navigation-item__identity {
    align-items: flex-start;
  }

  .navigation-item__actions {
    width: 100%;
  }

  .navigation-item__visibility {
    justify-content: space-between;
    width: 100%;
  }

  .navigation-item__route {
    max-width: 100%;
  }
}
</style>
