export type PublishStatus = "DRAFT" | "PUBLISHED";
export type UserStatus = "ACTIVE" | "BANNED";
export type MediaSource = "LOCAL" | "PEXELS";
export type NotificationLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type HomeLayoutPreset =
  | "stack"
  | "bands"
  | "headline"
  | "focus"
  | "focusRight"
  | "rail"
  | "railRight"
  | "quad";
export type HomeSectionKey =
  | "featuredPosts"
  | "latestPosts"
  | "categories"
  | "tags";
export type HomeSectionSpan = 1 | 2;

export const HOME_LAYOUT_PRESETS = [
  "stack",
  "bands",
  "headline",
  "focus",
  "focusRight",
  "rail",
  "railRight",
  "quad",
] as const;
export const HOME_SECTION_KEYS = [
  "featuredPosts",
  "latestPosts",
  "categories",
  "tags",
] as const;
export const HOME_LAYOUT_COLUMNS = 2;
export const HOME_LAYOUT_MAX_ROWS = 8;
export const HOME_SECTION_MAX_SPAN = 2 as const;

export interface HomeSectionLayout {
  x: number;
  y: number;
  w: HomeSectionSpan;
  h: HomeSectionSpan;
}

export const HOME_LAYOUT_PRESET_LAYOUTS: Record<
  HomeLayoutPreset,
  Record<HomeSectionKey, HomeSectionLayout>
> = {
  stack: {
    featuredPosts: { x: 0, y: 0, w: 2, h: 1 },
    latestPosts: { x: 0, y: 1, w: 2, h: 1 },
    categories: { x: 0, y: 2, w: 2, h: 1 },
    tags: { x: 0, y: 3, w: 2, h: 1 },
  },
  bands: {
    featuredPosts: { x: 0, y: 0, w: 2, h: 1 },
    latestPosts: { x: 0, y: 1, w: 1, h: 1 },
    categories: { x: 1, y: 1, w: 1, h: 1 },
    tags: { x: 0, y: 2, w: 2, h: 1 },
  },
  headline: {
    featuredPosts: { x: 0, y: 0, w: 2, h: 1 },
    latestPosts: { x: 0, y: 1, w: 1, h: 1 },
    categories: { x: 1, y: 1, w: 1, h: 1 },
    tags: { x: 0, y: 2, w: 2, h: 1 },
  },
  focus: {
    featuredPosts: { x: 0, y: 0, w: 1, h: 2 },
    latestPosts: { x: 1, y: 0, w: 1, h: 1 },
    categories: { x: 1, y: 1, w: 1, h: 1 },
    tags: { x: 0, y: 2, w: 2, h: 1 },
  },
  focusRight: {
    featuredPosts: { x: 1, y: 0, w: 1, h: 2 },
    latestPosts: { x: 0, y: 0, w: 1, h: 1 },
    categories: { x: 0, y: 1, w: 1, h: 1 },
    tags: { x: 0, y: 2, w: 2, h: 1 },
  },
  rail: {
    featuredPosts: { x: 0, y: 1, w: 1, h: 2 },
    latestPosts: { x: 0, y: 0, w: 2, h: 1 },
    categories: { x: 1, y: 1, w: 1, h: 1 },
    tags: { x: 1, y: 2, w: 1, h: 1 },
  },
  railRight: {
    featuredPosts: { x: 1, y: 1, w: 1, h: 2 },
    latestPosts: { x: 0, y: 0, w: 2, h: 1 },
    categories: { x: 0, y: 1, w: 1, h: 1 },
    tags: { x: 0, y: 2, w: 1, h: 1 },
  },
  quad: {
    featuredPosts: { x: 0, y: 0, w: 1, h: 1 },
    latestPosts: { x: 1, y: 0, w: 1, h: 1 },
    categories: { x: 0, y: 1, w: 1, h: 1 },
    tags: { x: 1, y: 1, w: 1, h: 1 },
  },
};

export function getHomeLayoutPresetLayout(
  preset: HomeLayoutPreset,
  key: HomeSectionKey,
): HomeSectionLayout {
  const layout =
    HOME_LAYOUT_PRESET_LAYOUTS[preset]?.[key] ??
    HOME_LAYOUT_PRESET_LAYOUTS.focus[key];
  return { ...layout };
}

