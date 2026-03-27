import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const LOCAL_UPLOAD_ORIGIN_PATTERN = /https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|\[::1\]|::1)(?::\d+)?(?=\/uploads\/)/gi;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function getAppBaseUrl(configService: ConfigService) {
  return trimTrailingSlash(configService.get<string>('APP_URL', 'http://localhost:3000'));
}

export function parseCorsOrigins(...values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value || '').split(','))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function normalizeLocalAppUrl(value: string | null | undefined, appBaseUrl: string) {
  if (!value) {
    return value ?? '';
  }

  if (!isAbsoluteHttpUrl(value)) {
    if (value.startsWith('/uploads/')) {
      return `${trimTrailingSlash(appBaseUrl)}${value}`;
    }
    return value;
  }

  try {
    const url = new URL(value);
    if (!LOCAL_HOSTS.has(url.hostname)) {
      return value;
    }

    return `${trimTrailingSlash(appBaseUrl)}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
}

export function normalizeLocalAppUrlsInText(value: string | null | undefined, appBaseUrl: string) {
  if (!value) {
    return value ?? '';
  }

  return value.replace(LOCAL_UPLOAD_ORIGIN_PATTERN, trimTrailingSlash(appBaseUrl));
}

export function resolveRequestBaseUrl(request: Request, fallbackBaseUrl: string) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocolHeader = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const protocol = protocolHeader?.split(',')[0]?.trim() || request.protocol;
  const host = request.get('host');

  if (!host) {
    return trimTrailingSlash(fallbackBaseUrl);
  }

  return `${protocol}://${host}`;
}
