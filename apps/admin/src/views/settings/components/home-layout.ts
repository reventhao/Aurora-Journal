import {
  HOME_LAYOUT_COLUMNS,
  HOME_LAYOUT_MAX_ROWS,
  HOME_SECTION_KEYS,
  type HomeLayoutPreset,
  type HomeSectionSetting,
} from '@aurora/shared';
import type { Layout } from 'grid-layout-plus';

export type LayoutPresetOption = {
  value: HomeLayoutPreset;
  label: string;
  description: string;
};

export type SizeOption = {
  key: 'default' | 'wide' | 'tall';
  label: string;
  shortLabel: string;
  note: string;
  w: HomeSectionSetting['w'];
  h: HomeSectionSetting['h'];
};

export const sectionLabelMap: Record<HomeSectionSetting['key'], string> = {
  featuredPosts: '精选文章',
  latestPosts: '最新文章',
  categories: '内容分栏',
  tags: '热门标签',
};

export const layoutPresetOptions: LayoutPresetOption[] = [
  { value: 'stack', label: '单列', description: '上下完整展开' },
  { value: 'bands', label: '上下分栏', description: '头尾通栏，中间分栏' },
  { value: 'headline', label: '头条', description: '大卡领衔，下方补充' },
  { value: 'focus', label: '焦点左侧', description: '左侧主卡，右侧补充' },
  { value: 'focusRight', label: '焦点右侧', description: '右侧主卡，左侧补充' },
  { value: 'rail', label: '导览左侧', description: '顶部通栏，下方左主右辅' },
  { value: 'railRight', label: '导览右侧', description: '顶部通栏，下方右主左辅' },
  { value: 'quad', label: '四宫格', description: '四块均衡分布' },
];

export const sizeOptions: SizeOption[] = [
  { key: 'default', label: '标准', shortLabel: '标准', note: '恢复常规尺寸', w: 1, h: 1 },
  { key: 'wide', label: '横向放大', shortLabel: '横向', note: '横向铺满一行', w: 2, h: 1 },
  { key: 'tall', label: '纵向放大', shortLabel: '纵向', note: '纵向增加高度', w: 1, h: 2 },
];

export function compareSectionLayout(
  left: Pick<HomeSectionSetting, 'key' | 'x' | 'y'>,
  right: Pick<HomeSectionSetting, 'key' | 'x' | 'y'>,
) {
  if (left.y !== right.y) return left.y - right.y;
  if (left.x !== right.x) return left.x - right.x;
  return HOME_SECTION_KEYS.indexOf(left.key) - HOME_SECTION_KEYS.indexOf(right.key);
}

export function sortSectionsByLayout<T extends Pick<HomeSectionSetting, 'key' | 'x' | 'y'>>(sections: T[]) {
  return [...sections].sort(compareSectionLayout);
}

export function clampInteger(value: unknown, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(numeric)));
}

export function clampSectionSpan(value: unknown): HomeSectionSetting['w'] {
  return clampInteger(value, 1, 2) as HomeSectionSetting['w'];
}

export function normalizeSectionSize(
  width: unknown,
  height: unknown,
): Pick<HomeSectionSetting, 'w' | 'h'> {
  const w = clampSectionSpan(width);
  const h = clampSectionSpan(height);

  if (w === 2 && h === 2) {
    return { w: 2, h: 1 };
  }

  return { w, h };
}

function buildOccupiedKey(x: number, y: number) {
  return `${x}:${y}`;
}

function canPlaceSection(x: number, y: number, w: number, h: number, occupied: Set<string>) {
  if (x < 0 || y < 0) return false;
  if (x + w > HOME_LAYOUT_COLUMNS || y + h > HOME_LAYOUT_MAX_ROWS) return false;

  for (let row = y; row < y + h; row += 1) {
    for (let column = x; column < x + w; column += 1) {
      if (occupied.has(buildOccupiedKey(column, row))) {
        return false;
      }
    }
  }

  return true;
}

function markSectionPlacement(x: number, y: number, w: number, h: number, occupied: Set<string>) {
  for (let row = y; row < y + h; row += 1) {
    for (let column = x; column < x + w; column += 1) {
      occupied.add(buildOccupiedKey(column, row));
    }
  }
}

export function resolveSectionPlacement(
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

export function normalizeSectionsForCanvas(sections: HomeSectionSetting[]) {
  const occupied = new Set<string>();
  const enabledSections = sortSectionsByLayout(sections.filter((section) => section.enabled));

  for (const section of enabledSections) {
    const size = normalizeSectionSize(section.w, section.h);
    Object.assign(
      section,
      resolveSectionPlacement(
        {
          x: section.x,
          y: section.y,
          w: size.w,
          h: size.h,
        },
        occupied,
      ),
    );
  }

  for (const section of sections.filter((item) => !item.enabled)) {
    Object.assign(section, normalizeSectionSize(section.w, section.h));
  }

  return sections;
}

export function normalizeGridLayout(layout: Layout) {
  return sortSectionsByLayout(
    layout.map((item) => {
      const size = normalizeSectionSize(item.w, item.h);
      return {
        key: item.i as HomeSectionSetting['key'],
        x: clampInteger(item.x, 0, HOME_LAYOUT_COLUMNS - size.w),
        y: clampInteger(item.y, 0, HOME_LAYOUT_MAX_ROWS - size.h),
        w: size.w,
        h: size.h,
      };
    }),
  );
}

export function toLayoutItem(section: HomeSectionSetting) {
  const size = normalizeSectionSize(section.w, section.h);
  return {
    i: section.key,
    x: section.x,
    y: section.y,
    w: size.w,
    h: size.h,
    minW: 1,
    minH: 1,
  };
}

export function formatOrder(index: number) {
  return String(index + 1).padStart(2, '0');
}

export function formatPosition(section: Pick<HomeSectionSetting, 'x' | 'y' | 'w'>) {
  if (section.w === 2) {
    return `第 ${section.y + 1} 行 · 通栏`;
  }

  return `第 ${section.y + 1} 行 · 第 ${section.x + 1} 列`;
}

export function getSizeOption(width: unknown, height: unknown) {
  const size = normalizeSectionSize(width, height);
  return sizeOptions.find((item) => item.w === size.w && item.h === size.h) ?? sizeOptions[0];
}

export function formatSize(section: Pick<HomeSectionSetting, 'w' | 'h'>) {
  return getSizeOption(section.w, section.h).label;
}
