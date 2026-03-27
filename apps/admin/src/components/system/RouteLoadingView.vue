<template>
  <div class="route-loading" :class="[`route-loading--${mode}`]">
    <a-card v-if="mode === 'editor'" :bordered="false" class="route-loading-card route-loading-card--editor">
      <div class="loading-header">
        <div class="loading-line loading-line--title" />
        <div class="loading-actions">
          <div class="loading-pill" />
          <div class="loading-pill loading-pill--primary" />
        </div>
      </div>

      <div class="loading-layout">
        <section class="loading-main">
          <div class="loading-line loading-line--label" />
          <div class="loading-input" />
          <div class="loading-line loading-line--label" />
          <div class="loading-editor" />
        </section>

        <aside class="loading-side">
          <div v-for="index in 3" :key="index" class="loading-panel">
            <div class="loading-line loading-line--section" />
            <div class="loading-input loading-input--small" />
            <div class="loading-input loading-input--small" />
          </div>
        </aside>
      </div>
    </a-card>

    <a-card v-else :bordered="false" class="route-loading-card">
      <div class="loading-header loading-header--compact">
        <div class="loading-line loading-line--title" />
        <div class="loading-pill" />
      </div>
      <div class="loading-toolbar">
        <div class="loading-input" />
        <div class="loading-pill" />
        <div class="loading-pill loading-pill--primary" />
      </div>
      <div class="loading-table">
        <div v-for="index in 5" :key="index" class="loading-row">
          <div class="loading-line" />
          <div class="loading-line loading-line--short" />
          <div class="loading-line loading-line--tiny" />
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    mode?: 'page' | 'editor';
  }>(),
  {
    mode: 'page',
  },
);
</script>

<style scoped>
.route-loading {
  display: grid;
}

.route-loading-card {
  overflow: hidden;
}

.route-loading-card--editor {
  min-height: calc(100vh - 160px);
}

.loading-header,
.loading-actions,
.loading-layout,
.loading-main,
.loading-side,
.loading-panel,
.loading-toolbar,
.loading-table,
.loading-row {
  display: grid;
}

.loading-header {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}

.loading-header--compact {
  margin-bottom: 18px;
}

.loading-actions {
  grid-auto-flow: column;
  gap: 10px;
}

.loading-layout {
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}

.loading-main,
.loading-side {
  gap: 16px;
}

.loading-panel {
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--admin-border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--admin-surface-strong) 82%, transparent);
}

.loading-toolbar {
  grid-template-columns: minmax(280px, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}

.loading-table {
  gap: 12px;
}

.loading-row {
  grid-template-columns: minmax(0, 1fr) 140px 96px;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid var(--admin-border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--admin-surface-strong) 78%, transparent);
}

.loading-line,
.loading-input,
.loading-editor,
.loading-pill {
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--admin-text-secondary) 14%, var(--admin-surface-strong));
}

.loading-input,
.loading-editor {
  border-radius: 18px;
}

.loading-line::after,
.loading-input::after,
.loading-editor::after,
.loading-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.3), transparent);
  animation: loading-shimmer 1.2s ease-in-out infinite;
}

.loading-line {
  height: 14px;
}

.loading-line--title {
  width: min(240px, 60%);
  height: 22px;
}

.loading-line--label {
  width: 96px;
}

.loading-line--section {
  width: 76px;
}

.loading-line--short {
  width: 88px;
}

.loading-line--tiny {
  width: 56px;
}

.loading-input {
  height: 42px;
}

.loading-input--small {
  height: 38px;
}

.loading-editor {
  min-height: 520px;
}

.loading-pill {
  width: 88px;
  height: 36px;
}

.loading-pill--primary {
  width: 108px;
}

@keyframes loading-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1024px) {
  .loading-layout {
    grid-template-columns: 1fr;
  }

  .loading-side {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .loading-header,
  .loading-toolbar {
    grid-template-columns: 1fr;
  }

  .loading-actions {
    justify-content: start;
  }

  .loading-side {
    grid-template-columns: 1fr;
  }

  .loading-row {
    grid-template-columns: 1fr;
  }
}
</style>
