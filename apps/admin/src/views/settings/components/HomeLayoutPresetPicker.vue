<template>
  <section class="settings-section preset-panel">
    <div class="section-title-row">
      <strong>布局模板</strong>
      <span>悬停选择</span>
    </div>

    <a-popover position="bottom" trigger="hover">
      <button type="button" class="preset-trigger">
        <span class="preset-trigger__preview" aria-hidden="true">
          <span
            v-for="sectionKey in HOME_SECTION_KEYS"
            :key="sectionKey"
            class="preset-trigger__tile"
            :style="getPresetTileStyle(currentPreset.value, sectionKey)"
          />
        </span>

        <span class="preset-trigger__copy">
          <span>当前模板</span>
          <strong>{{ currentPreset.label }}</strong>
        </span>

        <icon-down class="preset-trigger__arrow" />
      </button>

      <template #content>
        <div class="preset-flyout" role="listbox" aria-label="布局模板">
          <button
            v-for="preset in layoutPresetOptions"
            :key="preset.value"
            type="button"
            class="preset-card"
            :class="{ 'preset-card--active': modelValue === preset.value }"
            :disabled="!canUpdateSettings"
            @click="$emit('select', preset.value)"
          >
            <span class="preset-card__preview" aria-hidden="true">
              <span
                v-for="sectionKey in HOME_SECTION_KEYS"
                :key="sectionKey"
                class="preset-card__tile"
                :style="getPresetTileStyle(preset.value, sectionKey)"
              />
            </span>
            <strong>{{ preset.label }}</strong>
          </button>
        </div>
      </template>
    </a-popover>
  </section>
</template>

<script setup lang="ts">
import { HOME_SECTION_KEYS, getHomeLayoutPresetLayout, type HomeLayoutPreset, type HomeSectionSetting } from '@aurora/shared';
import { IconDown } from '@arco-design/web-vue/es/icon';
import { computed } from 'vue';

import { layoutPresetOptions } from './home-layout';

const props = defineProps<{
  modelValue: HomeLayoutPreset;
  canUpdateSettings: boolean;
}>();

defineEmits<{
  select: [preset: HomeLayoutPreset];
}>();

const currentPreset = computed(
  () => layoutPresetOptions.find((preset) => preset.value === props.modelValue) ?? layoutPresetOptions[0],
);

function getPresetTileStyle(preset: HomeLayoutPreset, key: HomeSectionSetting['key']) {
  const layout = getHomeLayoutPresetLayout(preset, key);
  return {
    gridColumn: `${layout.x + 1} / span ${layout.w}`,
    gridRow: `${layout.y + 1} / span ${layout.h}`,
  };
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

.preset-panel,
.section-title-row,
.preset-trigger__copy {
  display: grid;
  gap: 4px;
}

.preset-panel {
  justify-items: start;
}

.section-title-row span,
.preset-trigger__copy span {
  color: var(--admin-text-secondary);
}

.preset-trigger {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 248px;
  max-width: 300px;
  padding: 10px 14px 10px 10px;
  border: 1px solid rgba(145, 158, 171, 0.18);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 249, 253, 0.94));
  box-shadow: 0 14px 28px rgb(15 23 42 / 0.06);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.preset-trigger:hover {
  transform: translateY(-1px);
  border-color: rgba(22, 93, 255, 0.26);
  box-shadow: 0 18px 34px rgb(15 23 42 / 0.1);
}

.preset-trigger:focus-visible,
.preset-card:focus-visible {
  outline: none;
  border-color: rgba(22, 93, 255, 0.34);
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.14);
}

.preset-trigger__preview,
.preset-card__preview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 3px;
  flex: none;
  overflow: hidden;
  box-sizing: border-box;
}

.preset-trigger__preview {
  width: 42px;
  height: 34px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(22, 93, 255, 0.08);
}

.preset-card__preview {
  width: 100%;
  aspect-ratio: 5 / 4;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(145, 158, 171, 0.16);
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(243, 247, 252, 0.96));
}

.preset-trigger__tile,
.preset-card__tile {
  min-width: 0;
  min-height: 0;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(22, 93, 255, 0.16), rgba(82, 196, 255, 0.08));
  border: 1px solid rgba(22, 93, 255, 0.12);
  box-sizing: border-box;
}

.preset-trigger__copy {
  min-width: 0;
  text-align: left;
}

.preset-trigger__copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-trigger__arrow {
  margin-left: auto;
  color: var(--admin-text-secondary);
  transition: transform 160ms ease;
}

.preset-trigger:hover .preset-trigger__arrow {
  transform: translateY(1px);
}

.preset-flyout {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: min(436px, calc(100vw - 48px));
}

.preset-card {
  display: grid;
  gap: 8px;
  align-content: start;
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(145, 158, 171, 0.18);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 253, 0.94));
  color: inherit;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.preset-card strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 13px;
}

.preset-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(22, 93, 255, 0.26);
  box-shadow: 0 14px 28px rgb(15 23 42 / 0.1);
}

.preset-card--active {
  border-color: rgba(22, 93, 255, 0.34);
  background: linear-gradient(180deg, rgba(236, 244, 255, 0.98), rgba(246, 249, 253, 0.94));
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.12);
}

.preset-card:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

[data-admin-theme='dark'] .preset-trigger,
[data-admin-theme='dark'] .preset-card {
  background: linear-gradient(180deg, rgb(20 29 43 / 0.98), rgb(16 24 38 / 0.96));
  box-shadow: 0 18px 34px rgb(0 0 0 / 0.24);
}

[data-admin-theme='dark'] .preset-trigger:hover,
[data-admin-theme='dark'] .preset-card:hover:not(:disabled) {
  border-color: rgba(82, 196, 255, 0.26);
}

[data-admin-theme='dark'] .preset-trigger:focus-visible,
[data-admin-theme='dark'] .preset-card:focus-visible {
  border-color: rgba(82, 196, 255, 0.34);
  box-shadow: 0 0 0 3px rgba(82, 196, 255, 0.16);
}

[data-admin-theme='dark'] .preset-card--active {
  background: linear-gradient(180deg, rgba(22, 93, 255, 0.24), rgba(16, 24, 38, 0.96));
}

[data-admin-theme='dark'] .preset-trigger__preview {
  background: rgba(82, 196, 255, 0.12);
}

[data-admin-theme='dark'] .preset-card__preview {
  background: linear-gradient(180deg, rgba(15, 23, 36, 0.96), rgba(17, 26, 40, 0.94));
}
</style>
