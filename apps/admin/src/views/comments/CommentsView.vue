<template>
  <a-card :bordered="false" class="comments-card">
    <template #title>
      <a-badge :count="pendingCount" :dot="pendingCount > 0">
        <span>评论管理</span>
      </a-badge>
    </template>

    <a-tabs v-model:active-key="activeView" class="view-tabs" @change="handleViewChange">
      <a-tab-pane key="list" title="评论列表">
        <CommentListPane
          v-model:keyword="keyword"
          v-model:status-filter="statusFilter"
          v-model:selected-keys="selectedKeys"
          :items="filteredCommentTree"
          :loading="loading"
          :load-error="loadError"
          :review-loading="reviewLoading"
          :delete-loading="deleteLoading"
          :can-moderate-comments="canModerateComments"
          :can-delete-comments="canDeleteComments"
          :row-selection="rowSelection"
          :total-count="comments.length"
          :pending-count="pendingCount"
          :reply-count="replyCount"
          :select-width="selectWidth"
          :format-date="formatDate"
          @open-rules="openRulesModal"
          @batch-review="batchReview"
          @batch-remove="batchRemove"
          @review="review"
          @remove="removeComment"
        />
      </a-tab-pane>

      <a-tab-pane v-if="canViewThreads" key="threads" title="会话视图">
        <CommentThreadsPane
          v-model:keyword="threadKeyword"
          v-model:status-filter="threadStatusFilter"
          :items="threads"
          :loading="threadsLoading"
          :load-error="threadLoadError"
          :total-count="threads.length"
          :pending-count="pendingThreadCount"
          :reply-count="threadReplyCount"
          :select-width="selectWidth"
          :format-date="formatDate"
          @refresh="loadThreads"
          @open-thread="openThread"
        />
      </a-tab-pane>
    </a-tabs>
  </a-card>

  <a-modal v-model:visible="rulesVisible" title="评论审核规则" width="720px" :ok-loading="rulesSaving" @before-ok="submitRules">
    <a-alert v-if="rulesError" type="error" :show-icon="true" class="modal-alert">{{ rulesError }}</a-alert>
    <a-form layout="vertical" :model="rulesForm">
      <a-form-item field="minLength" label="最少字数">
        <a-input-number v-model="rulesForm.minLength" :min="1" :precision="0" />
      </a-form-item>
      <a-form-item field="blockedWords" label="屏蔽词">
        <a-textarea
          v-model="blockedWordsText"
          :auto-size="{ minRows: 4, maxRows: 6 }"
          placeholder="一行一个，命中后自动拦截"
        />
      </a-form-item>
      <a-form-item field="autoApproveDomains" label="自动通过域名">
        <a-textarea
          v-model="approveDomainsText"
          :auto-size="{ minRows: 4, maxRows: 6 }"
          placeholder="一行一个，例如 example.com"
        />
      </a-form-item>
    </a-form>
  </a-modal>

  <CommentThreadDrawer v-model:visible="threadDetailVisible" :thread="currentThread" :format-date="formatDate" />
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, ref } from 'vue';

import { commentsApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';
import CommentListPane from './components/CommentListPane.vue';
import CommentThreadDrawer from './components/CommentThreadDrawer.vue';
import CommentThreadsPane from './components/CommentThreadsPane.vue';
import type { CommentConversation, CommentModerationRules, CommentRecord, CommentStatusFilter } from './types';

const authStore = useAuthStore();
const comments = ref<CommentRecord[]>([]);
const threads = ref<CommentConversation[]>([]);
const activeView = ref<'list' | 'threads'>('list');
const statusFilter = ref<CommentStatusFilter>('all');
const keyword = ref('');
const threadKeyword = ref('');
const threadStatusFilter = ref<CommentStatusFilter>('all');
const loading = ref(false);
const threadsLoading = ref(false);
const loadError = ref('');
const threadLoadError = ref('');
const selectedKeys = ref<string[]>([]);
const reviewLoading = ref(false);
const deleteLoading = ref(false);
const rulesVisible = ref(false);
const rulesSaving = ref(false);
const rulesError = ref('');
const threadDetailVisible = ref(false);
const currentThread = ref<CommentConversation | null>(null);
const rulesForm = ref<CommentModerationRules>({
  minLength: 3,
  blockedWords: [],
  autoApproveDomains: [],
});
const selectWidth = { width: '104px', minWidth: '104px' };
const blockedWordsText = ref('');
const approveDomainsText = ref('');
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const pendingCount = computed(() => comments.value.filter((item) => !item.approved).length);
const replyCount = computed(() => comments.value.filter((item) => item.parentId).length);
const pendingThreadCount = computed(() => threads.value.filter((item) => item.pendingReplies > 0).length);
const threadReplyCount = computed(() => threads.value.reduce((sum, item) => sum + item.totalReplies, 0));
const canModerateComments = computed(() => authStore.hasPermission('comments.moderate'));
const canDeleteComments = computed(() => authStore.hasPermission('comments.delete'));
const canViewThreads = computed(() => authStore.hasPermission('comments.threads.view'));
const canSelectRows = computed(() => canModerateComments.value || canDeleteComments.value);

const commentTree = computed(() => {
  const nodeMap = new Map<string, CommentRecord>();
  const roots: CommentRecord[] = [];

  for (const item of comments.value) {
    nodeMap.set(item.id, {
      ...item,
      hasPendingInTree: !item.approved,
    });
  }

  for (const item of nodeMap.values()) {
    if (item.parentId) {
      const parent = nodeMap.get(item.parentId);
      if (parent) {
        parent.children = [...(parent.children || []), item];
        continue;
      }
    }
    roots.push(item);
  }

  const markPending = (node: CommentRecord): boolean => {
    const childPending = (node.children || []).some((child) => markPending(child));
    node.hasPendingInTree = !node.approved || childPending;
    return node.hasPendingInTree;
  };

  const sortTree = (items: CommentRecord[]) => {
    items.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    items.forEach((item) => sortTree(item.children || []));
  };

  roots.forEach((node) => markPending(node));
  sortTree(roots);

  return roots;
});

const filteredCommentTree = computed(() => {
  const search = keyword.value.trim().toLowerCase();

  const matches = (item: CommentRecord) => {
    const statusMatched =
      statusFilter.value === 'all'
        ? true
        : statusFilter.value === 'pending'
          ? !item.approved
          : item.approved;

    if (!statusMatched) return false;
    if (!search) return true;

    return [item.author, item.email, item.content, item.post?.title, item.parent?.author]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(search));
  };

  const filterTree = (items: CommentRecord[]): CommentRecord[] =>
    items.reduce<CommentRecord[]>((result, item) => {
      const children = filterTree(item.children || []);
      if (!matches(item) && children.length === 0) {
        return result;
      }

      result.push({
        ...item,
        children: children.length ? children : undefined,
      });
      return result;
    }, []);

  return filterTree(commentTree.value);
});

const rowSelection = computed(() =>
  canSelectRows.value
    ? {
        type: 'checkbox' as const,
        showCheckedAll: true,
        checkStrictly: false,
      }
    : undefined,
);

async function loadComments() {
  loading.value = true;
  loadError.value = '';
  try {
    comments.value = await commentsApi.list();
  } catch (error: any) {
    comments.value = [];
    loadError.value = error?.response?.data?.message || '加载评论列表失败';
    Message.error(loadError.value);
  } finally {
    loading.value = false;
  }
}

async function loadThreads() {
  if (!canViewThreads.value) return;
  threadsLoading.value = true;
  threadLoadError.value = '';
  try {
    threads.value = await commentsApi.threads({
      keyword: threadKeyword.value.trim() || undefined,
      approved: threadStatusFilter.value === 'all' ? undefined : threadStatusFilter.value === 'approved',
    });
  } catch (error: any) {
    threads.value = [];
    threadLoadError.value = error?.response?.data?.message || '加载评论会话失败';
    Message.error(threadLoadError.value);
  } finally {
    threadsLoading.value = false;
  }
}

