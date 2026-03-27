import type { PermissionCode, PermissionDefinition } from '@aurora/shared';
import { PERMISSIONS } from '@aurora/shared';

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    code: PERMISSIONS.DASHBOARD_VIEW,
    name: '查看仪表盘',
    description: '查看后台概览、关键指标与最近动态。',
    group: 'dashboard',
  },
  {
    code: PERMISSIONS.POSTS_VIEW,
    name: '查看文章',
    description: '查看文章列表与编辑器数据。',
    group: 'posts',
  },
  {
    code: PERMISSIONS.POSTS_CREATE,
    name: '创建文章',
    description: '新建文章草稿。',
    group: 'posts',
  },
  {
    code: PERMISSIONS.POSTS_UPDATE,
    name: '编辑文章',
    description: '修改现有文章内容。',
    group: 'posts',
  },
  {
    code: PERMISSIONS.POSTS_DELETE,
    name: '删除文章',
    description: '将文章移入回收站。',
    group: 'posts',
  },
  {
    code: PERMISSIONS.POSTS_PUBLISH,
    name: '发布文章',
    description: '切换文章发布状态。',
    group: 'posts',
  },
  {
    code: PERMISSIONS.POSTS_FEATURE,
    name: '推荐文章',
    description: '设置文章为精选内容。',
    group: 'posts',
  },
  {
    code: PERMISSIONS.CATEGORIES_VIEW,
    name: '查看分类',
    description: '查看分类列表。',
    group: 'categories',
  },
  {
    code: PERMISSIONS.CATEGORIES_MANAGE,
    name: '管理分类',
    description: '创建、编辑、删除分类。',
    group: 'categories',
  },
  {
    code: PERMISSIONS.TAGS_VIEW,
    name: '查看标签',
    description: '查看标签列表。',
    group: 'tags',
  },
  {
    code: PERMISSIONS.TAGS_MANAGE,
    name: '管理标签',
    description: '创建、编辑、删除标签。',
    group: 'tags',
  },
  {
    code: PERMISSIONS.COMMENTS_VIEW,
    name: '查看评论',
    description: '查看评论列表与详情。',
    group: 'comments',
  },
  {
    code: PERMISSIONS.COMMENTS_MODERATE,
    name: '审核评论',
    description: '审核、编辑评论状态。',
    group: 'comments',
  },
  {
    code: PERMISSIONS.COMMENTS_DELETE,
    name: '删除评论',
    description: '将评论移入回收站。',
    group: 'comments',
  },
  {
    code: PERMISSIONS.COMMENTS_THREADS_VIEW,
    name: '查看评论会话',
    description: '按会话视角查看评论往来与回复链路。',
    group: 'comments',
  },
  {
    code: PERMISSIONS.MEDIA_VIEW,
    name: '查看媒体',
    description: '查看媒体库与 Pexels 图库结果。',
    group: 'media',
  },
  {
    code: PERMISSIONS.MEDIA_UPLOAD,
    name: '上传媒体',
    description: '上传本地媒体到媒体库。',
    group: 'media',
  },
  {
    code: PERMISSIONS.MEDIA_DELETE,
    name: '删除媒体',
    description: '将媒体移入回收站。',
    group: 'media',
  },
  {
    code: PERMISSIONS.MEDIA_IMPORT,
    name: '导入媒体',
    description: '从 Pexels 导入图片到媒体库。',
    group: 'media',
  },
  {
    code: PERMISSIONS.MEDIA_ANALYTICS_VIEW,
    name: '查看媒体分析',
    description: '查看媒体引用率、来源占比与闲置资源。',
    group: 'analytics',
  },
  {
    code: PERMISSIONS.NOTIFICATIONS_VIEW,
    name: '查看通知中心',
    description: '查看站内通知、待处理提醒与系统消息。',
    group: 'notifications',
  },
  {
    code: PERMISSIONS.RECYCLE_BIN_VIEW,
    name: '查看回收站',
    description: '查看已删除的内容与媒体。',
    group: 'recycleBin',
  },
  {
    code: PERMISSIONS.RECYCLE_BIN_RESTORE,
    name: '恢复回收站',
    description: '从回收站恢复内容。',
    group: 'recycleBin',
  },
  {
    code: PERMISSIONS.RECYCLE_BIN_PURGE,
    name: '彻底删除回收站',
    description: '从回收站永久清除内容。',
    group: 'recycleBin',
  },
  {
    code: PERMISSIONS.USERS_VIEW,
    name: '查看用户',
    description: '查看后台用户列表。',
    group: 'users',
  },
  {
    code: PERMISSIONS.USERS_MANAGE,
    name: '管理用户',
    description: '创建、编辑、封禁、删除用户。',
    group: 'users',
  },
  {
    code: PERMISSIONS.ROLES_VIEW,
    name: '查看角色',
    description: '查看角色与权限列表。',
    group: 'roles',
  },
  {
    code: PERMISSIONS.ROLES_MANAGE,
    name: '管理角色',
    description: '创建、编辑、删除角色并分配权限。',
    group: 'roles',
  },
  {
    code: PERMISSIONS.SETTINGS_VIEW,
    name: '查看设置',
    description: '查看站点设置。',
    group: 'settings',
  },
  {
    code: PERMISSIONS.SETTINGS_UPDATE,
    name: '修改设置',
    description: '修改站点设置。',
    group: 'settings',
  },
  {
    code: PERMISSIONS.SETTINGS_VERSIONS_VIEW,
    name: '查看配置版本',
    description: '查看配置版本历史与变更摘要。',
    group: 'settings',
  },
  {
    code: PERMISSIONS.SETTINGS_VERSIONS_RESTORE,
    name: '恢复配置版本',
    description: '将配置回滚到历史版本。',
    group: 'settings',
  },
];

