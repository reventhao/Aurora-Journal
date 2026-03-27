<template>
  <section class="container page-section">
    <div class="page-header">
      <div>
        <span class="eyebrow">Tags</span>
        <h1>全部标签</h1>
        <p class="page-subtext">按更细的主题颗粒度浏览内容。</p>
      </div>
    </div>

    <div v-if="loading" class="empty-state">
      <strong>正在加载标签…</strong>
      <p>马上就好。</p>
    </div>

    <div v-else class="tag-cloud">
      <TagPill v-for="tag in tags" :key="tag.id" :tag="tag" :show-count="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TagSummary } from '@aurora/shared';
import { onMounted, ref } from 'vue';

import { fetchTags } from '../api/public';
import TagPill from '../components/blog/TagPill.vue';

const tags = ref<TagSummary[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    tags.value = await fetchTags();
  } finally {
    loading.value = false;
  }
});
</script>
