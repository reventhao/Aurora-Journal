<template>
  <section class="settings-section preview-panel">
    <div class="section-title-row">
      <strong>拖拽编排</strong>
      <span>{{ currentPresetLabel }} · 2 列网格</span>
    </div>

    <div class="layout-canvas">
      <div class="home-preview__hero" aria-hidden="true">
        <div class="home-preview__hero-copy">
          <span class="skeleton-bar skeleton-bar--hero skeleton-bar--primary" />
          <span class="skeleton-bar skeleton-bar--hero skeleton-bar--secondary" />
        </div>
        <div class="home-preview__actions">
          <span class="preview-pill preview-pill--primary" />
          <span class="preview-pill" />
        </div>
      </div>

      <div v-if="!layout.length" class="preview-empty">至少启用一个模块后，首页预览才会显示在这里。</div>

      <GridLayout
        v-else
        class="home-layout-grid"
        :layout="layout"
        :col-num="2"
        :row-height="124"
        :max-rows="8"
        :margin="[16, 16]"
        :is-draggable="canUpdateSettings"
        :is-resizable="false"
        :is-bounded="true"
        :use-css-transforms="false"
        :vertical-compact="false"
        :prevent-collision="false"
        @layout-updated="$emit('layout-change', $event)"
      >
        <GridItem
          v-for="section in sections"
          :key="section.key"
          :i="section.key"
          :x="section.x"
          :y="section.y"
          :w="section.w"
          :h="section.h"
          :min-w="1"
          :min-h="1"
        >
          <article
            class="layout-widget"
            :class="[`layout-widget--${getSectionVariant(section)}`, `layout-widget--${section.key}`]"
          >
            <div class="layout-widget__bar">
              <div class="layout-widget__copy" aria-hidden="true">
                <span class="layout-widget__badge" />
                <div class="layout-widget__bars">
                  <strong class="layout-widget__title">{{ getPreviewLabel(section.key) }}</strong>
                  <span class="skeleton-bar skeleton-bar--meta" />
                </div>
              </div>

              <div class="layout-widget__controls" role="group" aria-label="模块尺寸">
                <a-tooltip v-for="option in sizeOptions" :key="`${section.key}-${option.key}`" :content="option.note" mini>
                  <button
                    type="button"
                    class="layout-size-chip"
                    :class="{ 'layout-size-chip--active': section.w === option.w && section.h === option.h }"
                    :disabled="!canUpdateSettings"
                    @click="$emit('size-change', section, option.w, option.h)"
                  >
                    <span class="layout-size-chip__shape" :class="`layout-size-chip__shape--${option.key}`">
                      <span />
                    </span>
                  </button>
                </a-tooltip>
              </div>
            </div>

            <div class="preview-unified" :class="`preview-unified--${getSectionVariant(section)}`" aria-hidden="true">
              <article
                v-for="index in buildRange(getUnifiedPreviewCount(section))"
                :key="`${section.key}-${index}`"
                class="preview-unified__item"
              >
                <div class="preview-unified__body">
                  <span class="skeleton-bar skeleton-bar--title" />
                  <span class="skeleton-bar skeleton-bar--meta" />
                </div>
              </article>
            </div>
          </article>
        </GridItem>
      </GridLayout>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { HomeSectionSetting } from '@aurora/shared';
import type { Layout } from 'grid-layout-plus';
import { GridItem, GridLayout } from 'grid-layout-plus';

import { sizeOptions } from './home-layout';

type SectionVariant = 'compact' | 'wide' | 'tall';

defineProps<{
  currentPresetLabel: string;
  sections: HomeSectionSetting[];
  layout: Layout;
  canUpdateSettings: boolean;
  heroTitle: string;
  heroDescription: string;
}>();

defineEmits<{
  'layout-change': [layout: Layout];
  'size-change': [section: HomeSectionSetting, w: HomeSectionSetting['w'], h: HomeSectionSetting['h']];
}>();

function buildRange(count: number) {
  return Array.from({ length: count }, (_, index) => index + 1);
}

function getPreviewLabel(key: HomeSectionSetting['key']) {
  return (
    {
      featuredPosts: '精选',
      latestPosts: '最新',
      categories: '分栏',
      tags: '标签',
    } satisfies Record<HomeSectionSetting['key'], string>
  )[key];
}

