<template>
  <section class="container page-section">
    <div class="page-header">
      <div>
        <span class="eyebrow">稍后再读</span>
        <h1>阅读清单</h1>
        <p class="page-subtext">把暂时不想错过的文章先收起来，之后再慢慢读。</p>
      </div>
      <div class="filter-bar">
        <button v-if="readingList.items.length" class="btn btn-secondary" @click="clearList">清空清单</button>
      </div>
    </div>

    <div v-if="readingList.items.length" class="post-grid">
      <PostCard v-for="post in readingList.items" :key="post.id" :post="post" />
    </div>

    <div v-else class="empty-state">
      <strong>阅读清单还是空的</strong>
      <p>在文章卡片或文章详情页点击“加入清单”，这里就会自动收纳起来。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import PostCard from '../components/blog/PostCard.vue';
import { useReadingListStore } from '../stores/reading-list';

const readingList = useReadingListStore();
readingList.load();

function clearList() {
  for (const item of [...readingList.items]) {
    readingList.remove(item.id);
  }
}
</script>
