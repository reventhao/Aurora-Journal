import type { CommentSummary } from '@aurora/shared';

export function trimText(value: string, maxLength: number) {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

export function formatReadingTime(minutes: number) {
  return `${minutes || 1} 分钟阅读`;
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function countComments(items: CommentSummary[]): number {
  return items.reduce((total, item) => total + 1 + countComments(item.replies ?? []), 0);
}