function getSectionVariant(section: Pick<HomeSectionSetting, 'w' | 'h'>): SectionVariant {
  if (section.w === 2) return 'wide';
  if (section.h === 2) return 'tall';
  return 'compact';
}

function getUnifiedPreviewCount(section: Pick<HomeSectionSetting, 'w' | 'h'>) {
  const variant = getSectionVariant(section);
  if (variant === 'compact') return 4;
  if (variant === 'wide') return 6;
  return 5;
}
</script>

<style scoped>
.settings-section {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--admin-border);
  border-radius: 22px;
  background: color-mix(in srgb, var(--admin-surface-strong) 94%, transparent);
}

.section-title-row,
.home-preview__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title-row span {
  color: var(--admin-text-secondary);
}

.layout-canvas {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(145, 158, 171, 0.16);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.98), rgba(244, 247, 252, 0.98));
}

.home-preview__hero {
  align-items: flex-start;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(52, 116, 255, 0.12), rgba(82, 196, 255, 0.08));
}

.home-preview__hero-copy {
  display: grid;
  gap: 8px;
  min-width: min(340px, 100%);
  flex: 1;
}

.home-preview__actions,
.layout-widget__controls,
.preview-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.home-preview__actions {
  justify-content: flex-end;
}

.preview-empty {
  display: grid;
  place-items: center;
  min-height: 280px;
  padding: 24px;
  border: 1px dashed rgba(145, 158, 171, 0.22);
  border-radius: 20px;
  background: color-mix(in srgb, var(--admin-surface) 84%, transparent);
  color: var(--admin-text-secondary);
  text-align: center;
}

.home-layout-grid {
  min-height: 560px;
  border-radius: 22px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(22, 93, 255, 0.06) 1px, transparent 1px) 0 0 / calc(50% - 8px) 100%,
    linear-gradient(rgba(22, 93, 255, 0.04) 1px, transparent 1px) 0 0 / 100% 140px,
    linear-gradient(180deg, rgba(248, 251, 255, 0.92), rgba(244, 248, 252, 0.94));
}

:deep(.home-layout-grid.vgl-layout) {
  min-height: 560px;
}

:deep(.home-layout-grid .vgl-item) {
  transition: none;
  z-index: 1;
}

:deep(.home-layout-grid .vgl-item--placeholder) {
  z-index: 0;
  border: 1px dashed rgba(22, 93, 255, 0.22);
  border-radius: 22px;
  background: rgba(22, 93, 255, 0.04);
  box-shadow: none;
}

.layout-widget {
  --widget-tint: rgba(22, 93, 255, 0.12);
  --widget-fill: rgba(22, 93, 255, 0.18);
  --widget-fill-soft: rgba(22, 93, 255, 0.1);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 14px;
  overflow: hidden;
  border: 1px solid rgba(145, 158, 171, 0.18);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 253, 0.92));
  box-shadow: 0 18px 34px rgb(15 23 42 / 0.08);
  box-sizing: border-box;
}

.layout-widget--wide,
.layout-widget--tall {
  padding: 16px;
}

.layout-widget--featuredPosts {
  --widget-tint: rgba(76, 110, 245, 0.14);
  --widget-fill: rgba(76, 110, 245, 0.24);
  --widget-fill-soft: rgba(76, 110, 245, 0.12);
}

.layout-widget--latestPosts {
  --widget-tint: rgba(17, 185, 129, 0.14);
  --widget-fill: rgba(17, 185, 129, 0.22);
  --widget-fill-soft: rgba(17, 185, 129, 0.12);
}

.layout-widget--categories {
  --widget-tint: rgba(250, 140, 22, 0.14);
  --widget-fill: rgba(250, 140, 22, 0.22);
  --widget-fill-soft: rgba(250, 140, 22, 0.12);
}

.layout-widget--tags {
  --widget-tint: rgba(168, 85, 247, 0.14);
  --widget-fill: rgba(168, 85, 247, 0.22);
  --widget-fill-soft: rgba(168, 85, 247, 0.12);
}

.layout-widget__bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px 12px;
}

.layout-widget__copy {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.layout-widget__badge {
  width: 12px;
  height: 36px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--widget-fill), var(--widget-fill-soft));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--widget-fill) 72%, white);
}

.layout-widget__bars,
.preview-stack {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.layout-widget__title {
  overflow: hidden;
  color: var(--admin-text);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.layout-size-chip {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 30px;
  padding: 0;
  border: 1px solid rgba(145, 158, 171, 0.18);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.04);
  color: var(--admin-text-secondary);
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease, transform 140ms ease;
}

.layout-size-chip:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(22, 93, 255, 0.24);
  color: rgb(22, 93, 255);
}

