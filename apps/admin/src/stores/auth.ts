import type { AuthUser, PermissionCode } from '@aurora/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { authApi } from '../api/modules';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('aurora_admin_token') || '');
  const user = ref<AuthUser | null>(null);
  const lastFetchedAt = ref(0);
  let pendingProfileRequest: Promise<AuthUser | null> | null = null;

  const permissions = computed<PermissionCode[]>(() => user.value?.permissions ?? []);

  async function login(email: string, password: string) {
    const result = await authApi.login({ email, password });
    applySession(result);
  }

  async function register(payload: { name: string; email: string; password: string; code: string }) {
    const result = await authApi.register(payload);
    applySession(result);
  }

  function applySession(result: { token: string; user: AuthUser }) {
    token.value = result.token;
    user.value = result.user;
    lastFetchedAt.value = Date.now();
    localStorage.setItem('aurora_admin_token', result.token);
  }

  async function fetchProfile(force = false) {
    if (!token.value) return null;
    const now = Date.now();

    if (!force && user.value && now - lastFetchedAt.value < 10_000) {
      return user.value;
    }

    if (pendingProfileRequest) {
      return pendingProfileRequest;
    }

    pendingProfileRequest = authApi
      .me()
      .then((profile) => {
        user.value = profile;
        lastFetchedAt.value = Date.now();
        return profile;
      })
      .finally(() => {
        pendingProfileRequest = null;
      });

    return pendingProfileRequest;
  }

  function hasPermission(permission?: PermissionCode | null) {
    if (!permission) {
      return true;
    }
    return permissions.value.includes(permission);
  }

  function logout() {
    token.value = '';
    user.value = null;
    lastFetchedAt.value = 0;
    pendingProfileRequest = null;
    localStorage.removeItem('aurora_admin_token');
  }

  return {
    token,
    user,
    permissions,
    login,
    register,
    fetchProfile,
    hasPermission,
    logout,
  };
});