function handleViewChange(key: string | number) {
  activeView.value = key === 'threads' ? 'threads' : 'list';
  if (activeView.value === 'threads' && canViewThreads.value && !threads.value.length && !threadsLoading.value) {
    void loadThreads();
  }
}

async function loadRules() {
  const rules = await commentsApi.getRules();
  rulesForm.value = rules;
  blockedWordsText.value = rules.blockedWords.join('\n');
  approveDomainsText.value = rules.autoApproveDomains.join('\n');
  rulesError.value = '';
}

async function openRulesModal() {
  try {
    await loadRules();
    rulesVisible.value = true;
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '加载评论规则失败');
  }
}

async function submitRules() {
  rulesSaving.value = true;
  rulesError.value = '';
  try {
    const payload: CommentModerationRules = {
      minLength: Math.max(1, Number(rulesForm.value.minLength || 1)),
      blockedWords: blockedWordsText.value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      autoApproveDomains: approveDomainsText.value
        .split('\n')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    };

    rulesForm.value = await commentsApi.updateRules(payload);
    blockedWordsText.value = rulesForm.value.blockedWords.join('\n');
    approveDomainsText.value = rulesForm.value.autoApproveDomains.join('\n');
    Message.success('评论规则已更新');
    return true;
  } catch (error: any) {
    rulesError.value = error?.response?.data?.message || '保存评论规则失败';
    Message.error(rulesError.value);
    return false;
  } finally {
    rulesSaving.value = false;
  }
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function clearSelected(ids: string[]) {
  const idSet = new Set(ids);
  selectedKeys.value = selectedKeys.value.filter((key) => !idSet.has(key));
}

function resolveBatchRemoveKeys(keys: string[]) {
  const selected = new Set(keys);
  const parentMap = new Map(comments.value.map((item) => [item.id, item.parentId ?? null]));

  return keys.filter((id) => {
    let current = parentMap.get(id);
    while (current) {
      if (selected.has(current)) {
        return false;
      }
      current = parentMap.get(current) ?? null;
    }
    return true;
  });
}

async function review(record: CommentRecord, approved: boolean) {
  try {
    await commentsApi.review(record.id, approved);
    record.approved = approved;
    record.hasPendingInTree = !approved || (record.children || []).some((child) => !child.approved);
    Message.success(`${record.author} 的评论已${approved ? '通过' : '驳回'}`);
    clearSelected([record.id]);
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '评论审核失败');
  }
}

async function removeComment(id: string) {
  try {
    await commentsApi.remove(id);
    comments.value = comments.value.filter((item) => item.id !== id && item.parentId !== id);
    Message.success('评论已删除');
    clearSelected([id]);
    if (activeView.value === 'threads') {
      await loadThreads();
    }
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '删除评论失败');
  }
}

async function batchReview(approved: boolean) {
  const keys = [...selectedKeys.value];
  if (!keys.length) return;

  reviewLoading.value = true;
  try {
    await Promise.all(keys.map((id) => commentsApi.review(id, approved)));
    Message.success(`已批量${approved ? '通过' : '驳回'} ${keys.length} 条评论`);
    selectedKeys.value = [];
    await loadComments();
    if (activeView.value === 'threads') {
      await loadThreads();
    }
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '批量审核失败');
  } finally {
    reviewLoading.value = false;
  }
}

async function batchRemove() {
  const keys = resolveBatchRemoveKeys([...selectedKeys.value]);
  if (!keys.length) return;

  deleteLoading.value = true;
  try {
    await Promise.all(keys.map((id) => commentsApi.remove(id)));
    Message.success(`已批量删除 ${keys.length} 条评论`);
    selectedKeys.value = [];
    await loadComments();
    if (activeView.value === 'threads') {
      await loadThreads();
    }
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '批量删除失败');
  } finally {
    deleteLoading.value = false;
  }
}

function openThread(thread: CommentConversation) {
  currentThread.value = thread;
  threadDetailVisible.value = true;
}

onMounted(async () => {
  await loadComments();
});
</script>

<style scoped>
.comments-card {
  overflow: hidden;
}

.view-tabs {
  margin-top: -6px;
}

.modal-alert {
  margin-bottom: 16px;
}
</style>
