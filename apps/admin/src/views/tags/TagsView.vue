<template>
  <a-card :bordered="false" class="tags-card">
    <template #title>标签管理</template>

    <div class="toolbar">
      <a-input-search v-model="keyword" allow-clear placeholder="搜索标签名称或 slug" class="toolbar-search" />
      <a-button v-if="canManageTags" type="primary" @click="openCreate">新增标签</a-button>
      <a-button
        v-if="canManageTags"
        status="success"
        :disabled="!selectedRowKeys.length || batchLoading"
        :loading="batchLoading"
        @click="batchToggleVisible(true)"
      >
        批量上线
      </a-button>
      <a-button
        v-if="canManageTags"
        status="warning"
        :disabled="!selectedRowKeys.length || batchLoading"
        :loading="batchLoading"
        @click="batchToggleVisible(false)"
      >
        批量下线
      </a-button>
      <a-popconfirm
        v-if="canManageTags"
        content="确认删除选中的标签吗？"
        @ok="batchRemoveTags"
      >
        <a-button status="danger" :disabled="!selectedRowKeys.length || batchLoading" :loading="batchLoading">
          批量删除
        </a-button>
      </a-popconfirm>
    </div>

    <div class="toolbar-meta">
      <a-tag bordered>总数 {{ filteredTags.length }}</a-tag>
      <a-tag v-if="selectedRowKeys.length" color="arcoblue" bordered>已选择 {{ selectedRowKeys.length }}</a-tag>
    </div>

    <a-alert v-if="loadError" type="error" :show-icon="true" class="page-alert">{{ loadError }}</a-alert>

    <a-table
      :data="filteredTags"
      row-key="id"
      :pagination="false"
      :loading="loading"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
    >
      <template #empty>
        <div class="table-empty">
          <strong>{{ keyword ? '没有匹配的标签' : '暂无标签' }}</strong>
          <span>{{ keyword ? '换个关键词试试。' : '新建后会显示在这里。' }}</span>
        </div>
      </template>
      <template #columns>
        <a-table-column title="名称" data-index="name" />
        <a-table-column title="Slug" data-index="slug" />
        <a-table-column title="状态">
          <template #cell="{ record }">
            <a-tag :color="record.visible ? 'green' : 'gray'">{{ record.visible ? '已上线' : '已下线' }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="颜色">
          <template #cell="{ record }">
            <a-tag :color="record.color">{{ record.color }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="280">
          <template #cell="{ record }">
            <a-space v-if="canManageTags" wrap>
              <a-button size="mini" :status="record.visible ? 'warning' : 'success'" @click="toggleVisible(record)">
                {{ record.visible ? '下线' : '上线' }}
              </a-button>
              <a-button size="mini" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm content="确认删除这个标签吗？" @ok="removeTag(record.id)">
                <a-button size="mini" status="danger">删除</a-button>
              </a-popconfirm>
            </a-space>
            <span v-else>-</span>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </a-card>

  <a-modal v-model:visible="visible" :title="editingId ? '编辑标签' : '新增标签'" :ok-loading="saving" @ok="submit" @cancel="handleCancel">
    <a-alert v-if="submitError" type="error" :show-icon="true" class="modal-alert">{{ submitError }}</a-alert>

    <a-form layout="vertical" :model="form">
      <a-form-item field="name" label="名称" :validate-status="fieldErrors.name ? 'error' : undefined" :help="fieldErrors.name">
        <a-input v-model="form.name" />
      </a-form-item>
      <a-form-item field="slug" label="Slug" :validate-status="fieldErrors.slug ? 'error' : undefined" :help="fieldErrors.slug">
        <a-input v-model="form.slug" />
      </a-form-item>
      <a-form-item field="color" label="颜色" :validate-status="fieldErrors.color ? 'error' : undefined" :help="fieldErrors.color">
        <div class="color-field">
          <div class="preset-color-sections">
            <section v-for="group in CURATED_COLOR_GROUPS" :key="group.label" class="preset-color-section">
              <div class="preset-color-section__title">{{ group.label }}</div>
              <div class="preset-color-grid">
                <button
                  v-for="preset in group.colors"
                  :key="preset.value"
                  type="button"
                  class="preset-color-chip"
                  :class="{ 'is-active': normalizeHex(form.color) === preset.value }"
                  :style="{ '--preset-color': preset.value }"
                  :title="`${preset.name} ${preset.value}`"
                  @click="applyPresetColor(preset.value)"
                />
              </div>
            </section>
          </div>
          <a-color-picker v-model="form.color" show-text />
        </div>
      </a-form-item>
      <a-form-item field="visible" label="是否上线"><a-switch v-model="form.visible" /></a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { tagsApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';

type TagItem = {
  id: string;
  name: string;
  slug: string;
  color: string;
  visible: boolean;
};

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const CURATED_COLOR_GROUPS = [
  { label: '蓝青系', colors: [
    { name: '星云蓝', value: '#5B8CFF' }, { name: '群青', value: '#4C6FFF' }, { name: '电光蓝', value: '#3A86FF' }, { name: '雾海蓝', value: '#6EA8FE' },
    { name: '晴空蓝', value: '#4CC9F0' }, { name: '冰川青', value: '#56CFE1' }, { name: '翡翠青', value: '#2EC4B6' }, { name: '薄荷青', value: '#5EEAD4' },
  ]},
  { label: '绿色系', colors: [
    { name: '海盐绿', value: '#3DDC97' }, { name: '冷杉绿', value: '#22C55E' }, { name: '柠雾绿', value: '#84CC16' }, { name: '鼠尾草绿', value: '#7FB77E' },
    { name: '森林绿', value: '#3D8361' }, { name: '玉石绿', value: '#48BFA3' }, { name: '青苔绿', value: '#6A994E' }, { name: '浅豆绿', value: '#95D5B2' },
  ]},
  { label: '暖色系', colors: [
    { name: '月光黄', value: '#FFD166' }, { name: '杏仁橙', value: '#FFB703' }, { name: '蜜桃橙', value: '#FB8500' }, { name: '珊瑚橙', value: '#FF7F51' },
    { name: '日落红', value: '#FF6B6B' }, { name: '莓果红', value: '#EF476F' }, { name: '玫桃粉', value: '#FF5D8F' }, { name: '樱雾粉', value: '#F78FB3' },
  ]},
  { label: '紫粉系', colors: [
    { name: '洋红紫', value: '#D63384' }, { name: '兰花紫', value: '#9D4EDD' }, { name: '雾紫', value: '#B388FF' }, { name: '鸢尾紫', value: '#7B61FF' },
    { name: '紫罗兰', value: '#8B5CF6' }, { name: '葡萄紫', value: '#9333EA' }, { name: '长春花蓝', value: '#818CF8' }, { name: '静夜蓝', value: '#5465FF' },
  ]},
  { label: '中性色', colors: [
    { name: '石板蓝', value: '#6482AD' }, { name: '银雾灰', value: '#94A3B8' }, { name: '云灰', value: '#CBD5E1' }, { name: '烟灰', value: '#64748B' },
    { name: '石墨灰', value: '#475569' }, { name: '暖砂灰', value: '#A1887F' }, { name: '墨蓝', value: '#1E293B' }, { name: '曜石黑', value: '#0F172A' },
  ]},
] as const;

const authStore = useAuthStore();
const canManageTags = computed(() => authStore.hasPermission('tags.manage'));

const tags = ref<TagItem[]>([]);
const keyword = ref('');
const loading = ref(false);
const batchLoading = ref(false);
const loadError = ref('');
const visible = ref(false);
const saving = ref(false);
const editingId = ref('');
const submitError = ref('');
const selectedRowKeys = ref<string[]>([]);

const form = reactive({
  name: '',
  slug: '',
  color: '#7c3aed',
  visible: true,
});

const fieldErrors = reactive({
  name: '',
  slug: '',
  color: '',
});

const filteredTags = computed(() => {
  const term = keyword.value.trim().toLowerCase();
  if (!term) return tags.value;
  return tags.value.filter((item) => [item.name, item.slug, item.color].some((value) => value.toLowerCase().includes(term)));
});
const rowSelection = computed(() => ({
  type: 'checkbox' as const,
  showCheckedAll: true,
  onlyCurrent: false,
}));

async function loadTags() {
  loading.value = true;
  loadError.value = '';
  try {
    tags.value = await tagsApi.list();
  } catch (error: any) {
    tags.value = [];
    loadError.value = error?.response?.data?.message || '加载标签列表失败';
    Message.error(loadError.value);
  } finally {
    loading.value = false;
  }
  selectedRowKeys.value = selectedRowKeys.value.filter((id) => tags.value.some((item) => item.id === id));
}

function resetFieldErrors() {
  fieldErrors.name = '';
  fieldErrors.slug = '';
  fieldErrors.color = '';
}

function resetForm() {
  form.name = '';
  form.slug = '';
  form.color = '#7c3aed';
  form.visible = true;
  submitError.value = '';
  resetFieldErrors();
}

function normalizeHex(value: string) {
  return value.trim().toUpperCase();
}

function applyPresetColor(color: string) {
  form.color = color;
  fieldErrors.color = '';
}

function validateForm(showErrors: boolean) {
  const nextErrors = { name: '', slug: '', color: '' };
  if (form.name.trim().length < 2) nextErrors.name = '名称至少 2 个字';
  if (form.slug.trim().length < 2) nextErrors.slug = 'Slug 至少 2 个字符';
  if (!HEX_PATTERN.test(form.color)) nextErrors.color = '颜色必须是十六进制色值';
  if (showErrors) Object.assign(fieldErrors, nextErrors);
  return Object.values(nextErrors).find(Boolean) || '';
}

function openCreate() {
  editingId.value = '';
  resetForm();
  visible.value = true;
}

function openEdit(record: TagItem) {
  editingId.value = record.id;
  submitError.value = '';
  resetFieldErrors();
  form.name = record.name;
  form.slug = record.slug;
  form.color = record.color;
  form.visible = record.visible;
  visible.value = true;
}

function handleCancel() {
  saving.value = false;
  submitError.value = '';
  resetFieldErrors();
}

async function submit() {
  if (saving.value) return;
  submitError.value = '';
  const validationError = validateForm(true);
  if (validationError) return;

  saving.value = true;
  try {
    const payload = { name: form.name.trim(), slug: form.slug.trim(), color: form.color, visible: form.visible };
    if (editingId.value) {
      await tagsApi.update(editingId.value, payload);
    } else {
      await tagsApi.create(payload);
    }
    Message.success('标签已保存');
    visible.value = false;
    await loadTags();
  } catch (error: any) {
    submitError.value = error?.response?.data?.message || '标签保存失败';
  } finally {
    saving.value = false;
  }
}

async function toggleVisible(record: TagItem) {
  try {
    const nextVisible = !record.visible;
    await tagsApi.toggleVisible(record.id, nextVisible);
    record.visible = nextVisible;
    Message.success(`${record.name} 已${nextVisible ? '上线' : '下线'}`);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '更新标签状态失败');
  }
}

async function removeTag(id: string) {
  try {
    await tagsApi.remove(id);
    tags.value = tags.value.filter((item) => item.id !== id);
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== id);
    Message.success('标签已删除');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除标签失败');
  }
}

async function batchToggleVisible(visible: boolean) {
  if (!selectedRowKeys.value.length || batchLoading.value) return;
  batchLoading.value = true;
  const ids = [...selectedRowKeys.value];

  try {
    const results = await Promise.allSettled(ids.map((id) => tagsApi.toggleVisible(id, visible)));
    const failedCount = results.filter((item) => item.status === 'rejected').length;
    await loadTags();

    if (!failedCount) {
      Message.success(`已批量${visible ? '上线' : '下线'} ${ids.length} 个标签`);
      return;
    }

    Message.warning(`已处理 ${ids.length - failedCount} 个标签，失败 ${failedCount} 个`);
  } finally {
    batchLoading.value = false;
  }
}

async function batchRemoveTags() {
  if (!selectedRowKeys.value.length || batchLoading.value) return;
  batchLoading.value = true;
  const ids = [...selectedRowKeys.value];

  try {
    const results = await Promise.allSettled(ids.map((id) => tagsApi.remove(id)));
    const failedCount = results.filter((item) => item.status === 'rejected').length;
    await loadTags();

    if (!failedCount) {
      Message.success(`已删除 ${ids.length} 个标签`);
      return;
    }

    Message.warning(`已删除 ${ids.length - failedCount} 个标签，失败 ${failedCount} 个`);
  } finally {
    batchLoading.value = false;
  }
}

onMounted(() => {
  void loadTags();
});
</script>

<style scoped>
.tags-card {
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

.toolbar-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.modal-alert {
  margin-bottom: 16px;
}

.color-field {
  display: grid;
  gap: 12px;
}

.preset-color-sections {
  display: grid;
  gap: 14px;
}

.preset-color-section {
  display: grid;
  gap: 8px;
}

.preset-color-section__title {
  color: var(--color-text-2);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.preset-color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.preset-color-chip {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 6px;
  background: var(--preset-color);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.preset-color-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgb(15 23 42 / 12%);
}

.preset-color-chip.is-active {
  border-color: rgb(15 23 42 / 75%);
  box-shadow: 0 0 0 2px rgb(255 255 255 / 92%), 0 0 0 4px var(--preset-color);
}
</style>
