import type { AuthUser } from '@aurora/shared';

import { request } from './client';

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type EmailCodeResponse = {
  success: boolean;
  expiresInMinutes: number;
  message: string;
  debugCode?: string;
};

export function login(payload: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function requestEmailCode(payload: { email: string; purpose: 'register' | 'resetPassword' }) {
  return request<EmailCodeResponse>('/auth/email-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload: { name: string; email: string; password: string; code: string }) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser() {
  return request<AuthUser>('/auth/me', {
    auth: true,
  });
}
