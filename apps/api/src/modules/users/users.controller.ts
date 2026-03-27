import type { AuthUser } from '@aurora/shared';
import { PERMISSIONS } from '@aurora/shared';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSelfPasswordDto } from './dto/update-self-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.findProfileById(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile/password')
  updateOwnPassword(@CurrentUser() user: AuthUser, @Body() dto: UpdateSelfPasswordDto) {
    return this.usersService.updateOwnPassword(user.id, dto.currentPassword, dto.password);
  }

  @Authorize(PERMISSIONS.USERS_VIEW)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Authorize(PERMISSIONS.USERS_MANAGE)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Authorize(PERMISSIONS.USERS_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Authorize(PERMISSIONS.USERS_MANAGE)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'BANNED') {
    return this.usersService.updateStatus(id, status);
  }

  @Authorize(PERMISSIONS.USERS_MANAGE)
  @Patch(':id/password')
  updatePassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(id, dto.password);
  }

  @Authorize(PERMISSIONS.USERS_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
