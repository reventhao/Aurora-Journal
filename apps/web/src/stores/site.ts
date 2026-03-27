import type { SiteSettings } from '@aurora/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { fetchSettings } from '../api/public';

export const useSiteStore = defineStore('site', () => {
  const settings = ref<SiteSettings | null>(null);
  const loading = ref(false);

  async function loadSettings() {
    loading.value = true;
    try {
      settings.value = await fetchSettings();
    } finally {
      loading.value = false;
    }
  }

  return {
    settings,
    loading,
    loadSettings,
  };
});
