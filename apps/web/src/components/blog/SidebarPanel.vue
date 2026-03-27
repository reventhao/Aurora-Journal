<template>
  <aside class="sidebar-panel">
    <section>
      <h3>{{ title }}</h3>
      <div class="sidebar-list">
        <slot />
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
