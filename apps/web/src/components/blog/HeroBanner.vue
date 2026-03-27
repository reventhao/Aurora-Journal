<template>
  <section class="hero hero-simple">
    <div class="container">
      <div class="hero-copy">
        <h1>{{ settings.heroTitle }}</h1>
        <p>{{ settings.heroDescription }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  settings: {
    heroTitle: string;
    heroDescription: string;
  };
}>();
</script>
