<template>
  <section class="container page-section">
    <div class="page-header">
      <div>
        <span class="eyebrow">Category</span>
        <h1>{{ title }}</h1>
        <p class="page-subtext">这个分类下的所有文章。</p>
      </div>
    </div>

    <div v-if="loading" class="empty-state">
      <strong>正在加载分类文章…</strong>
      <p>请稍候。</p>
    </div>

    <div v-else-if="posts.items.length" class="post-grid">
      <PostCard v-for="post in posts.items" :key="post.id" :post="post" />
    </div>

    <div v-else class="empty-state">
      <strong>这个分类下暂时还没有文章</strong>
      <p>你可以返回分类页继续浏览。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { fetchPosts } from '../api/public';
import PostCard from '../components/blog/PostCard.vue';

const route = useRoute();
const posts = ref({ items: [] as any[] });
const loading = ref(true);
const title = computed(() => String(route.params.slug || '').replace(/-/g, ' '));

async function load() {
  loading.value = true;
  try {
    posts.value = await fetchPosts({ category: route.params.slug });
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.slug, load);
onMounted(load);
</script>
