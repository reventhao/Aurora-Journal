<template>
  <article
    class="post-card post-card-link"
    role="link"
    tabindex="0"
    @click="openPost"
    @keydown.enter.prevent="openPost"
    @keydown.space.prevent="openPost"
  >
    <div class="post-card-media">
      <img
        :src="post.coverThumbUrl || post.coverImage || fallbackImage"
        :alt="post.title"
        loading="lazy"
        decoding="async"
        width="720"
        height="450"
      />
      <button type="button" class="post-card-save" @click.stop="toggleReadingList">
        {{ isSaved ? '已收藏' : '加入清单' }}
      </button>
    </div>
    <div class="post-card-body">
      <div class="post-meta">
        <span>{{ post.category?.name || '未分类' }}</span>
        <span>{{ post.readingTime }} 分钟阅读</span>
      </div>
      <h3>{{ post.title }}</h3>
      <p>{{ post.excerpt }}</p>
      <div v-if="post.tags.length" class="tag-list">
        <TagPill v-for="tag in post.tags" :key="tag.id" :tag="tag" size="compact" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PostSummary } from '@aurora/shared';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import TagPill from './TagPill.vue';
import { useReadingListStore } from '../../stores/reading-list';

const props = defineProps<{ post: PostSummary }>();
const router = useRouter();
const readingList = useReadingListStore();
readingList.load();

const fallbackImage =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';

const isSaved = computed(() => readingList.has(props.post.id));

function openPost() {
  void router.push(`/posts/${props.post.slug || props.post.id}`);
}

function toggleReadingList() {
  readingList.toggle(props.post);
}
</script>
