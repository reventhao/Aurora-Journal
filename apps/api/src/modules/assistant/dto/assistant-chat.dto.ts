import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AssistantMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MaxLength(4_000)
  content!: string;
}

export class AssistantContextDto {
  @ApiProperty({ enum: ['web', 'admin'] })
  @IsIn(['web', 'admin'])
  app!: 'web' | 'admin';

  @ApiProperty()
  @IsString()
  @MaxLength(300)
  route!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  pageTitle!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(800)
  pageSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string | number | boolean | null>;
}

export class AssistantChatDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2_000)
  message!: string;

  @ApiProperty({ type: AssistantContextDto })
  @ValidateNested()
  @Type(() => AssistantContextDto)
  context!: AssistantContextDto;

  @ApiPropertyOptional({ type: [AssistantMessageDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssistantMessageDto)
  history?: AssistantMessageDto[];
}

export class AssistantSpeechDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1_000)
  text!: string;

  @ApiProperty({ enum: ['playful', 'warm', 'pro'] })
  @IsIn(['playful', 'warm', 'pro'])
  style!: 'playful' | 'warm' | 'pro';

  @ApiPropertyOptional({
    enum: ['idle', 'thinking', 'spark', 'warning', 'celebrate'],
  })
  @IsOptional()
  @IsIn(['idle', 'thinking', 'spark', 'warning', 'celebrate'])
  mood?: 'idle' | 'thinking' | 'spark' | 'warning' | 'celebrate';
}
