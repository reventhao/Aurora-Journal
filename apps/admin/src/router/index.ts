import type { PermissionCode } from '@aurora/shared';
import { PERMISSIONS } from '@aurora/shared';
import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '../stores/auth';

const AdminLayout = () => import('../layouts/AdminLayout.vue');
const LoginView = () => import('../views/auth/LoginView.vue');
const DashboardView = () => import('../views/dashboard/DashboardView.vue');
const PostsView = () => import('../views/posts/PostsView.vue');
const PostEditorView = () => import('../views/posts/PostEditorView.vue');
const CategoriesView = () => import('../views/categories/CategoriesView.vue');
const TagsView = () => import('../views/tags/TagsView.vue');
const CommentsView = () => import('../views/comments/CommentsView.vue');
const MediaView = () => import('../views/media/MediaView.vue');
const UsersView = () => import('../views/users/UsersView.vue');
const ProfileView = () => import('../views/users/ProfileView.vue');
const RolesView = () => import('../views/users/RolesView.vue');
const SettingsView = () => import('../views/settings/SettingsView.vue');
const BlogNavigationView = () => import('../views/settings/BlogNavigationView.vue');
const SettingVersionsView = () => import('../views/settings/SettingVersionsView.vue');
const OperationLogsView = () => import('../views/settings/OperationLogsView.vue');
const RecycleBinView = () => import('../views/system/RecycleBinView.vue');
const NoAccessView = () => import('../views/system/NoAccessView.vue');
const NotFoundView = () => import('../views/system/NotFoundView.vue');

type RouteMeta = {
  title: string;
  menuKey?: string;
  permission?: PermissionCode;
  loadingHint?: 'page' | 'editor';
};

const protectedRoutes = [
  { path: 'dashboard', component: DashboardView, meta: { title: '仪表盘', menuKey: '/dashboard', permission: PERMISSIONS.DASHBOARD_VIEW, loadingHint: 'page' } },
  { path: 'posts', component: PostsView, meta: { title: '文章管理', menuKey: '/posts', permission: PERMISSIONS.POSTS_VIEW, loadingHint: 'page' } },
  { path: 'posts/new', component: PostEditorView, meta: { title: '新建文章', menuKey: '/posts', permission: PERMISSIONS.POSTS_CREATE, loadingHint: 'editor' } },
  { path: 'posts/:id/edit', component: PostEditorView, meta: { title: '编辑文章', menuKey: '/posts', permission: PERMISSIONS.POSTS_UPDATE, loadingHint: 'editor' } },
  { path: 'categories', component: CategoriesView, meta: { title: '分类管理', menuKey: '/categories', permission: PERMISSIONS.CATEGORIES_VIEW, loadingHint: 'page' } },
  { path: 'tags', component: TagsView, meta: { title: '标签管理', menuKey: '/tags', permission: PERMISSIONS.TAGS_VIEW, loadingHint: 'page' } },
  { path: 'comments', component: CommentsView, meta: { title: '评论管理', menuKey: '/comments', permission: PERMISSIONS.COMMENTS_VIEW, loadingHint: 'page' } },
  { path: 'comment-threads', redirect: '/comments' },
  { path: 'media', component: MediaView, meta: { title: '媒体库', menuKey: '/media', permission: PERMISSIONS.MEDIA_VIEW, loadingHint: 'page' } },
  { path: 'recycle-bin', component: RecycleBinView, meta: { title: '内容回收站', menuKey: '/recycle-bin', permission: PERMISSIONS.RECYCLE_BIN_VIEW, loadingHint: 'page' } },
  { path: 'users', component: UsersView, meta: { title: '用户管理', menuKey: '/users', permission: PERMISSIONS.USERS_VIEW, loadingHint: 'page' } },
  { path: 'profile', component: ProfileView, meta: { title: '个人设置', loadingHint: 'page' } },
  { path: 'roles', component: RolesView, meta: { title: '角色权限', menuKey: '/roles', permission: PERMISSIONS.ROLES_VIEW, loadingHint: 'page' } },
  { path: 'settings', component: SettingsView, meta: { title: '站点设置', menuKey: '/settings', permission: PERMISSIONS.SETTINGS_VIEW, loadingHint: 'page' } },
  { path: 'settings/navigation', component: BlogNavigationView, meta: { title: '博客菜单', menuKey: '/settings/navigation', permission: PERMISSIONS.SETTINGS_VIEW, loadingHint: 'page' } },
  { path: 'settings/versions', component: SettingVersionsView, meta: { title: '配置版本', menuKey: '/settings/versions', permission: PERMISSIONS.SETTINGS_VERSIONS_VIEW, loadingHint: 'page' } },
  { path: 'operation-logs', component: OperationLogsView, meta: { title: '操作日志', menuKey: '/operation-logs', permission: PERMISSIONS.SETTINGS_VIEW, loadingHint: 'page' } },
  { path: '403', component: NoAccessView, meta: { title: '无权限', loadingHint: 'page' } },
  { path: ':pathMatch(.*)*', component: NotFoundView, meta: { title: '页面不存在', loadingHint: 'page' } },
] as const;

export function getFirstAvailablePath(authStore: ReturnType<typeof useAuthStore>) {
  const first = protectedRoutes.find((route) => 'meta' in route && authStore.hasPermission((route.meta as RouteMeta).permission));
  return first ? `/${first.path}` : '/403';
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { title: '登录', loadingHint: 'page' } },
    {
      path: '/',
      component: AdminLayout,
      children: [{ path: '', redirect: '/dashboard' }, ...protectedRoutes],
    },
  ],
});

router.beforeEach(async (to) => {
  const token = localStorage.getItem('aurora_admin_token');
  const authStore = useAuthStore();

  if (to.path !== '/login' && !token) {
    return '/login';
  }

  if (to.path === '/login' && token) {
    if (!authStore.user) {
      try {
        await authStore.fetchProfile();
      } catch {
        authStore.logout();
        return '/login';
      }
    }

    return getFirstAvailablePath(authStore);
  }

  if (token && to.path !== '/login') {
    try {
      await authStore.fetchProfile();
    } catch {
      authStore.logout();
      return '/login';
    }
  }

  const permission = (to.meta as RouteMeta).permission;
  if (permission && !authStore.hasPermission(permission)) {
    if (to.path === '/dashboard') {
      return getFirstAvailablePath(authStore);
    }

    return '/403';
  }

  return true;
});
