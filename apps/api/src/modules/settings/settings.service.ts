import {
  HOME_LAYOUT_COLUMNS,
  HOME_LAYOUT_MAX_ROWS,
  HOME_LAYOUT_PRESETS,
  HOME_SECTION_KEYS,
  HOME_SECTION_MAX_SPAN,
  NAVIGATION_MENU_KEYS,
  buildDefaultNavigationMenu,
  getHomeLayoutPresetLayout,
  isBuiltinNavigationMenuKey,
  type AuthUser,
  type BuiltinNavigationMenuKey,
  type CommentModerationRules,
  type HomeLayoutPreset,
  type HomeSectionSetting,
  type NavigationMenuItem,
  type PaginatedResponse,
  type SettingVersionEntry,
  type SiteSettings,
} from '@aurora/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { buildPaginationMeta } from '../../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const defaultNavigationMenu: NavigationMenuItem[] = buildDefaultNavigationMenu();

const defaultSettings: SiteSettings = {
  siteName: 'Aurora Journal',
  siteSubtitle: '文章、分类与标签',
  siteDescription: '一个支持内容发布、媒体管理、评论审核与权限控制的博客系统。',
  logo: '',
  announcementEnabled: false,
  announcementTitle: '站点公告',
  announcementContent: '欢迎来到 Aurora Journal，这里会持续更新最新文章与站点动态。',
  announcementLink: '/posts',
  announcementLinkLabel: '查看文章',
  heroTitle: '最新内容',
  heroDescription: '查看最新发布的文章，也可以按分类和标签继续浏览。',
  footerText: '基于 Vue 与 NestJS 构建',
  githubUrl: 'https://github.com/',
  icp: '',
  aboutTitle: '关于本站',
  aboutContent: '这是一个基于 Vue 与 NestJS 的博客系统，支持内容发布、媒体管理、评论审核和后台权限控制。',
  homeLayoutPreset: 'focus',
  navigationMenu: defaultNavigationMenu,
  homeSections: [
    {
      key: 'featuredPosts',
      title: '精选内容',
      enabled: true,
      limit: 3,
      ...getHomeLayoutPresetLayout('focus', 'featuredPosts'),
    },
    {
      key: 'latestPosts',
      title: '最新发布',
      enabled: true,
      limit: 9,
      ...getHomeLayoutPresetLayout('focus', 'latestPosts'),
    },
    {
      key: 'categories',
      title: '内容分类',
      enabled: true,
      limit: 8,
      ...getHomeLayoutPresetLayout('focus', 'categories'),
    },
    {
      key: 'tags',
      title: '热门标签',
      enabled: true,
      limit: 10,
      ...getHomeLayoutPresetLayout('focus', 'tags'),
    },
  ],
};

const defaultCommentModerationRules: CommentModerationRules = {
  minLength: 3,
  blockedWords: [],
  autoApproveDomains: [],
};

function cloneDefaultSettings(): SiteSettings {
  return {
    ...defaultSettings,
    navigationMenu: defaultSettings.navigationMenu.map((item) => ({ ...item })),
    homeSections: defaultSettings.homeSections.map((section) => ({ ...section })),
  };
}

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeHomeLayoutPreset(preset?: string): HomeLayoutPreset {
  return HOME_LAYOUT_PRESETS.includes(preset as HomeLayoutPreset)
    ? (preset as HomeLayoutPreset)
    : defaultSettings.homeLayoutPreset;
}

