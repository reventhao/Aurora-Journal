<template>
  <a-card :bordered="false" class="categories-card">
    <template #title>分类管理</template>

    <div class="toolbar">
      <a-input-search v-model="keyword" allow-clear placeholder="搜索分类名称或 slug" class="toolbar-search" />
      <a-button v-if="canManageCategories" type="primary" @click="openCreate">新增分类</a-button>
      <a-button
        v-if="canManageCategories"
        status="success"
        :disabled="!selectedRowKeys.length || batchLoading"
        :loading="batchLoading"
        @click="batchToggleVisible(true)"
      >
        批量上线
      </a-button>
      <a-button
        v-if="canManageCategories"
        status="warning"
        :disabled="!selectedRowKeys.length || batchLoading"
        :loading="batchLoading"
        @click="batchToggleVisible(false)"
      >
        批量下线
      </a-button>
      <a-popconfirm
        v-if="canManageCategories"
        content="确认删除选中的分类吗？"
        @ok="batchRemoveCategories"
      >
        <a-button status="danger" :disabled="!selectedRowKeys.length || batchLoading" :loading="batchLoading">
          批量删除
        </a-button>
      </a-popconfirm>
    </div>

    <div class="toolbar-meta">
      <a-tag bordered>总数 {{ filteredCategories.length }}</a-tag>
      <a-tag v-if="selectedRowKeys.length" color="arcoblue" bordered>已选择 {{ selectedRowKeys.length }}</a-tag>
    </div>

    <a-alert v-if="loadError" type="error" :show-icon="true" class="page-alert">{{ loadError }}</a-alert>

    <a-table
      :data="filteredCategories"
      row-key="id"
      :pagination="false"
      :loading="loading"
      :row-selection="rowSelection"
      v-model:selectedKeys="selectedRowKeys"
    >
      <template #empty>
        <div class="table-empty">
          <strong>{{ keyword ? '没有匹配的分类' : '暂无分类' }}</strong>
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
        <a-table-column title="文章数">
          <template #cell="{ record }">{{ record._count?.posts || 0 }}</template>
        </a-table-column>
        <a-table-column title="操作" :width="280">
          <template #cell="{ record }">
            <a-space v-if="canManageCategories" wrap>
              <a-button size="mini" :status="record.visible ? 'warning' : 'success'" @click="toggleVisible(record)">
                {{ record.visible ? '下线' : '上线' }}
              </a-button>
              <a-button size="mini" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm content="确认删除这个分类吗？" @ok="removeCategory(record.id)">
                <a-button size="mini" status="danger">删除</a-button>
              </a-popconfirm>
            </a-space>
            <span v-else>-</span>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </a-card>

  <a-modal v-model:visible="visible" :title="editingId ? '编辑分类' : '新增分类'" @ok="submit">
    <a-form layout="vertical" :model="form">
      <a-form-item field="name" label="名称"><a-input v-model="form.name" /></a-form-item>
      <a-form-item field="slug" label="Slug"><a-input v-model="form.slug" /></a-form-item>
      <a-form-item field="description" label="描述"><a-textarea v-model="form.description" /></a-form-item>
      <a-form-item field="visible" label="是否上线"><a-switch v-model="form.visible" /></a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { categoriesApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  visible: boolean;
  _count?: { posts: number };
};

const authStore = useAuthStore();
const canManageCategories = computed(() => authStore.hasPermission('categories.manage'));

const categories = ref<CategoryItem[]>([]);
const keyword = ref('');
const loading = ref(false);
const batchLoading = ref(false);
const loadError = ref('');
const visible = ref(false);
const editingId = ref('');
const selectedRowKeys = ref<string[]>([]);
const form = reactive({
  name: '',
  slug: '',
  description: '',
  visible: true,
});

const filteredCategories = computed(() => {
  const term = keyword.value.trim().toLowerCase();
  if (!term) return categories.value;
  return categories.value.filter((item) => [item.name, item.slug, item.description].some((value) => value.toLowerCase().includes(term)));
});
const rowSelection = computed(() => ({
  type: 'checkbox' as const,
  showCheckedAll: true,
  onlyCurrent: false,
}));

async function loadCategories() {
  loading.value = true;
  loadError.value = '';
  try {
    categories.value = await categoriesApi.list();
  } catch (error: any) {
    categories.value = [];
    loadError.value = error?.response?.data?.message || '加载分类列表失败';
    Message.error(loadError.value);
  } finally {
    loading.value = false;
  }
  selectedRowKeys.value = selectedRowKeys.value.filter((id) => categories.value.some((item) => item.id === id));
}

function resetForm() {
  form.name = '';
  form.slug = '';
  form.description = '';
  form.visible = true;
}

function openCreate() {
  editingId.value = '';
  resetForm();
  visible.value = true;
}

function openEdit(record: CategoryItem) {
  editingId.value = record.id;
  form.name = record.name;
  form.slug = record.slug;
  form.description = record.description;
  form.visible = record.visible;
  visible.value = true;
}

async function submit() {
  if (editingId.value) {
    await categoriesApi.update(editingId.value, form);
  } else {
    await categoriesApi.create(form);
  }
  Message.success('分类已保存');
  visible.value = false;
  await loadCategories();
}

async function toggleVisible(record: CategoryItem) {
  try {
    const nextVisible = !record.visible;
    await categoriesApi.toggleVisible(record.id, nextVisible);
    record.visible = nextVisible;
    Message.success(`${record.name} 已${nextVisible ? '上线' : '下线'}`);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '更新分类状态失败');
  }
}

async function removeCategory(id: string) {
  try {
    await categoriesApi.remove(id);
    categories.value = categories.value.filter((item) => item.id !== id);
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== id);
    Message.success('分类已删除');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除分类失败');
  }
}

async function batchToggleVisible(visible: boolean) {
  if (!selectedRowKeys.value.length || batchLoading.value) return;
  batchLoading.value = true;
  const ids = [...selectedRowKeys.value];

  try {
    const results = await Promise.allSettled(ids.map((id) => categoriesApi.toggleVisible(id, visible)));
    const failedCount = results.filter((item) => item.status === 'rejected').length;
    await loadCategories();

    if (!failedCount) {
      Message.success(`已批量${visible ? '上线' : '下线'} ${ids.length} 个分类`);
      return;
    }

    Message.warning(`已处理 ${ids.length - failedCount} 个分类，失败 ${failedCount} 个`);
  } finally {
    batchLoading.value = false;
  }
}

async function batchRemoveCategories() {
  if (!selectedRowKeys.value.length || batchLoading.value) return;
  batchLoading.value = true;
  const ids = [...selectedRowKeys.value];

  try {
    const results = await Promise.allSettled(ids.map((id) => categoriesApi.remove(id)));
    const failedCount = results.filter((item) => item.status === 'rejected').length;
    await loadCategories();

    if (!failedCount) {
      Message.success(`已删除 ${ids.length} 个分类`);
      return;
    }

    Message.warning(`已删除 ${ids.length - failedCount} 个分类，失败 ${failedCount} 个`);
  } finally {
    batchLoading.value = false;
  }
}

onMounted(() => {
  void loadCategories();
});
</script>

<style scoped>
.categories-card {
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
</style>
