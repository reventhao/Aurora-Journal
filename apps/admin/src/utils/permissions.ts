import type { PermissionCode } from '@aurora/shared';

import { useAuthStore } from '../stores/auth';

export function hasPermission(permission?: PermissionCode | null) {
  if (!permission) {
    return true;
  }

  const authStore = useAuthStore();
  return authStore.user?.permissions.includes(permission) ?? false;
}

export function hasAnyPermission(permissions: PermissionCode[] = []) {
  if (permissions.length === 0) {
    return true;
  }

  const authStore = useAuthStore();
  const granted = new Set(authStore.user?.permissions ?? []);
  return permissions.some((permission) => granted.has(permission));
}
