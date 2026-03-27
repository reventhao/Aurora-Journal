import type { NotificationCenterSummary, NotificationItem, PaginatedResponse } from '@aurora/shared';

import { request } from './client';

export function fetchNotificationSummary() {
  return request<NotificationCenterSummary>('/notifications/summary', {
    auth: true,
  });
}

export function fetchNotifications(params?: Record<string, unknown>) {
  return request<PaginatedResponse<NotificationItem>>('/notifications', {
    auth: true,
    params,
  });
}

export function markNotificationRead(id: string) {
  return request<NotificationItem>(`/notifications/${id}/read`, {
    method: 'PATCH',
    auth: true,
  });
}

export function markAllNotificationsRead() {
  return request<NotificationCenterSummary>('/notifications/read-all', {
    method: 'PATCH',
    auth: true,
  });
}
