import {
  HOME_LAYOUT_COLUMNS,
  HOME_LAYOUT_MAX_ROWS,
  HOME_SECTION_MAX_SPAN,
  NAVIGATION_MENU_KEYS,
  type HomeLayoutPreset,
  type HomeSectionSetting,
  type NavigationMenuItem,
} from '@aurora/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HomeSectionDto {
  @ApiProperty()
  @IsIn(['featuredPosts', 'latestPosts', 'categories', 'tags'])
  key!: HomeSectionSetting['key'];

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(24)
  limit!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(HOME_LAYOUT_COLUMNS - 1)
  x!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(HOME_LAYOUT_MAX_ROWS - 1)
  y!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(HOME_SECTION_MAX_SPAN)
  w!: HomeSectionSetting['w'];

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(HOME_SECTION_MAX_SPAN)
  h!: HomeSectionSetting['h'];
}

class NavigationMenuItemDto {
  @ApiProperty()
  @IsString()
  key!: NavigationMenuItem['key'];

  @ApiProperty({ required: false, enum: NAVIGATION_MENU_KEYS, nullable: true })
  @IsOptional()
  @IsIn(NAVIGATION_MENU_KEYS)
  builtinKey?: NavigationMenuItem['builtinKey'];

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsString()
  path!: string;

  @ApiProperty()
  @IsBoolean()
  visible!: boolean;

  @ApiProperty()
  @IsBoolean()
  external!: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(128)
  order!: number;
}

export class UpdateSettingsDto {
  @ApiProperty()
  @IsString()
  siteName!: string;

  @ApiProperty()
  @IsString()
  siteSubtitle!: string;

  @ApiProperty()
  @IsString()
  siteDescription!: string;

  @ApiProperty()
  @IsString()
  logo!: string;

  @ApiProperty()
  @IsBoolean()
  announcementEnabled!: boolean;

  @ApiProperty()
  @IsString()
  announcementTitle!: string;

  @ApiProperty()
  @IsString()
  announcementContent!: string;

  @ApiProperty()
  @IsString()
  announcementLink!: string;

  @ApiProperty()
  @IsString()
  announcementLinkLabel!: string;

  @ApiProperty()
  @IsString()
  heroTitle!: string;

  @ApiProperty()
  @IsString()
  heroDescription!: string;

  @ApiProperty()
  @IsString()
  footerText!: string;

  @ApiProperty()
  @IsString()
  githubUrl!: string;

  @ApiProperty()
  @IsString()
  icp!: string;

  @ApiProperty()
  @IsString()
  aboutTitle!: string;

  @ApiProperty()
  @IsString()
  aboutContent!: string;

  @ApiProperty({ type: [NavigationMenuItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavigationMenuItemDto)
  navigationMenu!: NavigationMenuItemDto[];

  @ApiProperty()
  @IsIn(['stack', 'bands', 'headline', 'focus', 'focusRight', 'rail', 'railRight', 'quad'])
  homeLayoutPreset!: HomeLayoutPreset;

  @ApiProperty({ type: [HomeSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeSectionDto)
  homeSections!: HomeSectionDto[];
}
