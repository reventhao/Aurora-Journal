import { http } from './http';

export async function fetchHomeData() {
  const { data } = await http.get('/public/home');
  return data;
}

export async function fetchPosts(params?: Record<string, unknown>) {
  const { data } = await http.get('/public/posts', { params });
  return data;
}

export async function fetchPost(slug: string) {
  const { data } = await http.get(`/public/posts/${slug}`);
  return data;
}

export async function fetchPostComments(slug: string) {
  const { data } = await http.get(`/public/posts/${slug}/comments`);
  return data;
}

export async function fetchSettings() {
  const { data } = await http.get('/public/settings');
  return data;
}

export async function fetchCategories() {
  const { data } = await http.get('/public/categories');
  return data;
}

export async function fetchTags() {
  const { data } = await http.get('/public/tags');
  return data;
}

export async function submitComment(postId: string, payload: Record<string, unknown>) {
  const { data } = await http.post(`/comments/post/${postId}`, payload);
  return data;
}

export async function likeComment(commentId: string) {
  const { data } = await http.patch(`/comments/${commentId}/like`);
  return data;
}
