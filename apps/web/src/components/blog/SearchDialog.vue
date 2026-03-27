<template>
  <Teleport to="body">
    <div v-if="visible" class="search-overlay" @click.self="emit('close')">
      <div class="search-dialog" role="dialog" aria-modal="true" aria-label="站内搜索">
        <div class="search-dialog__header">
          <div class="search-input-wrap">
            <input
              ref="inputRef"
              v-model="keyword"
              class="search-input"
              type="search"
              placeholder="搜索文章标题、摘要..."
              @keydown.esc.prevent="emit('close')"
            />
            <span class="search-shortcut">ESC</span>
          </div>
        </div>

        <div class="search-dialog__body">
          <div v-if="keyword.trim() && loading" class="search-empty">
            <strong>正在搜索...</strong>
            <p>正在匹配相关文章。</p>
          </div>

          <div v-else-if="keyword.trim() && results.length" class="search-results">
            <button
              v-for="item in results"
              :key="item.id"
              type="button"
              class="search-result"
              @click="openPost(item)"
            >
              <img
                :src="item.coverThumbUrl || item.coverImage || fallbackImage"
                :alt="item.title"
                loading="lazy"
                decoding="async"
                width="96"
                height="72"
              />
              <div class="search-result__copy">
                <strong>{{ item.title }}</strong>
                <p>{{ item.excerpt || '暂无摘要' }}</p>
                <span>
                  {{ item.category?.name || '未分类' }} · {{ item.readingTime }} 分钟阅读
                </span>
              </div>
            </button>
          </div>

          <div v-else-if="keyword.trim()" class="search-empty">
            <strong>没有找到相关内容</strong>
            <p>换个关键词试试，或者去文章列表继续浏览。</p>
          </div>

          <div v-else class="search-empty">
            <strong>搜索站内内容</strong>
            <p>输入关键词，快速找到文章、主题和最近发布的内容。</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { PostSummary } from '@aurora/shared';
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { fetchPosts } from '../../api/public';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const inputRef = ref<HTMLInputElement | null>(null);
const keyword = ref('');
const loading = ref(false);
const results = ref<PostSummary[]>([]);
const fallbackImage =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';

let timer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await nextTick();
      inputRef.value?.focus();
      return;
    }

    keyword.value = '';
    results.value = [];
    loading.value = false;
  },
);

watch(keyword, (value) => {
  if (timer) {
    clearTimeout(timer);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    results.value = [];
    loading.value = false;
    return;
  }

  timer = setTimeout(async () => {
    loading.value = true;
    try {
      const response = await fetchPosts({
        keyword: trimmed,
        pageSize: 6,
      });
      results.value = response.items || [];
    } finally {
      loading.value = false;
    }
  }, 220);
});

async function openPost(item: PostSummary) {
  emit('close');
  await router.push(`/posts/${item.slug || item.id}`);
}

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
  }
});
</script>
