import type { AssistantChatResponse, AuthUser } from '@aurora/shared';
import type { Response } from 'express';
import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AssistantChatDto, AssistantSpeechDto } from './dto/assistant-chat.dto';
import { AssistantService } from './assistant.service';

@ApiTags('Assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('public-chat')
  publicChat(@Body() dto: AssistantChatDto): Promise<AssistantChatResponse> {
    return this.assistantService.chatPublic(dto);
  }

  @Post('public-speech')
  async publicSpeech(
    @Body() dto: AssistantSpeechDto,
    @Res() res: Response,
  ): Promise<void> {
    const audio = await this.assistantService.synthesizeSpeech(dto);
    res.setHeader('Content-Type', audio.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio.buffer);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin-chat')
  adminChat(
    @Body() dto: AssistantChatDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AssistantChatResponse> {
    return this.assistantService.chatAdmin(dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin-speech')
  async adminSpeech(
    @Body() dto: AssistantSpeechDto,
    @Res() res: Response,
  ): Promise<void> {
    const audio = await this.assistantService.synthesizeSpeech(dto);
    res.setHeader('Content-Type', audio.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio.buffer);
  }
}
