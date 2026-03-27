import type { PostSummary } from '@aurora/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const STORAGE_KEY = 'aurora-reading-list';

function normalizePost(post: PostSummary): PostSummary {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    coverThumbUrl: post.coverThumbUrl,
    status: post.status,
    readingTime: post.readingTime,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
    featured: post.featured,
    views: post.views,
    category: post.category,
    tags: post.tags,
    createdAt: post.createdAt,
  };
}

export const useReadingListStore = defineStore('reading-list', () => {
  const items = ref<PostSummary[]>([]);
  const loaded = ref(false);

  const count = computed(() => items.value.length);

  function load() {
    if (loaded.value || typeof window === 'undefined') {
      loaded.value = true;
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      items.value = raw ? JSON.parse(raw) : [];
    } catch {
      items.value = [];
    } finally {
      loaded.value = true;
    }
  }

  function persist() {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
  }

  function has(postId: string) {
    return items.value.some((item) => item.id === postId);
  }

  function add(post: PostSummary) {
    if (has(post.id)) return;
    items.value = [normalizePost(post), ...items.value];
    persist();
  }

  function remove(postId: string) {
    items.value = items.value.filter((item) => item.id !== postId);
    persist();
  }

  function toggle(post: PostSummary) {
    if (has(post.id)) {
      remove(post.id);
      return false;
    }

    add(post);
    return true;
  }

  return {
    items,
    loaded,
    count,
    load,
    has,
    add,
    remove,
    toggle,
  };
});