export const ALL_PERMISSION_CODES = PERMISSION_DEFINITIONS.map((item) => item.code);

export const SYSTEM_ROLE_TEMPLATES: Array<{
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionCode[];
}> = [
  {
    code: 'super-admin',
    name: '超级管理员',
    description: '拥有后台全部权限。',
    isSystem: true,
    permissions: [...ALL_PERMISSION_CODES],
  },
  {
    code: 'editor',
    name: '编辑',
    description: '负责内容生产、媒体处理、评论审核与通知查看。',
    isSystem: true,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.POSTS_VIEW,
      PERMISSIONS.POSTS_CREATE,
      PERMISSIONS.POSTS_UPDATE,
      PERMISSIONS.POSTS_DELETE,
      PERMISSIONS.POSTS_PUBLISH,
      PERMISSIONS.POSTS_FEATURE,
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.CATEGORIES_MANAGE,
      PERMISSIONS.TAGS_VIEW,
      PERMISSIONS.TAGS_MANAGE,
      PERMISSIONS.COMMENTS_VIEW,
      PERMISSIONS.COMMENTS_MODERATE,
      PERMISSIONS.COMMENTS_THREADS_VIEW,
      PERMISSIONS.MEDIA_VIEW,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_IMPORT,
      PERMISSIONS.MEDIA_ANALYTICS_VIEW,
      PERMISSIONS.NOTIFICATIONS_VIEW,
      PERMISSIONS.RECYCLE_BIN_VIEW,
      PERMISSIONS.RECYCLE_BIN_RESTORE,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_VERSIONS_VIEW,
    ],
  },
  {
    code: 'moderator',
    name: '评论审核员',
    description: '负责评论审核、会话查看与通知处理。',
    isSystem: true,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.COMMENTS_VIEW,
      PERMISSIONS.COMMENTS_MODERATE,
      PERMISSIONS.COMMENTS_DELETE,
      PERMISSIONS.COMMENTS_THREADS_VIEW,
      PERMISSIONS.NOTIFICATIONS_VIEW,
      PERMISSIONS.RECYCLE_BIN_VIEW,
      PERMISSIONS.RECYCLE_BIN_RESTORE,
    ],
  },
];
