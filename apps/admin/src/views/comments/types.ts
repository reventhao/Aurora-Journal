import type { CommentConversation, CommentModerationRules, CommentSummary } from '@aurora/shared';

export type CommentStatusFilter = 'all' | 'pending' | 'approved';

export interface CommentRecord {
  id: string;
  author: string;
  email: string;
  content: string;
  approved: boolean;
  parentId?: string | null;
  createdAt: string;
  post?: { id: string; title: string };
  parent?: { id: string; author: string; content: string; approved: boolean } | null;
  children?: CommentRecord[];
  hasPendingInTree?: boolean;
}

export interface CommentThreadItem extends CommentSummary {
  depth: number;
  replyToAuthor: string;
  parentPreview: string;
  replies: CommentThreadItem[];
  toneColor: string;
  toneSoftColor: string;
  toneStrongColor: string;
  isRootAuthor: boolean;
}

export type { CommentConversation, CommentModerationRules };
