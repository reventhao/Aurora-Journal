<template>
  <div class="comment-thread">
    <div v-if="root" class="comment-thread-toolbar">
      <button
        type="button"
        class="comment-sort-button"
        :class="{ active: sortMode === 'latest' }"
        @click="sortMode = 'latest'"
      >
        最新
      </button>
      <button
        type="button"
        class="comment-sort-button"
        :class="{ active: sortMode === 'hot' }"
        @click="sortMode = 'hot'"
      >
        最热
      </button>
    </div>

    <div v-if="sortedComments.length" :class="root ? 'comment-list' : 'reply-list'">
      <article v-for="comment in sortedComments" :key="comment.id" :class="root ? 'comment-item' : 'reply-item'">
        <div class="comment-item-header">
          <strong>{{ comment.author }}</strong>
          <span>{{ formatDate(comment.createdAt) }}</span>
        </div>

        <p>
          <span v-if="comment.replyToAuthor" class="comment-reply-target">回复 {{ comment.replyToAuthor }}：</span>
          {{ comment.content }}
        </p>

        <div class="comment-actions">
          <button type="button" class="comment-action" @click="$emit('like', comment.id)">
            👍 {{ comment.likes || 0 }}
          </button>
          <button type="button" class="comment-action" @click="toggleReply(comment.id)">
            回复
          </button>
          <button
            v-if="comment.replies?.length"
            type="button"
            class="comment-action"
            @click="toggleReplies(comment.id)"
          >
            {{ expandedReplies[comment.id] ? '收起回复' : `展开回复 (${comment.replies.length})` }}
          </button>
        </div>

        <CommentForm
          v-if="activeReplyId === comment.id"
          :post-id="postId"
          :parent-id="comment.id"
          :compact="true"
          :reply-to-label="comment.author"
          @submitted="handleSubmitted(comment.id)"
          @cancel="activeReplyId = null"
        />

        <CommentThread
          v-if="comment.replies?.length && expandedReplies[comment.id]"
          :post-id="postId"
          :comments="comment.replies"
          :root="false"
          @refresh="$emit('refresh')"
          @like="$emit('like', $event)"
        />
      </article>
    </div>

    <div v-else-if="root" class="comment-empty">还没有评论，欢迎第一个发言。</div>
  </div>
</template>

<script setup lang="ts">
import type { CommentSummary } from '@aurora/shared';
import { computed, reactive, ref } from 'vue';

import CommentForm from './CommentForm.vue';

defineOptions({
  name: 'CommentThread',
});

const props = withDefaults(
  defineProps<{
    postId: string;
    comments: CommentSummary[];
    root?: boolean;
  }>(),
  {
    root: true,
  },
);

const emit = defineEmits<{
  refresh: [];
  like: [commentId: string];
}>();

const sortMode = ref<'latest' | 'hot'>('latest');
const activeReplyId = ref<string | null>(null);
const expandedReplies = reactive<Record<string, boolean>>({});
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const sortedComments = computed(() => {
  const items = [...props.comments];
  if (!props.root) {
    return items.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  }

  if (sortMode.value === 'hot') {
    return items.sort((left, right) => {
      const likeGap = (right.likes || 0) - (left.likes || 0);
      if (likeGap !== 0) return likeGap;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }

  return items.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function toggleReply(commentId: string) {
  activeReplyId.value = activeReplyId.value === commentId ? null : commentId;
  if (activeReplyId.value === commentId) {
    expandedReplies[commentId] = true;
  }
}

function toggleReplies(commentId: string) {
  expandedReplies[commentId] = !expandedReplies[commentId];
}

function handleSubmitted(commentId: string) {
  expandedReplies[commentId] = true;
  activeReplyId.value = null;
  emit('refresh');
}
</script>
