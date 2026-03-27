import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

type ThemeMode = 'light' | 'dark';

function applyTheme(mode: ThemeMode) {
  document.body.setAttribute('arco-theme', mode === 'dark' ? 'dark' : 'light');
  document.documentElement.setAttribute('data-admin-theme', mode);
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>((localStorage.getItem('aurora_admin_theme') as ThemeMode) || 'light');

  function setTheme(nextMode: ThemeMode) {
    mode.value = nextMode;
    localStorage.setItem('aurora_admin_theme', nextMode);
    applyTheme(nextMode);
  }

  function toggleTheme() {
    setTheme(mode.value === 'light' ? 'dark' : 'light');
  }

  function initTheme() {
    applyTheme(mode.value);
  }

  const isDark = computed(() => mode.value === 'dark');

  return {
    mode,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  };
});
