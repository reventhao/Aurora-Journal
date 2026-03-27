<template>
  <div class="home-arrangement">
    <HomeLayoutPresetPicker
      :model-value="form.homeLayoutPreset"
      :can-update-settings="canUpdateSettings"
      @select="selectPreset"
    />

    <div class="arrangement-workbench">
      <HomeLayoutModulePanel
        :sections="sortedSections"
        :enabled-count="enabledSectionCount"
        :can-update-settings="canUpdateSettings"
        @toggle="handleSectionToggle"
      />

      <HomeLayoutCanvas
        :current-preset-label="currentPreset.label"
        :sections="enabledSections"
        :layout="layoutItems"
        :can-update-settings="canUpdateSettings"
        :hero-title="form.heroTitle"
        :hero-description="form.heroDescription"
        @layout-change="handleGridLayoutUpdate"
        @size-change="applySize"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getHomeLayoutPresetLayout,
  type HomeLayoutPreset,
  type HomeSectionSetting,
  type SiteSettings,
} from '@aurora/shared';
import { computed, nextTick, ref, watch } from 'vue';
import type { Layout } from 'grid-layout-plus';

import HomeLayoutCanvas from './HomeLayoutCanvas.vue';
import HomeLayoutModulePanel from './HomeLayoutModulePanel.vue';
import HomeLayoutPresetPicker from './HomeLayoutPresetPicker.vue';
import {
  layoutPresetOptions,
  normalizeGridLayout,
  normalizeSectionSize,
  normalizeSectionsForCanvas,
  resolveSectionPlacement,
  sortSectionsByLayout,
  toLayoutItem,
} from './home-layout';

const props = defineProps<{
  form: SiteSettings;
  canUpdateSettings: boolean;
}>();

const layoutItems = ref<Layout>([]);
const syncingSections = ref(false);

const currentPreset = computed(
  () => layoutPresetOptions.find((item) => item.value === props.form.homeLayoutPreset) ?? layoutPresetOptions[0],
);
const enabledSections = computed(() => sortSectionsByLayout(props.form.homeSections.filter((section) => section.enabled)));
const sortedSections = computed(() => sortSectionsByLayout(props.form.homeSections));
const enabledSectionCount = computed(() => enabledSections.value.length);

function buildSectionsSignature(sections: HomeSectionSetting[]) {
  return sections
    .map((section) => `${section.key}:${section.enabled}:${section.x}:${section.y}:${section.w}:${section.h}`)
    .join('|');
}

function buildLayoutSignature(
  layout: Array<{ i?: string | number; key?: string | number; x: number; y: number; w: number; h: number }>,
) {
  return layout
    .map((item) => `${item.i ?? item.key}:${item.x}:${item.y}:${item.w}:${item.h}`)
    .join('|');
}

function rebuildLayoutItems() {
  const nextLayoutItems = enabledSections.value.map((section) => toLayoutItem(section));
  if (buildLayoutSignature(layoutItems.value) === buildLayoutSignature(nextLayoutItems)) {
    return;
  }

  layoutItems.value = nextLayoutItems;
}

function reflowEnabledSections(preferredKey?: HomeSectionSetting['key']) {
  const orderedSections = preferredKey
    ? [
        ...enabledSections.value.filter((section) => section.key === preferredKey),
        ...enabledSections.value.filter((section) => section.key !== preferredKey),
      ]
    : enabledSections.value;
  const occupied = new Set<string>();

  for (const section of orderedSections) {
    const size = normalizeSectionSize(section.w, section.h);
    Object.assign(
      section,
      resolveSectionPlacement(
        {
          x: section.x,
          y: section.y,
          w: size.w,
          h: size.h,
        },
        occupied,
      ),
    );
  }

  rebuildLayoutItems();
}

function normalizeLoadedSections() {
  normalizeSectionsForCanvas(props.form.homeSections);
  rebuildLayoutItems();
}

watch(
  () => buildSectionsSignature(props.form.homeSections),
  (signature) => {
    if (syncingSections.value) {
      rebuildLayoutItems();
      return;
    }

    const clonedSections = props.form.homeSections.map((section) => ({ ...section }));
    normalizeSectionsForCanvas(clonedSections);
    const normalizedSignature = buildSectionsSignature(clonedSections);

    if (normalizedSignature !== signature) {
      syncingSections.value = true;
      props.form.homeSections.forEach((section, index) => Object.assign(section, clonedSections[index]));
      rebuildLayoutItems();
      void nextTick().then(() => {
        syncingSections.value = false;
      });
      return;
    }

    rebuildLayoutItems();
  },
  { immediate: true },
);

function selectPreset(preset: HomeLayoutPreset) {
  if (!props.canUpdateSettings) return;

  props.form.homeLayoutPreset = preset;
  props.form.homeSections.forEach((section) => Object.assign(section, getHomeLayoutPresetLayout(preset, section.key)));
  normalizeLoadedSections();
}

function applySize(section: HomeSectionSetting, w: HomeSectionSetting['w'], h: HomeSectionSetting['h']) {
  if (!props.canUpdateSettings) return;

  const size = normalizeSectionSize(w, h);
  section.w = size.w;
  section.h = size.h;
  reflowEnabledSections(section.enabled ? section.key : undefined);
}

function handleSectionToggle(section: HomeSectionSetting) {
  if (!props.canUpdateSettings) return;

  if (section.enabled) {
    reflowEnabledSections(section.key);
    return;
  }

  normalizeLoadedSections();
}

function handleGridLayoutUpdate(layout: Layout) {
  const normalizedLayout = normalizeGridLayout(layout);
  const nextLayoutSignature = buildLayoutSignature(
    normalizedLayout.map((item) => ({ key: item.key, x: item.x, y: item.y, w: item.w, h: item.h })),
  );
  const currentLayoutSignature = buildSectionsSignature(enabledSections.value);

  if (nextLayoutSignature === currentLayoutSignature) {
    return;
  }

  let changed = false;

  for (const item of normalizedLayout) {
    const section = props.form.homeSections.find((entry) => entry.key === item.key);
    if (!section) continue;
    if (section.x === item.x && section.y === item.y && section.w === item.w && section.h === item.h) {
      continue;
    }

    section.x = item.x;
    section.y = item.y;
    section.w = item.w;
    section.h = item.h;
    changed = true;
  }

  if (changed) {
    rebuildLayoutItems();
  }
}
</script>

<style scoped>
.home-arrangement,
.arrangement-workbench {
  display: grid;
  gap: 18px;
}

.arrangement-workbench {
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
}

@media (max-width: 1240px) {
  .arrangement-workbench {
    grid-template-columns: 1fr;
  }
}
</style>
