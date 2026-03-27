<template>
  <RouterLink
    class="tag-pill"
    :class="[`tag-pill--${size}`, { 'tag-pill--stretch-mobile': stretchOnMobile }]"
    :to="to"
    :style="tagStyle"
    :title="tag.name"
  >
    <span class="tag-pill__hash">#</span>
    <span class="tag-pill__name">{{ tag.name }}</span>
    <strong v-if="showCount" class="tag-pill__count">{{ tag.postCount ?? 0 }}</strong>
  </RouterLink>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';

type TagLike = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  postCount?: number | null;
};

const props = withDefaults(
  defineProps<{
    tag: TagLike;
    to?: string;
    showCount?: boolean;
    size?: 'default' | 'compact';
    stretchOnMobile?: boolean;
  }>(),
  {
    to: undefined,
    showCount: false,
    size: 'default',
    stretchOnMobile: false,
  },
);

const to = computed(() => props.to ?? `/tags/${props.tag.slug}`);

const tagStyle = computed<CSSProperties & Record<string, string>>(() => {
  const accent = props.tag.color?.trim() || '#165dff';
  return {
    '--tag-accent': accent,
    '--tag-accent-soft': toRgba(accent, 0.14),
    '--tag-accent-border': toRgba(accent, 0.24),
    '--tag-accent-strong': toRgba(accent, 0.92),
  };
});

function toRgba(color: string, alpha: number) {
  const normalized = color.trim();

  if (/^#([\da-f]{3}|[\da-f]{6})$/i.test(normalized)) {
    const hex = normalized.slice(1);
    const value = hex.length === 3 ? hex.split('').map((item) => item + item).join('') : hex;
    const parsed = Number.parseInt(value, 16);
    const r = (parsed >> 16) & 255;
    const g = (parsed >> 8) & 255;
    const b = parsed & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const channels = rgbMatch[1]
      .split(',')
      .slice(0, 3)
      .map((item) => Number.parseInt(item.trim(), 10));

    if (channels.length === 3 && channels.every((item) => Number.isFinite(item))) {
      return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
    }
  }

  return `rgba(22, 93, 255, ${alpha})`;
}
</script>

<style scoped>
.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid var(--tag-accent-border, rgba(22, 93, 255, 0.18));
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), var(--tag-accent-soft, rgba(22, 93, 255, 0.1)));
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.tag-pill:hover,
.tag-pill:focus-visible {
  transform: translateY(-2px);
  border-color: var(--tag-accent, #3474ff);
  box-shadow: 0 14px 28px var(--tag-accent-soft, rgba(52, 116, 255, 0.18));
}

.tag-pill__hash {
  display: inline-grid;
  flex: none;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--tag-accent-soft, rgba(52, 116, 255, 0.12));
  color: var(--tag-accent, rgb(52, 116, 255));
  font-size: 0.72rem;
  font-weight: 700;
}

.tag-pill__name {
  min-width: 0;
  max-width: 14ch;
  overflow: hidden;
  color: var(--tag-accent-strong, var(--text));
  font-size: 0.9rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-pill__count {
  display: inline-grid;
  flex: none;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--tag-accent-border, rgba(15, 23, 42, 0.08));
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--tag-accent-strong, var(--text));
  font-size: 11px;
  line-height: 1;
}

.tag-pill--compact {
  gap: 6px;
  min-height: 34px;
  padding: 7px 10px;
}

.tag-pill--compact .tag-pill__hash {
  width: 16px;
  height: 16px;
  font-size: 0.68rem;
}

.tag-pill--compact .tag-pill__name {
  max-width: 12ch;
  font-size: 0.84rem;
}

.tag-pill--compact .tag-pill__count {
  min-width: 20px;
  height: 20px;
  font-size: 10px;
}

@media (max-width: 720px) {
  .tag-pill--stretch-mobile {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
