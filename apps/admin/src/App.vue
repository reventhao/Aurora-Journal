<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();

async function syncProfile(force = false) {
  if (!authStore.token) {
    return;
  }

  try {
    await authStore.fetchProfile(force);
  } catch {
    authStore.logout();
  }
}

function handleWindowFocus() {
  void syncProfile(true);
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    void syncProfile(true);
  }
}

onMounted(() => {
  void syncProfile(true);
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('focus', handleWindowFocus);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>
