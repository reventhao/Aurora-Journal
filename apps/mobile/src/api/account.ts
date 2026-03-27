import type { UserSummary } from '@aurora/shared';

import { request } from './client';

export function fetchProfile() {
  return request<UserSummary>('/users/profile', {
    auth: true,
  });
}

export function updateProfile(payload: {
  name?: string;
  avatar?: string;
  jobTitle?: string;
  phone?: string;
  location?: string;
  website?: string;
  bio?: string;
}) {
  return request<UserSummary>('/users/profile', {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(payload),
  });
}
