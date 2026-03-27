import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min } from 'class-validator';

export class UpdateCommentRulesDto {
  @ApiProperty()
  @Type(() => Number)
  @Transform(({ value }) => {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : 1;
  })
  @IsInt()
  @Min(1)
  minLength!: number;

  @ApiProperty({ type: [String] })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  })
  @IsArray()
  @IsString({ each: true })
  blockedWords!: string[];

  @ApiProperty({ type: [String] })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    }

    return [];
  })
  @IsArray()
  @IsString({ each: true })
  autoApproveDomains!: string[];
}
