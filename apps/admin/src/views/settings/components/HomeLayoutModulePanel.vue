<template>
  <section class="settings-section arrangement-panel">
    <div class="section-title-row">
      <strong>模块设置</strong>
      <span>{{ enabledCount }} 个已启用模块</span>
    </div>

    <div class="module-stack">
      <article
        v-for="(section, index) in sections"
        :key="section.key"
        class="module-card"
        :class="{ 'module-card--disabled': !section.enabled }"
      >
        <a-tag size="small" color="arcoblue" class="module-card__order">{{ formatOrder(index) }}</a-tag>

        <div class="module-card__head">
          <div class="module-card__copy">
            <strong>{{ getSectionLabel(section.key) }}</strong>
            <span>{{ formatPosition(section) }}</span>
          </div>
          <a-tag size="small" :color="section.enabled ? 'green' : 'gray'">
            {{ section.enabled ? '已启用' : '已隐藏' }}
          </a-tag>
        </div>

        <div class="module-card__grid">
          <a-form-item label="模块标题">
            <a-input v-model="section.title" />
          </a-form-item>
          <a-form-item label="显示数量">
            <a-input-number v-model="section.limit" :min="1" :max="24" :precision="0" style="width: 100%" />
          </a-form-item>
        </div>

        <div class="module-card__footer">
          <span>{{ section.enabled ? '显示中' : '已隐藏' }}</span>
          <a-switch v-model="section.enabled" :disabled="!canUpdateSettings" @change="$emit('toggle', section)" />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { HomeSectionSetting } from '@aurora/shared';

import { formatOrder, formatPosition, sectionLabelMap } from './home-layout';

defineProps<{
  sections: HomeSectionSetting[];
  enabledCount: number;
  canUpdateSettings: boolean;
}>();

defineEmits<{
  toggle: [section: HomeSectionSetting];
}>();

function getSectionLabel(key: HomeSectionSetting['key']) {
  return sectionLabelMap[key];
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
.module-card__head,
.module-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title-row {
  align-items: flex-start;
}

.section-title-row span,
.module-card__copy span,
.module-card__footer span {
  color: var(--admin-text-secondary);
}

.module-stack,
.module-card__copy {
  display: grid;
  gap: 18px;
}

.module-card {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 16px 16px 14px;
  border: 1px solid var(--admin-border);
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--admin-surface-strong) 96%, transparent),
    color-mix(in srgb, var(--admin-surface) 92%, transparent)
  );
  box-shadow: 0 14px 28px rgb(15 23 42 / 0.05);
}

.module-card--disabled {
  opacity: 0.68;
}

.module-card__order {
  position: absolute;
  top: 14px;
  left: 14px;
}

.module-card__copy,
.module-card__copy strong,
.module-card__copy span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-card__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

:deep(.settings-section .arco-form-item) {
  margin-bottom: 12px;
}

:deep(.settings-section .arco-form-item:last-child) {
  margin-bottom: 0;
}

[data-admin-theme='dark'] .module-card {
  background: linear-gradient(180deg, rgb(20 29 43 / 0.98), rgb(16 24 38 / 0.96));
  box-shadow: 0 18px 34px rgb(0 0 0 / 0.24);
}

@media (max-width: 900px) {
  .module-card__head,
  .module-card__footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
