<template>
  <a-drawer v-model:visible="visibleProxy" title="会话详情" width="820px" :footer="false">
    <div v-if="thread" class="thread-shell">
      <section class="thread-summary">
        <div class="thread-summary__copy">
          <strong>{{ thread.postTitle }}</strong>
          <div class="thread-summary__meta">
            <a-tag color="arcoblue" bordered>回复 {{ thread.totalReplies }}</a-tag>
            <a-tag :color="thread.pendingReplies ? 'orange' : 'green'" bordered>
              待处理 {{ thread.pendingReplies }}
            </a-tag>
          </div>
        </div>
      </section>

      <section class="thread-stream">
        <article class="thread-root">
          <div class="thread-root__avatar">
            {{ getInitial(thread.rootComment.author) }}
          </div>
          <div class="thread-root__panel">
            <div class="thread-root__meta">
              <div class="thread-root__author">
                <strong>{{ thread.rootComment.author }}</strong>
                <a-tag size="small" color="arcoblue" bordered>发起评论</a-tag>
              </div>
              <div class="thread-root__meta-side">
                <a-tag v-if="!thread.rootComment.approved" size="small" color="orange">待审核</a-tag>
                <span>{{ formatDate(thread.rootComment.createdAt) }}</span>
              </div>
            </div>

            <div class="thread-root__bubble">
              <p>{{ thread.rootComment.content }}</p>
            </div>
          </div>
        </article>

        <div v-if="replyTree.length" class="thread-branch">
          <CommentThreadNode v-for="reply in replyTree" :key="reply.id" :item="reply" :format-date="formatDate" />
        </div>

        <a-empty v-else description="这条评论还没有后续回复" />
      </section>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import CommentThreadNode from './CommentThreadNode.vue';
import type { CommentConversation, CommentThreadItem } from '../types';

const props = defineProps<{
  visible: boolean;
  thread: CommentConversation | null;
  formatDate: (value: string) => string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const visibleProxy = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

const AUTHOR_COLORS = [
  { color: '#3b82f6', soft: 'rgba(59, 130, 246, 0.12)', strong: 'rgba(59, 130, 246, 0.22)' },
  { color: '#14b8a6', soft: 'rgba(20, 184, 166, 0.12)', strong: 'rgba(20, 184, 166, 0.22)' },
  { color: '#f97316', soft: 'rgba(249, 115, 22, 0.12)', strong: 'rgba(249, 115, 22, 0.22)' },
  { color: '#8b5cf6', soft: 'rgba(139, 92, 246, 0.12)', strong: 'rgba(139, 92, 246, 0.22)' },
  { color: '#ef4444', soft: 'rgba(239, 68, 68, 0.12)', strong: 'rgba(239, 68, 68, 0.22)' },
  { color: '#06b6d4', soft: 'rgba(6, 182, 212, 0.12)', strong: 'rgba(6, 182, 212, 0.22)' },
] as const;

const replyTree = computed<CommentThreadItem[]>(() => {
  if (!props.thread) {
    return [];
  }

  const root = props.thread.rootComment;
  const rootItems: CommentThreadItem[] = [];
  const nodeMap = new Map<string, CommentThreadItem>();
  const authorMap = new Map<string, string>([[root.id, root.author]]);
  const contentMap = new Map<string, string>([[root.id, root.content]]);

  for (const item of props.thread.replies) {
    authorMap.set(item.id, item.author);
    contentMap.set(item.id, item.content);
  }

  for (const item of props.thread.replies) {
    const tone = getAuthorTone(item.author);
    nodeMap.set(item.id, {
      ...item,
      depth: 0,
      replyToAuthor: root.author,
      parentPreview: '',
      replies: [],
      toneColor: tone.color,
      toneSoftColor: tone.soft,
      toneStrongColor: tone.strong,
      isRootAuthor: item.author === root.author,
    });
  }

  for (const item of props.thread.replies) {
    const node = nodeMap.get(item.id);
    if (!node) {
      continue;
    }

    const parentId = item.parentId;
    const parentNode = parentId ? nodeMap.get(parentId) : undefined;
    const parentAuthor = parentId ? authorMap.get(parentId) || root.author : root.author;
    const parentPreview = parentId ? contentMap.get(parentId) || root.content : root.content;

    node.replyToAuthor = parentAuthor;
    node.parentPreview = truncateText(parentPreview, 64);
    node.depth = parentNode ? Math.min(parentNode.depth + 1, 6) : 0;

    if (parentNode) {
      parentNode.replies.push(node);
    } else {
      rootItems.push(node);
    }
  }

  return rootItems;
});

function getInitial(name: string) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

function truncateText(value: string, max = 64) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function getAuthorTone(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return AUTHOR_COLORS[hash % AUTHOR_COLORS.length];
}
</script>

<style scoped>
.thread-shell {
  display: grid;
  gap: 18px;
}

.thread-summary {
  padding: 16px 18px;
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--admin-surface-strong) 96%, transparent),
    color-mix(in srgb, var(--admin-surface) 92%, transparent)
  );
}

.thread-summary__copy {
  display: grid;
  gap: 10px;
}

.thread-summary__copy strong {
  color: var(--admin-text);
  font-size: 16px;
}

.thread-summary__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.thread-stream {
  display: grid;
  gap: 18px;
}

.thread-root {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.thread-root__avatar {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 2px solid rgb(255 255 255 / 0.92);
  border-radius: 999px;
  background: linear-gradient(135deg, rgb(22 93 255), rgb(65 182 230));
  box-shadow: 0 12px 24px rgb(15 23 42 / 0.14);
  color: white;
  font-size: 14px;
  font-weight: 700;
}

.thread-root__panel {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.thread-root__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.thread-root__author {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.thread-root__author strong {
  color: var(--admin-text);
  font-size: 15px;
}

.thread-root__meta-side {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.thread-root__bubble {
  position: relative;
  padding: 16px 18px;
  border: 1px solid rgba(22, 93, 255, 0.16);
  border-radius: 20px 20px 20px 10px;
  background: linear-gradient(180deg, rgb(247 250 255), rgb(239 246 255));
  box-shadow: 0 16px 36px rgb(15 23 42 / 0.08);
}

.thread-root__bubble::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 18px;
  width: 12px;
  height: 12px;
  border-left: 1px solid rgba(22, 93, 255, 0.16);
  border-bottom: 1px solid rgba(22, 93, 255, 0.16);
  background: inherit;
  transform: rotate(45deg);
}

.thread-root__bubble p {
  margin: 0;
  color: var(--admin-text);
  line-height: 1.85;
  white-space: pre-wrap;
}

.thread-branch {
  position: relative;
  display: grid;
  gap: 18px;
  margin-left: 20px;
  padding-left: 28px;
}

.thread-branch::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 18px;
  left: 0;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(22, 93, 255, 0.22), rgba(22, 93, 255, 0.04));
}

[data-admin-theme='dark'] .thread-root__bubble {
  background: linear-gradient(180deg, rgb(17 39 84 / 0.96), rgb(14 33 66 / 0.94));
  border-color: rgba(76, 111, 255, 0.34);
  box-shadow: 0 18px 36px rgb(0 0 0 / 0.2);
}

[data-admin-theme='dark'] .thread-root__bubble::before {
  border-left-color: rgba(76, 111, 255, 0.34);
  border-bottom-color: rgba(76, 111, 255, 0.34);
}
</style>