function clampInteger(value: unknown, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function clampHomeSectionSpan(value: unknown): HomeSectionSetting['w'] {
  return clampInteger(value, 1, HOME_SECTION_MAX_SPAN) as HomeSectionSetting['w'];
}

function normalizeSectionSize(
  width: unknown,
  height: unknown,
): Pick<HomeSectionSetting, 'w' | 'h'> {
  const w = clampHomeSectionSpan(width);
  const h = clampHomeSectionSpan(height);

  if (w === 2 && h === 2) {
    return { w: 2, h: 1 };
  }

  return { w, h };
}

function buildOccupiedKey(x: number, y: number) {
  return `${x}:${y}`;
}

function canPlaceSection(
  x: number,
  y: number,
  w: number,
  h: number,
  occupied: Set<string>,
) {
  if (x < 0 || y < 0) {
    return false;
  }

  if (x + w > HOME_LAYOUT_COLUMNS || y + h > HOME_LAYOUT_MAX_ROWS) {
    return false;
  }

  for (let row = y; row < y + h; row += 1) {
    for (let column = x; column < x + w; column += 1) {
      if (occupied.has(buildOccupiedKey(column, row))) {
        return false;
      }
    }
  }

  return true;
}

function markSectionPlacement(
  x: number,
  y: number,
  w: number,
  h: number,
  occupied: Set<string>,
) {
  for (let row = y; row < y + h; row += 1) {
    for (let column = x; column < x + w; column += 1) {
      occupied.add(buildOccupiedKey(column, row));
    }
  }
}

function resolveSectionPlacement(
  layout: Pick<HomeSectionSetting, 'x' | 'y' | 'w' | 'h'>,
  occupied: Set<string>,
): Pick<HomeSectionSetting, 'x' | 'y' | 'w' | 'h'> {
  const desiredX = clampInteger(layout.x, 0, HOME_LAYOUT_COLUMNS - layout.w);
  const desiredY = clampInteger(layout.y, 0, HOME_LAYOUT_MAX_ROWS - layout.h);

  if (canPlaceSection(desiredX, desiredY, layout.w, layout.h, occupied)) {
    markSectionPlacement(desiredX, desiredY, layout.w, layout.h, occupied);
    return { x: desiredX, y: desiredY, w: layout.w, h: layout.h };
  }

  for (let row = 0; row <= HOME_LAYOUT_MAX_ROWS - layout.h; row += 1) {
    for (let column = 0; column <= HOME_LAYOUT_COLUMNS - layout.w; column += 1) {
      if (canPlaceSection(column, row, layout.w, layout.h, occupied)) {
        markSectionPlacement(column, row, layout.w, layout.h, occupied);
        return { x: column, y: row, w: layout.w, h: layout.h };
      }
    }
  }

  markSectionPlacement(0, 0, 1, 1, occupied);
  return { x: 0, y: 0, w: 1, h: 1 };
}

function normalizeHomeSections(
  sections?: HomeSectionSetting[],
  preset?: string,
): HomeSectionSetting[] {
  const normalizedPreset = normalizeHomeLayoutPreset(preset);
  const fallbackSettings = cloneDefaultSettings();
  const incomingMap = new Map((sections ?? []).map((item) => [item.key, item]));
  const orderedKeys = [...new Set([...(sections ?? []).map((item) => item.key), ...HOME_SECTION_KEYS])].filter(
    (key): key is HomeSectionSetting['key'] => HOME_SECTION_KEYS.includes(key as HomeSectionSetting['key']),
  );
  const occupied = new Set<string>();

  return orderedKeys.map((key) => {
    const fallback =
      fallbackSettings.homeSections.find((section) => section.key === key) ??
      fallbackSettings.homeSections[0];
    const matched = incomingMap.get(key);
    const seededLayout = getHomeLayoutPresetLayout(normalizedPreset, key);
    const normalizedSize = normalizeSectionSize(
      matched?.w ?? seededLayout.w,
      matched?.h ?? seededLayout.h,
    );
    const layout = resolveSectionPlacement(
      {
        x: clampInteger(matched?.x ?? seededLayout.x, 0, HOME_LAYOUT_COLUMNS - normalizedSize.w),
        y: clampInteger(matched?.y ?? seededLayout.y, 0, HOME_LAYOUT_MAX_ROWS - normalizedSize.h),
        ...normalizedSize,
      },
      occupied,
    );

    return {
      ...fallback,
      ...matched,
      title: matched?.title?.trim() || fallback.title,
      enabled: typeof matched?.enabled === 'boolean' ? matched.enabled : fallback.enabled,
      limit: clampInteger(matched?.limit ?? fallback.limit, 1, 24),
      ...layout,
    };
  });
}

function normalizeNavigationMenu(menu?: NavigationMenuItem[]): NavigationMenuItem[] {
  const builtinItems = new Map<BuiltinNavigationMenuKey, NavigationMenuItem>();
  const customItems: NavigationMenuItem[] = [];
  const usedCustomKeys = new Set<string>(NAVIGATION_MENU_KEYS);

  for (const [index, item] of (menu ?? []).entries()) {
    const normalizedKey = String(item?.key ?? '').trim();
    const normalizedBuiltinKey = String(item?.builtinKey ?? '').trim();
    const builtinKey = isBuiltinNavigationMenuKey(normalizedBuiltinKey)
      ? normalizedBuiltinKey
      : isBuiltinNavigationMenuKey(normalizedKey)
        ? normalizedKey
        : null;

    if (builtinKey) {
      builtinItems.set(builtinKey, {
        ...item,
        key: normalizedKey || builtinKey,
        builtinKey,
      });
      continue;
    }

    let customKey = normalizedKey || `custom-${index + 1}`;
    while (usedCustomKeys.has(customKey)) {
      customKey = `${customKey}-copy`;
    }
    usedCustomKeys.add(customKey);

    customItems.push({
      ...item,
      key: customKey,
      builtinKey: null,
      label: item?.label?.trim() || '新菜单',
      path: item?.path?.trim() || '/',
      visible: typeof item?.visible === 'boolean' ? item.visible : true,
      external: typeof item?.external === 'boolean' ? item.external : false,
      order: clampInteger(item?.order ?? defaultNavigationMenu.length + index, 0, 256),
    });
  }

  const normalizedBuiltins = NAVIGATION_MENU_KEYS.map((builtinKey) => {
    const fallback =
      defaultNavigationMenu.find((item) => item.builtinKey === builtinKey) ??
      defaultNavigationMenu[0];
    const matched = builtinItems.get(builtinKey);

    return {
      key: matched?.key?.trim() || builtinKey,
      builtinKey,
      label: matched?.label?.trim() || fallback.label,
      path: matched?.path?.trim() || fallback.path,
      visible: typeof matched?.visible === 'boolean' ? matched.visible : fallback.visible,
      external: typeof matched?.external === 'boolean' ? matched.external : fallback.external,
      order: clampInteger(matched?.order ?? fallback.order, 0, 256),
    } satisfies NavigationMenuItem;
  });

  const sortOrderMap = new Map(
    defaultNavigationMenu.map((item, index) => [item.builtinKey ?? item.key, index]),
  );

  return [...normalizedBuiltins, ...customItems]
    .sort(
      (left, right) =>
        left.order - right.order ||
        (sortOrderMap.get(left.builtinKey ?? left.key) ?? defaultNavigationMenu.length + 100) -
          (sortOrderMap.get(right.builtinKey ?? right.key) ?? defaultNavigationMenu.length + 100) ||
        left.label.localeCompare(right.label, 'zh-CN'),
    )
    .map((item, index) => ({
      ...item,
      order: index,
    }));
}

function normalizeCommentModerationRules(
  rules?: Partial<CommentModerationRules> | null,
): CommentModerationRules {
  return {
    minLength: Math.max(1, Number(rules?.minLength || defaultCommentModerationRules.minLength)),
    blockedWords: Array.from(
      new Set((rules?.blockedWords || []).map((item) => item.trim()).filter(Boolean)),
    ),
    autoApproveDomains: Array.from(
      new Set(
        (rules?.autoApproveDomains || [])
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  };
}

function normalizeSettingsPayload(dto: UpdateSettingsDto): SiteSettings {
  const homeLayoutPreset = normalizeHomeLayoutPreset(dto.homeLayoutPreset);
  const base = cloneDefaultSettings();

  return {
    ...base,
    ...dto,
    homeLayoutPreset,
    navigationMenu: normalizeNavigationMenu(dto.navigationMenu),
    homeSections: normalizeHomeSections(dto.homeSections, homeLayoutPreset),
  };
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogsService: OperationLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getSiteSettings(): Promise<SiteSettings> {
    const item = await this.prisma.setting.findUnique({ where: { key: 'site' } });
    if (!item) {
      return cloneDefaultSettings();
    }

    const parsed = safeParseJson<Partial<SiteSettings>>(item.value, {});
    const homeLayoutPreset = normalizeHomeLayoutPreset(parsed.homeLayoutPreset);
    const normalized: SiteSettings = {
      ...cloneDefaultSettings(),
      ...parsed,
      homeLayoutPreset,
      navigationMenu: normalizeNavigationMenu(parsed.navigationMenu),
      homeSections: normalizeHomeSections(parsed.homeSections, homeLayoutPreset),
    };

    if (
      !Array.isArray(parsed.navigationMenu) ||
      !Array.isArray(parsed.homeSections) ||
      parsed.homeLayoutPreset !== normalized.homeLayoutPreset
    ) {
      await this.prisma.setting.update({
        where: { key: 'site' },
        data: { value: JSON.stringify(normalized) },
      });
    }

    return normalized;
  }

  async updateSiteSettings(
    dto: UpdateSettingsDto,
    actor?: Pick<AuthUser, 'id' | 'name'> | null,
  ) {
    const before = await this.getSiteSettings();
    const payload = normalizeSettingsPayload(dto);
    const summary = this.buildSettingsSummary(before, payload);

    await this.prisma.setting.upsert({
      where: { key: 'site' },
      update: { value: JSON.stringify(payload) },
      create: { key: 'site', value: JSON.stringify(payload) },
    });

    await this.createVersion('site', payload, summary, actor);

    await this.operationLogsService.create({
      action: 'settings.updateSite',
      targetType: 'setting',
      targetId: 'site',
      targetLabel: payload.siteName,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        summary,
        homeLayoutPreset: payload.homeLayoutPreset,
        navigationMenu: payload.navigationMenu,
        homeSections: payload.homeSections,
      },
    });

    await this.notificationsService.create({
      title: '站点设置已更新',
      content: summary,
      category: '设置',
      level: 'SUCCESS',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'setting',
      entityId: 'site',
      link: '/settings',
    });

    return this.getSiteSettings();
  }

  async getCommentModerationRules(): Promise<CommentModerationRules> {
    const item = await this.prisma.setting.findUnique({
      where: { key: 'comment-moderation-rules' },
    });
    if (!item) {
      return { ...defaultCommentModerationRules };
    }

    const parsed = safeParseJson<Partial<CommentModerationRules>>(item.value, {});
    return normalizeCommentModerationRules(parsed);
  }

  async updateCommentModerationRules(
    rules: CommentModerationRules,
    actor?: Pick<AuthUser, 'id' | 'name'> | null,
  ) {
    const before = await this.getCommentModerationRules();
    const payload = normalizeCommentModerationRules(rules);

    await this.prisma.setting.upsert({
      where: { key: 'comment-moderation-rules' },
      update: { value: JSON.stringify(payload) },
      create: { key: 'comment-moderation-rules', value: JSON.stringify(payload) },
    });

    const summary = this.buildRulesSummary(before, payload);
    await this.createVersion('comment-moderation-rules', payload, summary, actor);

    await this.operationLogsService.create({
      action: 'comments.updateRules',
      targetType: 'setting',
      targetId: 'comment-moderation-rules',
      targetLabel: '评论审核规则',
      actorId: actor?.id,
      actorName: actor?.name,
      detail: payload as unknown as Record<string, unknown>,
    });

    await this.notificationsService.create({
      title: '评论审核规则已更新',
      content: summary,
      category: '设置',
      level: 'INFO',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'setting',
      entityId: 'comment-moderation-rules',
      link: '/settings',
    });

    return this.getCommentModerationRules();
  }

  async listVersions(
    settingKey = 'site',
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<SettingVersionEntry>> {
    const where = { settingKey };
    const [total, items] = await Promise.all([
      this.prisma.settingVersion.count({ where }),
      this.prisma.settingVersion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        settingKey: item.settingKey,
        summary: item.summary,
        createdByName: item.createdByName,
        createdAt: item.createdAt.toISOString(),
        valuePreview: this.buildValuePreview(item.settingKey, item.value),
      })),
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async restoreVersion(id: string, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const version = await this.prisma.settingVersion.findUnique({ where: { id } });
    if (!version) {
      throw new NotFoundException('配置版本不存在');
    }

    if (!['site', 'comment-moderation-rules'].includes(version.settingKey)) {
      throw new BadRequestException('当前配置暂不支持恢复');
    }

    const parsed = safeParseJson<SiteSettings | CommentModerationRules>(
      version.value,
      version.settingKey === 'site' ? cloneDefaultSettings() : { ...defaultCommentModerationRules },
    );
    const normalizedValue =
      version.settingKey === 'site'
        ? normalizeSettingsPayload(parsed as UpdateSettingsDto)
        : normalizeCommentModerationRules(parsed as CommentModerationRules);

    await this.prisma.setting.upsert({
      where: { key: version.settingKey },
      update: { value: JSON.stringify(normalizedValue) },
      create: { key: version.settingKey, value: JSON.stringify(normalizedValue) },
    });

    const restoredAt = new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(version.createdAt);

    await this.createVersion(
      version.settingKey,
      normalizedValue,
      `恢复到 ${restoredAt} 的版本`,
      actor,
    );

    await this.operationLogsService.create({
      action: 'settings.restoreVersion',
      targetType: 'setting',
      targetId: version.settingKey,
      targetLabel: version.settingKey,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        versionId: version.id,
        summary: version.summary,
      },
    });

    await this.notificationsService.create({
      title: '配置版本已恢复',
      content: `${version.settingKey} 已恢复到历史版本。`,
      category: '设置',
      level: 'SUCCESS',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'setting',
      entityId: version.settingKey,
      link: '/settings/versions',
    });

    return version.settingKey === 'site'
      ? this.getSiteSettings()
      : this.getCommentModerationRules();
  }

  private async createVersion(
    settingKey: string,
    value: unknown,
    summary: string,
    actor?: Pick<AuthUser, 'id' | 'name'> | null,
  ) {
    await this.prisma.settingVersion.create({
      data: {
        settingKey,
        value: JSON.stringify(value),
        summary,
        createdById: actor?.id ?? null,
        createdByName: actor?.name ?? '',
      },
    });
  }

  private buildSettingsSummary(before: SiteSettings, after: SiteSettings) {
    const changes: string[] = [];

    if (
      before.announcementEnabled !== after.announcementEnabled ||
      before.announcementTitle !== after.announcementTitle ||
      before.announcementContent !== after.announcementContent ||
      before.announcementLink !== after.announcementLink ||
      before.announcementLinkLabel !== after.announcementLinkLabel
    ) {
      changes.push('更新全站公告');
    }
    if (before.siteName !== after.siteName) {
      changes.push('更新站点名称');
    }
    if (before.siteDescription !== after.siteDescription) {
      changes.push('调整站点描述');
    }
    if (
      before.heroTitle !== after.heroTitle ||
      before.heroDescription !== after.heroDescription
    ) {
      changes.push('更新首页主视觉');
    }
    if (before.homeLayoutPreset !== after.homeLayoutPreset) {
      changes.push('切换首页布局模板');
    }
    if (JSON.stringify(before.navigationMenu) !== JSON.stringify(after.navigationMenu)) {
      changes.push('调整博客导航菜单');
    }
    if (JSON.stringify(before.homeSections) !== JSON.stringify(after.homeSections)) {
      changes.push('调整首页模块布局');
    }
    if (
      before.aboutTitle !== after.aboutTitle ||
      before.aboutContent !== after.aboutContent
    ) {
      changes.push('更新关于页面');
    }

    return changes.length ? changes.join('、') : '保存站点设置';
  }

  private buildRulesSummary(
    before: CommentModerationRules,
    after: CommentModerationRules,
  ) {
    const changes: string[] = [];

    if (before.minLength !== after.minLength) {
      changes.push(`最短评论长度改为 ${after.minLength} 字`);
    }
    if (before.blockedWords.join('|') !== after.blockedWords.join('|')) {
      changes.push('更新敏感词列表');
    }
    if (before.autoApproveDomains.join('|') !== after.autoApproveDomains.join('|')) {
      changes.push('更新自动通过域名');
    }

    return changes.length ? changes.join('、') : '保存评论审核规则';
  }

  private buildValuePreview(settingKey: string, rawValue: string) {
    const parsed = safeParseJson<Record<string, unknown>>(rawValue, {});

    if (settingKey === 'site') {
      return {
        siteName: parsed.siteName,
        heroTitle: parsed.heroTitle,
        homeLayoutPreset: parsed.homeLayoutPreset,
        navigationMenu: parsed.navigationMenu,
        homeSections: parsed.homeSections,
      };
    }

    if (settingKey === 'comment-moderation-rules') {
      return {
        minLength: parsed.minLength,
        blockedWords: parsed.blockedWords,
        autoApproveDomains: parsed.autoApproveDomains,
      };
    }

    return parsed;
  }
}
