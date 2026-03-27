import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const REQUEST_TIMEOUT_MS = 8_000;
const AUTH_TOKEN_STORAGE_KEY = 'aurora-mobile-auth-token';
let cachedAuthToken: string | null | undefined;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function isLoopbackHost(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

function readBundleHost() {
  const scriptUrl =
    NativeModules.SourceCode?.scriptURL ||
    NativeModules.SourceCode?.scriptUrl ||
    NativeModules.PlatformConstants?.scriptURL ||
    null;

  if (!scriptUrl || typeof scriptUrl !== 'string') {
    return null;
  }

  try {
    const url = new URL(scriptUrl);
    return url.hostname || null;
  } catch {
    return null;
  }
}

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured?.trim()) {
    return trimTrailingSlash(configured.trim());
  }

  const bundleHost = readBundleHost();
  if (bundleHost && !isLoopbackHost(bundleHost)) {
    return `http://${bundleHost}:3000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://127.0.0.1:3000/api';
}

export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}

export async function getStoredAuthToken() {
  if (cachedAuthToken !== undefined) {
    return cachedAuthToken;
  }

  try {
    cachedAuthToken = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    cachedAuthToken = null;
  }

  return cachedAuthToken;
}

export async function setStoredAuthToken(token: string | null) {
  cachedAuthToken = token;

  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return;
  }

  await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildQuery(params?: Record<string, unknown>) {
  if (!params) return '';

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    query.set(key, String(value));
  });

  const output = query.toString();
  return output ? `?${output}` : '';
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

function buildReadableError(reason: unknown) {
  if (reason instanceof Error) {
    if (reason.message === '__AURORA_REQUEST_TIMEOUT__' || reason.name === 'AbortError') {
      return new Error('请求超时，请确认手机可以访问电脑上的 3000 端口。');
    }

    if (reason.message === 'Network request failed') {
      return new Error(`无法连接到 ${resolveApiBaseUrl()}，请检查 API 地址或局域网连接。`);
    }

    return reason;
  }

  return new Error('请求失败');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('__AURORA_REQUEST_TIMEOUT__'));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

export async function request<T>(
  path: string,
  options: RequestInit & {
    auth?: boolean;
    params?: Record<string, unknown>;
  } = {},
) {
  const controller = new AbortController();

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (options.auth) {
      const token = await getStoredAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await withTimeout(
      fetch(`${resolveApiBaseUrl()}${path}${buildQuery(options.params)}`, {
        ...options,
        headers,
        signal: controller.signal,
      }),
      REQUEST_TIMEOUT_MS,
    );

    const payload = await parseResponse<unknown>(response);
    if (!response.ok) {
      const message =
        isRecord(payload) && typeof payload.message === 'string'
          ? payload.message
          : typeof payload === 'string'
            ? payload
            : '请求失败';

      throw new Error(message);
    }

    return payload as T;
  } catch (reason) {
    controller.abort();
    throw buildReadableError(reason);
  }
}
