import axios from 'axios';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

function isPrivateIpv4(hostname: string) {
  return (
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

function isLikelyLocalAssetHost(hostname: string) {
  return LOCAL_HOSTS.has(hostname) || isPrivateIpv4(hostname);
}

function normalizeLocalAssetUrl(value: string) {
  if (typeof window === 'undefined') {
    return value;
  }

  if (!/^https?:\/\//i.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    if (!url.pathname.startsWith('/uploads/')) {
      return value;
    }

    if (!isLikelyLocalAssetHost(url.hostname) && url.hostname !== window.location.hostname) {
      return value;
    }

    return `${window.location.origin}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
}

function normalizeResponsePayload<T>(value: T): T {
  if (typeof value === 'string') {
    return normalizeLocalAssetUrl(value) as T;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      value[index] = normalizeResponsePayload(value[index]);
    }
    return value;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nested]) => {
      (value as Record<string, unknown>)[key] = normalizeResponsePayload(nested);
    });
  }

  return value;
}

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const devProxyBaseUrl = '/api';

  if (typeof window === 'undefined') {
    return configured || 'http://localhost:3000/api';
  }

  if (configured?.startsWith('/')) {
    return configured.replace(/\/+$/, '');
  }

  if (import.meta.env.DEV) {
    if (!configured) {
      return devProxyBaseUrl;
    }

    try {
      const url = new URL(configured);
      if (isLikelyLocalAssetHost(url.hostname)) {
        return devProxyBaseUrl;
      }
    } catch {
      return configured;
    }
  }

  if (!configured) {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }

  try {
    const url = new URL(configured);
    const isConfiguredLocal = isLikelyLocalAssetHost(url.hostname);
    const isCurrentLocal = isLikelyLocalAssetHost(window.location.hostname);

    if (isConfiguredLocal && !isCurrentLocal) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, '');
    }

    return configured;
  } catch {
    return configured;
  }
}

export const http = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

http.interceptors.response.use((response) => {
  response.data = normalizeResponsePayload(response.data);
  return response;
});