export function buildDefaultUserAvatar(name: string, email: string) {
  const seed = `${name || "Aurora"}-${email || "user@aurora.local"}`;
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&fontWeight=700`;
}

export const PERMISSION_GROUPS = [
  "dashboard",
  "posts",
  "categories",
  "tags",
  "comments",
  "media",
  "notifications",
  "recycleBin",
  "analytics",
  "users",
  "roles",
  "settings",
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  POSTS_VIEW: "posts.view",
  POSTS_CREATE: "posts.create",
  POSTS_UPDATE: "posts.update",
  POSTS_DELETE: "posts.delete",
  POSTS_PUBLISH: "posts.publish",
  POSTS_FEATURE: "posts.feature",
  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_MANAGE: "categories.manage",
  TAGS_VIEW: "tags.view",
  TAGS_MANAGE: "tags.manage",
  COMMENTS_VIEW: "comments.view",
  COMMENTS_MODERATE: "comments.moderate",
  COMMENTS_DELETE: "comments.delete",
  COMMENTS_THREADS_VIEW: "comments.threads.view",
  MEDIA_VIEW: "media.view",
  MEDIA_UPLOAD: "media.upload",
  MEDIA_DELETE: "media.delete",
  MEDIA_IMPORT: "media.import",
  MEDIA_ANALYTICS_VIEW: "media.analytics.view",
  NOTIFICATIONS_VIEW: "notifications.view",
  RECYCLE_BIN_VIEW: "recycleBin.view",
  RECYCLE_BIN_RESTORE: "recycleBin.restore",
  RECYCLE_BIN_PURGE: "recycleBin.purge",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  ROLES_VIEW: "roles.view",
  ROLES_MANAGE: "roles.manage",
  SETTINGS_VIEW: "settings.view",
  SETTINGS_UPDATE: "settings.update",
  SETTINGS_VERSIONS_VIEW: "settings.versions.view",
  SETTINGS_VERSIONS_RESTORE: "settings.versions.restore",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  description: string;
  group: PermissionGroup;
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
}

export interface AuthorProfile {
  name: string;
  avatar: string;
  bio: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  visible?: boolean;
  postCount?: number;
}

export interface TagSummary {
  id: string;
  name: string;
  slug: string;
  color: string;
  visible?: boolean;
  postCount?: number;
}

export interface MediaItem {
  id: string;
  fileName: string;
  url: string;
  thumbUrl?: string;
  mimeType: string;
  size: number;
  source?: MediaSource;
  folderId?: string | null;
  groupName?: string;
  tags?: string[];
  altText?: string;
  referenceCount?: number;
  referencedPostTitles?: string[];
  createdAt: string;
}

export interface MediaFolderSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  mediaCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalMediaItem {
  id: string;
  sourceId: string;
  fileName: string;
  title: string;
  thumbUrl: string;
  previewUrl: string;
  url: string;
  photographer: string;
  sourcePage: string;
  width: number;
  height: number;
}

export interface MediaUsageAnalytics {
  totals: {
    total: number;
    local: number;
    pexels: number;
    referenced: number;
    unreferenced: number;
    totalSize: number;
  };
  topReferenced: MediaItem[];
  unused: MediaItem[];
  recent: MediaItem[];
}

export interface RoleSummary {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: PermissionDefinition[];
  userCount?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  jobTitle: string;
  phone: string;
  location: string;
  website: string;
  bio: string;
  status: UserStatus;
  roles: RoleSummary[];
  permissions: PermissionCode[];
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  jobTitle: string;
  phone: string;
  location: string;
  website: string;
  bio: string;
  status: UserStatus;
  passwordUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: RoleSummary[];
  permissions: PermissionCode[];
}

export interface CommentSummary {
  id: string;
  author: string;
  email: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  approved: boolean;
  likes?: number;
  parentId?: string | null;
  replies?: CommentSummary[];
  postId: string;
  postTitle?: string;
  replyToAuthor?: string;
}

export interface CommentModerationRules {
  minLength: number;
  blockedWords: string[];
  autoApproveDomains: string[];
}

export interface CommentConversation {
  id: string;
  postId: string;
  postTitle: string;
  rootComment: CommentSummary;
  replies: CommentSummary[];
  totalReplies: number;
  pendingReplies: number;
  lastActivityAt: string;
}

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  coverThumbUrl?: string;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  readingTime: number;
  featured: boolean;
  views: number;
  scheduledPublishAt?: string | null;
  scheduledUnpublishAt?: string | null;
  category?: CategorySummary | null;
  tags: TagSummary[];
}

export interface PostDetail extends PostSummary {
  content: string;
  seoTitle: string;
  seoDescription: string;
  categoryId?: string | null;
}

export interface PostRevisionSummary {
  id: string;
  postId: string;
  version: number;
  reason: string;
  createdAt: string;
  createdByName?: string | null;
}

export interface SiteSettings {
  siteName: string;
  siteSubtitle: string;
  siteDescription: string;
  logo: string;
  announcementEnabled: boolean;
  announcementTitle: string;
  announcementContent: string;
  announcementLink: string;
  announcementLinkLabel: string;
  heroTitle: string;
  heroDescription: string;
  footerText: string;
  githubUrl: string;
  icp: string;
  aboutTitle: string;
  aboutContent: string;
  homeLayoutPreset: HomeLayoutPreset;
  navigationMenu: NavigationMenuItem[];
  homeSections: HomeSectionSetting[];
}

export const NAVIGATION_MENU_KEYS = [
  'home',
  'posts',
  'readingList',
  'categories',
  'tags',
  'about',
  'admin',
] as const;

export type BuiltinNavigationMenuKey = (typeof NAVIGATION_MENU_KEYS)[number];
export type NavigationMenuKey = string;

export interface NavigationMenuItem {
  key: NavigationMenuKey;
  builtinKey?: BuiltinNavigationMenuKey | null;
  label: string;
  path: string;
  visible: boolean;
  order: number;
  external: boolean;
}

export const NAVIGATION_MENU_DEFAULTS: Record<
  BuiltinNavigationMenuKey,
  Pick<NavigationMenuItem, 'label' | 'path' | 'external'>
> = {
  home: {
    label: '首页',
    path: '/',
    external: false,
  },
  posts: {
    label: '文章',
    path: '/posts',
    external: false,
  },
  readingList: {
    label: '阅读清单',
    path: '/reading-list',
    external: false,
  },
  categories: {
    label: '分类',
    path: '/categories',
    external: false,
  },
  tags: {
    label: '标签',
    path: '/tags',
    external: false,
  },
  about: {
    label: '关于',
    path: '/about',
    external: false,
  },
  admin: {
    label: '后台',
    path: '/admin',
    external: true,
  },
};

export function isBuiltinNavigationMenuKey(value: string): value is BuiltinNavigationMenuKey {
  return NAVIGATION_MENU_KEYS.includes(value as BuiltinNavigationMenuKey);
}

export function buildDefaultNavigationMenu(): NavigationMenuItem[] {
  return NAVIGATION_MENU_KEYS.map((builtinKey, order) => ({
    key: builtinKey,
    builtinKey,
    label: NAVIGATION_MENU_DEFAULTS[builtinKey].label,
    path: NAVIGATION_MENU_DEFAULTS[builtinKey].path,
    visible: true,
    order,
    external: NAVIGATION_MENU_DEFAULTS[builtinKey].external,
  }));
}

export interface HomeSectionSetting extends HomeSectionLayout {
  key: HomeSectionKey;
  title: string;
  enabled: boolean;
  limit: number;
}

export interface OperationLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  targetLabel: string;
  actorId?: string | null;
  actorName: string;
  detail?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  level: NotificationLevel;
  category: string;
  isRead: boolean;
  readAt: string | null;
  link?: string | null;
  actorName: string;
  entityType?: string | null;
  entityId?: string | null;
  detail?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationCenterSummary {
  unreadCount: number;
  latest: NotificationItem[];
}

export interface RecycleBinItem {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  summary: string;
  deletedByName: string;
  deletedAt: string;
  preview?: {
    excerpt?: string;
    content?: string;
    description?: string;
    coverImage?: string;
    thumbUrl?: string;
    url?: string;
    mimeType?: string;
    color?: string;
    visible?: boolean;
    postCount?: number;
    category?: {
      name: string;
      slug: string;
    } | null;
    tags?: Array<{
      name: string;
      slug: string;
      color: string;
    }>;
    folderName?: string | null;
    author?: string;
    postTitle?: string;
  } | null;
}

export interface SettingVersionEntry {
  id: string;
  settingKey: string;
  summary: string;
  createdByName: string;
  createdAt: string;
  valuePreview?: Record<string, unknown> | null;
}

export interface DashboardMetrics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalComments: number;
  pendingComments: number;
  totalViews: number;
  recentPosts: PostSummary[];
  recentComments: CommentSummary[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export type AssistantApp = "web" | "admin";
export type AssistantMessageRole = "user" | "assistant";
export type AssistantMood =
  | "idle"
  | "thinking"
  | "spark"
  | "warning"
  | "celebrate";
export type AssistantAnimation =
  | "idle"
  | "ponder"
  | "wave"
  | "nod"
  | "cheer"
  | "alert"
  | "sleep";
export type AssistantVoiceStyle = "playful" | "warm" | "pro";
export type AssistantValue = string | number | boolean | null;

export interface AssistantChatMessage {
  role: AssistantMessageRole;
  content: string;
}

export interface AssistantContext {
  app: AssistantApp;
  route: string;
  pageTitle: string;
  pageSummary?: string;
  content?: string;
  tags?: string[];
  metadata?: Record<string, AssistantValue>;
}

export interface AssistantQuickAction {
  id: string;
  label: string;
  prompt: string;
}

export interface AssistantSpeechDirective {
  text: string;
  auto: boolean;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface AssistantPresenceDirective {
  animation: AssistantAnimation;
  bubbleText: string;
  idleLines: string[];
  aura: "calm" | "focus" | "warm" | "warning";
  followCursor: boolean;
}

export interface AssistantChatRequest {
  message: string;
  context: AssistantContext;
  history?: AssistantChatMessage[];
}

export interface AssistantSpeechRequest {
  text: string;
  style: AssistantVoiceStyle;
  mood?: AssistantMood;
}

export interface AssistantChatResponse {
  reply: string;
  mood: AssistantMood;
  suggestions: string[];
  actions: AssistantQuickAction[];
  provider: "fallback" | "openai-compatible";
  model?: string;
  presence: AssistantPresenceDirective;
  speech?: AssistantSpeechDirective;
}
