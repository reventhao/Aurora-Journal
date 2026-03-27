<template>
  <section class="container page-section">
    <div class="page-header">
      <div>
        <span class="eyebrow">Categories</span>
        <h1>全部分类</h1>
        <p class="page-subtext">按主题组织内容，快速找到你关心的方向。</p>
      </div>
    </div>

    <div v-if="loading" class="empty-state">
      <strong>正在加载分类…</strong>
      <p>马上就好。</p>
    </div>

    <div v-else class="category-grid">
      <RouterLink v-for="category in categories" :key="category.id" class="catalog-card" :to="`/categories/${category.slug}`">
        <strong>{{ category.name }}</strong>
        <p>{{ category.description || '这个分类下汇集了一组相关主题文章。' }}</p>
        <span>{{ category.postCount }} 篇文章</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { fetchCategories } from '../api/public';

const categories = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    categories.value = await fetchCategories();
  } finally {
    loading.value = false;
  }
});
</script>