.layout-size-chip--active {
  border-color: rgba(22, 93, 255, 0.32);
  background: rgba(22, 93, 255, 0.1);
  color: rgb(22, 93, 255);
}

.layout-size-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.layout-size-chip__shape {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 16px;
  padding: 2px;
  border-radius: 999px;
  background: rgba(22, 93, 255, 0.08);
}

.layout-size-chip__shape span {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 4px;
  background: currentColor;
  opacity: 0.88;
}

.layout-size-chip__shape--wide span {
  width: 16px;
}

.layout-size-chip__shape--tall span {
  width: 10px;
  height: 14px;
}

.skeleton-bar,
.preview-pill,
.preview-mini-pill,
.preview-tag-pill,
.preview-catalog__swatch {
  display: block;
  border-radius: 999px;
}

.skeleton-bar {
  height: 10px;
  background: linear-gradient(90deg, var(--widget-fill), var(--widget-fill-soft));
}

.skeleton-bar--hero {
  height: 12px;
  background: linear-gradient(90deg, rgba(22, 93, 255, 0.3), rgba(82, 196, 255, 0.18));
}

.skeleton-bar--primary {
  width: min(280px, 82%);
}

.skeleton-bar--secondary {
  width: min(220px, 64%);
}

.skeleton-bar--title {
  width: 72%;
}

.skeleton-bar--meta {
  width: 48%;
  opacity: 0.82;
}

.skeleton-bar--catalog {
  width: 58%;
}

.preview-pill,
.preview-mini-pill,
.preview-tag-pill {
  height: 28px;
  background: linear-gradient(90deg, var(--widget-fill), var(--widget-fill-soft));
}

.preview-pill {
  width: 84px;
}

.preview-pill--primary {
  width: 96px;
  background: linear-gradient(90deg, rgba(22, 93, 255, 0.34), rgba(82, 196, 255, 0.2));
}

.preview-mini-pill {
  width: 56px;
  height: 18px;
}

.preview-mini-pill--muted {
  width: 42px;
  opacity: 0.72;
}

.preview-panel-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  border: 1px solid rgba(145, 158, 171, 0.16);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 246, 250, 0.96));
}

.preview-unified {
  min-width: 0;
  min-height: 0;
}

.preview-unified--compact {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.preview-unified--wide {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.preview-unified--tall {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.preview-unified__item {
  display: grid;
  gap: 10px;
  align-content: start;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  border: 1px solid rgba(145, 158, 171, 0.16);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 246, 250, 0.96));
  box-sizing: border-box;
}

.preview-unified__body {
  display: grid;
  gap: 8px;
}

.preview-unified--compact .preview-unified__item {
  min-height: 72px;
}

.preview-unified--wide .preview-unified__item {
  min-height: 84px;
}

.preview-unified--tall .preview-unified__item {
  min-height: 86px;
}

[data-admin-theme='dark'] .layout-canvas {
  background: linear-gradient(180deg, rgba(12, 20, 31, 0.98), rgba(15, 24, 38, 0.98));
}

[data-admin-theme='dark'] .home-preview__hero {
  background: linear-gradient(135deg, rgba(22, 93, 255, 0.18), rgba(82, 196, 255, 0.12));
}

[data-admin-theme='dark'] .home-layout-grid {
  background:
    linear-gradient(90deg, rgba(82, 196, 255, 0.08) 1px, transparent 1px) 0 0 / calc(50% - 8px) 100%,
    linear-gradient(rgba(82, 196, 255, 0.05) 1px, transparent 1px) 0 0 / 100% 140px,
    linear-gradient(180deg, rgba(12, 20, 31, 0.96), rgba(15, 24, 38, 0.98));
}

[data-admin-theme='dark'] .layout-widget,
[data-admin-theme='dark'] .preview-panel-card,
[data-admin-theme='dark'] .preview-unified__item,
[data-admin-theme='dark'] .preview-empty {
  background: linear-gradient(180deg, rgb(20 29 43 / 0.98), rgb(16 24 38 / 0.96));
  box-shadow: 0 18px 34px rgb(0 0 0 / 0.24);
}

[data-admin-theme='dark'] .layout-size-chip {
  background: rgba(148, 163, 184, 0.08);
}

</style>
