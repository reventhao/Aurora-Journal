<template>
  <article
    class="thread-node"
    :class="{
      'thread-node--accent': item.isRootAuthor,
      'thread-node--child': item.depth > 0,
    }"
    :style="{
      '--thread-tone': item.toneColor,
      '--thread-tone-soft': item.toneSoftColor,
      '--thread-tone-strong': item.toneStrongColor,
    }"
  >
    <div class="thread-node__body">
      <div class="thread-node__avatar" :class="{ 'thread-node__avatar--accent': item.isRootAuthor }">
        {{ getInitial(item.author) }}
      </div>

      <div class="thread-node__panel">
        <div class="thread-node__meta">
          <div class="thread-node__author">
            <strong>{{ item.author }}</strong>
            <a-tag v-if="item.isRootAuthor" size="small" color="arcoblue" bordered>原评论作者</a-tag>
            <a-tag size="small" bordered>回复 {{ item.replyToAuthor }}</a-tag>
          </div>
          <div class="thread-node__meta-side">
            <a-tag v-if="!item.approved" size="small" color="orange">待审核</a-tag>
            <span>{{ formatDate(item.createdAt) }}</span>
          </div>
        </div>

        <div class="thread-node__context">
          <span class="thread-node__context-label">回复给 {{ item.replyToAuthor }}</span>
          <span v-if="item.parentPreview" class="thread-node__context-preview">
            {{ item.parentPreview }}
          </span>
        </div>

        <div class="thread-node__bubble">
          <p>{{ item.content }}</p>
        </div>
      </div>
    </div>

    <div v-if="item.replies.length" class="thread-node__children">
      <CommentThreadNode v-for="child in item.replies" :key="child.id" :item="child" :format-date="formatDate" />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { CommentThreadItem } from '../types';

defineOptions({
  name: 'CommentThreadNode',
});

defineProps<{
  item: CommentThreadItem;
  formatDate: (value: string) => string;
}>();

function getInitial(name: string) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}
</script>

<style scoped>
.thread-node {
  display: grid;
  gap: 14px;
}

.thread-node__body {
  position: relative;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.thread-node__body::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 21px;
  width: 22px;
  height: 1px;
  background: var(--thread-tone-strong, rgba(148, 163, 184, 0.3));
}

.thread-node__avatar {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 2px solid rgb(255 255 255 / 0.92);
  border-radius: 999px;
  background: linear-gradient(135deg, rgb(107 114 128), rgb(71 85 105));
  box-shadow: 0 10px 22px rgb(15 23 42 / 0.14);
  color: white;
  font-size: 13px;
  font-weight: 700;
}

.thread-node__avatar--accent {
  background: linear-gradient(135deg, rgb(22 93 255), rgb(65 182 230));
}

.thread-node__panel {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.thread-node__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.thread-node__author {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.thread-node__author strong {
  color: var(--admin-text);
  font-size: 14px;
}

.thread-node__meta-side {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.thread-node__context {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.thread-node__context-label {
  color: var(--thread-tone, var(--admin-text-secondary));
  font-weight: 600;
}

.thread-node__context-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(100%, 440px);
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--thread-tone-soft, rgba(148, 163, 184, 0.12));
}

.thread-node__bubble {
  position: relative;
  padding: 14px 16px;
  border: 1px solid var(--admin-border);
  border-radius: 18px 18px 18px 8px;
  background: color-mix(in srgb, var(--admin-surface-strong) 96%, transparent);
  box-shadow: 0 14px 30px rgb(15 23 42 / 0.06);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.thread-node__bubble::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 16px;
  width: 12px;
  height: 12px;
  border-left: 1px solid var(--admin-border);
  border-bottom: 1px solid var(--admin-border);
  background: inherit;
  transform: rotate(45deg);
}

.thread-node--accent .thread-node__bubble {
  background: linear-gradient(180deg, rgb(247 250 255), rgb(239 246 255));
  border-color: rgba(22, 93, 255, 0.16);
}

.thread-node:hover .thread-node__bubble {
  transform: translateY(-1px);
  border-color: var(--thread-tone-strong, rgba(148, 163, 184, 0.24));
  box-shadow: 0 18px 34px rgb(15 23 42 / 0.08);
}

.thread-node__bubble p {
  margin: 0;
  color: var(--admin-text);
  line-height: 1.8;
  white-space: pre-wrap;
}

.thread-node__children {
  position: relative;
  display: grid;
  gap: 16px;
  margin-left: 20px;
  padding-left: 24px;
}

.thread-node__children::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 20px;
  left: 0;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--thread-tone-strong, rgba(148, 163, 184, 0.3)), rgba(148, 163, 184, 0.05));
}

.thread-node--child > .thread-node__body::after {
  content: '';
  position: absolute;
  left: -24px;
  top: 10px;
  bottom: 12px;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--thread-tone-strong, rgba(148, 163, 184, 0.22)), transparent);
}

[data-admin-theme='dark'] .thread-node__bubble {
  background: linear-gradient(180deg, rgb(19 29 44 / 0.98), rgb(15 23 36 / 0.96));
  box-shadow: 0 16px 32px rgb(0 0 0 / 0.2);
}

[data-admin-theme='dark'] .thread-node--accent .thread-node__bubble {
  background: linear-gradient(180deg, rgb(17 39 84 / 0.96), rgb(14 33 66 / 0.94));
  border-color: rgba(76, 111, 255, 0.34);
}

[data-admin-theme='dark'] .thread-node__context-preview {
  background: color-mix(in srgb, var(--thread-tone-soft, rgba(94, 115, 153, 0.18)) 70%, transparent);
}
</style>
