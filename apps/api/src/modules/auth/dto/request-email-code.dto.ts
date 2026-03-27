import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';

export class RequestEmailCodeDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['register', 'resetPassword'] })
  @IsString()
  @IsIn(['register', 'resetPassword'])
  purpose!: 'register' | 'resetPassword';
}
