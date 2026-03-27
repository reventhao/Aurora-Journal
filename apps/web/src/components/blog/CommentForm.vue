<template>
  <form class="comment-form" :class="{ compact }" @submit.prevent="handleSubmit">
    <div class="comment-form-header">
      <strong>{{ compact ? `回复 ${replyToLabel}` : '发表评论' }}</strong>
      <p>{{ compact ? '回复提交后会进入审核流程。' : '留言提交后会进入审核流程。' }}</p>
    </div>

    <div class="form-grid form-grid-two-columns">
      <label class="field-group">
        <span>昵称</span>
        <input v-model="form.author" placeholder="怎么称呼你？" required />
      </label>
      <label class="field-group">
        <span>邮箱</span>
        <input v-model="form.email" placeholder="用于接收回复通知" type="email" required />
      </label>
    </div>

    <label class="field-group">
      <span>评论内容</span>
      <textarea
        v-model="form.content"
        :placeholder="compact ? '写下你的回复…' : '写下你的看法…'"
        :rows="compact ? 3 : 4"
        required
      />
    </label>

    <div class="comment-form-footer">
      <button class="btn btn-primary" :disabled="submitting">
        {{ submitting ? '提交中…' : compact ? '提交回复' : '提交评论' }}
      </button>
      <button v-if="compact" type="button" class="btn btn-secondary" @click="$emit('cancel')">取消</button>
      <p v-if="message" class="form-message" :class="{ 'form-message-error': messageType === 'error' }">
        {{ message }}
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { submitComment } from '../../api/public';

const props = withDefaults(
  defineProps<{
    postId: string;
    parentId?: string;
    compact?: boolean;
    replyToLabel?: string;
  }>(),
  {
    parentId: undefined,
    compact: false,
    replyToLabel: '这条评论',
  },
);

const emit = defineEmits<{
  submitted: [];
  cancel: [];
}>();

const form = reactive({
  author: '',
  email: '',
  content: '',
});
const submitting = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const trimmedContentLength = computed(() => form.content.trim().length);

async function handleSubmit() {
  message.value = '';

  if (trimmedContentLength.value < 3) {
    messageType.value = 'error';
    message.value = '评论内容至少需要 3 个字。';
    return;
  }

  submitting.value = true;
  try {
    await submitComment(props.postId, {
      ...form,
      parentId: props.parentId,
    });

    form.author = '';
    form.email = '';
    form.content = '';
    messageType.value = 'success';
    message.value = props.compact ? '回复已提交，审核通过后会显示。' : '评论已提交，审核通过后会显示。';
    emit('submitted');
  } catch (error: any) {
    messageType.value = 'error';
    message.value = error?.response?.data?.message || '提交失败，请检查输入后重试。';
  } finally {
    submitting.value = false;
  }
}
</script>
