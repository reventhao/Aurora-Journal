import type {
  CategorySummary,
  CommentSummary,
  PostDetail,
  PostSummary,
  SiteSettings,
  TagSummary,
} from '@aurora/shared';

import { request } from './client';

export type MobileHomePayload = {
  settings: SiteSettings;
  featuredPosts: PostSummary[];
  latestPosts: PostSummary[];
  categories: CategorySummary[];
  tags: TagSummary[];
};

export type PostsResponse = {
  items: PostSummary[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};

export function fetchHomeData() {
  return request<MobileHomePayload>('/public/home');
}

export function fetchPosts(params?: Record<string, unknown>) {
  return request<PostsResponse>('/public/posts', { params });
}

export function fetchPost(slug: string) {
  return request<PostDetail>(`/public/posts/${slug}`);
}

export function fetchPostComments(slug: string) {
  return request<CommentSummary[]>(`/public/posts/${slug}/comments`);
}

export function fetchCategories() {
  return request<CategorySummary[]>('/public/categories');
}

export function fetchTags() {
  return request<TagSummary[]>('/public/tags');
}

export function submitComment(postId: string, payload: Record<string, unknown>) {
  return request(`/comments/post/${postId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function likeComment(commentId: string) {
  return request(`/comments/${commentId}/like`, {
    method: 'PATCH',
  });
}
