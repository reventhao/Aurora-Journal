import type {
  AssistantAnimation,
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantContext,
  AssistantMood,
  AssistantPresenceDirective,
  AssistantQuickAction,
  AssistantSpeechDirective,
  AssistantSpeechRequest,
  AssistantVoiceStyle,
  AuthUser,
} from '@aurora/shared';
import { execFile } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const execFileAsync = promisify(execFile);

type CompatibleChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

@Injectable()
export class AssistantService {
  constructor(private readonly configService: ConfigService) {}

  async chatPublic(
    payload: AssistantChatRequest,
  ): Promise<AssistantChatResponse> {
    return this.resolveResponse(payload);
  }

  async chatAdmin(
    payload: AssistantChatRequest,
    user: AuthUser,
  ): Promise<AssistantChatResponse> {
    return this.resolveResponse(payload, user);
  }

  async synthesizeSpeech(payload: AssistantSpeechRequest) {
    const trimmedText = payload.text.trim();
    if (!trimmedText) {
      throw new ServiceUnavailableException('TTS text is empty.');
    }

    const pythonBin =
      this.configService.get<string>('ASSISTANT_TTS_PYTHON_BIN')?.trim() ||
      'python';
    const scriptPath = this.resolveTtsScriptPath();
    const outputPath = join(
      tmpdir(),
      `aurora-assistant-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`,
    );

    try {
      await execFileAsync(pythonBin, [
        scriptPath,
        '--text',
        trimmedText,
        '--voice',
        this.resolveTtsVoice(payload.style),
        `--rate=${this.resolveTtsRate(payload.style)}`,
        `--volume=${this.resolveTtsVolume(payload.style)}`,
        `--pitch=${this.resolveTtsPitch(payload.style, payload.mood)}`,
        `--output=${outputPath}`,
      ]);

      return {
        buffer: await fs.readFile(outputPath),
        contentType: 'audio/mpeg',
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException(
        `Edge TTS generation failed: ${detail}`,
      );
    } finally {
      await fs.unlink(outputPath).catch(() => undefined);
    }
  }

  private async resolveResponse(
    payload: AssistantChatRequest,
    user?: AuthUser,
  ): Promise<AssistantChatResponse> {
    const actions = this.buildActions(payload.context);
    const suggestions = this.buildSuggestions(payload.context, actions);
    const provider = this.getProviderConfig();

    if (!provider) {
      const fallback = this.buildFallbackReply(payload, user);
      return {
        ...fallback,
        actions,
        suggestions,
        provider: 'fallback',
        ...this.buildCharacterDirectives(
          fallback.reply,
          fallback.mood,
          payload.context,
        ),
      };
    }

    try {
      const reply = await this.generateModelReply(payload, provider, user);
      const mood = this.detectMood(reply, payload.context);
      return {
        reply,
        mood,
        actions,
        suggestions,
        provider: 'openai-compatible',
        model: provider.model,
        ...this.buildCharacterDirectives(reply, mood, payload.context),
      };
    } catch {
      const fallback = this.buildFallbackReply(payload, user);
      return {
        ...fallback,
        actions,
        suggestions,
        provider: 'fallback',
        ...this.buildCharacterDirectives(
          fallback.reply,
          fallback.mood,
          payload.context,
        ),
      };
    }
  }

  private getProviderConfig() {
    const baseUrl = this.configService
      .get<string>('ASSISTANT_BASE_URL')
      ?.trim();
    const model = this.configService.get<string>('ASSISTANT_MODEL')?.trim();

    if (!baseUrl || !model) {
      return null;
    }

    return {
      baseUrl: baseUrl.replace(/\/+$/, ''),
      model,
      apiKey: this.configService.get<string>('ASSISTANT_API_KEY')?.trim(),
    };
  }

  private resolveTtsVoice(style: AssistantVoiceStyle) {
    if (style === 'playful') {
      return 'zh-CN-XiaoyiNeural';
    }

    if (style === 'pro') {
      return 'zh-CN-YunyangNeural';
    }

    return 'zh-CN-XiaoxiaoNeural';
  }

  private resolveTtsRate(style: AssistantVoiceStyle) {
    if (style === 'playful') {
      return '+10%';
    }

    if (style === 'pro') {
      return '-8%';
    }

    return '-2%';
  }

  private resolveTtsVolume(style: AssistantVoiceStyle) {
    if (style === 'playful') {
      return '+8%';
    }

    if (style === 'pro') {
      return '+0%';
    }

    return '+6%';
  }

  private resolveTtsPitch(style: AssistantVoiceStyle, mood?: AssistantMood) {
    const basePitch: Record<AssistantVoiceStyle, number> = {
      playful: 6,
      warm: 2,
      pro: -4,
    };
    const moodOffset: Record<AssistantMood, number> = {
      idle: 0,
      thinking: -2,
      spark: 2,
      warning: -3,
      celebrate: 4,
    };
    const pitch = basePitch[style] + (mood ? moodOffset[mood] : 0);

    return `${pitch >= 0 ? '+' : ''}${pitch}Hz`;
  }

  private resolveTtsScriptPath() {
    const configured = this.configService
      .get<string>('ASSISTANT_TTS_SCRIPT_PATH')
      ?.trim();

    const candidates = [
      configured,
      join(process.cwd(), 'scripts', 'edge_tts_runner.py'),
      join(process.cwd(), 'apps', 'api', 'scripts', 'edge_tts_runner.py'),
    ].filter((value): value is string => Boolean(value));

    const matched = candidates.find((value) => existsSync(value));
    if (matched) {
      return matched;
    }

    throw new ServiceUnavailableException(
      `Edge TTS script not found. Checked: ${candidates.join(', ')}`,
    );
  }

  private shouldIncludePageContext(context: AssistantContext) {
    return context.metadata?.includePageContext === true;
  }

  private buildSystemPrompt(context: AssistantContext, user?: AuthUser) {
    const includePageContext = this.shouldIncludePageContext(context);
    const sharedRules = [
      '你是 Aurora 的桌宠式 AI 助手。',
      '回复用简体中文。',
      '保持直接、实用、偏短句。',
      '不要编造不存在的接口、权限或数据。',
    ];

    const pageContextRules = includePageContext
      ? [
          '优先结合当前页面上下文，不要泛泛而谈。',
          '如果信息不足，明确说基于当前页面只能做初步判断。',
        ]
      : [
          '当前没有附带页面正文或页面摘要。',
          '除非用户明确要求，否则不要假设当前页面的具体内容。',
          '优先根据用户问题和对话历史直接回答。',
        ];

    if (context.app === 'admin') {
      return [
        ...sharedRules,
        ...pageContextRules,
        '你服务于博客管理后台，角色是编辑副驾。',
        '优先帮助用户完成标题优化、摘要生成、SEO 检查、发布建议、评论处理和信息结构整理。',
        user ? `当前操作者：${user.name}（${user.email}）。` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    return [
      ...sharedRules,
      ...pageContextRules,
      '你服务于博客前台，角色是阅读助手。',
      '优先帮助用户理解文章、提炼重点、解释概念、推荐阅读路径。',
    ].join('\n');
  }

  private buildUserPrompt(
    message: string,
    context: AssistantContext,
    user?: AuthUser,
  ) {
    const includePageContext = this.shouldIncludePageContext(context);
    const metadata = context.metadata
      ? Object.entries(context.metadata)
          .filter(([key]) => key !== 'includePageContext')
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join('\n')
      : '';

    if (!includePageContext) {
      return [
        `当前应用: ${context.app}`,
        user ? `当前后台用户: ${user.name}` : '',
        '页面上下文: 未附带',
        `用户问题: ${message}`,
      ]
        .filter(Boolean)
        .join('\n\n');
    }

    return [
      `当前应用: ${context.app}`,
      `当前路由: ${context.route}`,
      `当前页面标题: ${context.pageTitle}`,
      context.pageSummary ? `页面摘要: ${context.pageSummary}` : '',
      context.tags?.length ? `页面标签: ${context.tags.join(', ')}` : '',
      metadata ? `页面元信息:\n${metadata}` : '',
      context.content ? `页面内容片段:\n${context.content.slice(0, 4000)}` : '',
      user ? `当前后台用户: ${user.name}` : '',
      `用户问题: ${message}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private async generateModelReply(
    payload: AssistantChatRequest,
    provider: { baseUrl: string; model: string; apiKey?: string },
    user?: AuthUser,
  ) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider.apiKey
            ? { Authorization: `Bearer ${provider.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          temperature: payload.context.app === 'admin' ? 0.5 : 0.7,
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt(payload.context, user),
            },
            ...(payload.history ?? []).slice(-6).map((item) => ({
              role: item.role,
              content: item.content,
            })),
            {
              role: 'user',
              content: this.buildUserPrompt(
                payload.message,
                payload.context,
                user,
              ),
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`assistant provider failed: ${response.status}`);
      }

      const data = (await response.json()) as CompatibleChatResponse;
      const raw = data.choices?.[0]?.message?.content;
      if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
      }

      if (Array.isArray(raw)) {
        const merged = raw
          .map((item) => item.text?.trim())
          .filter((item): item is string => Boolean(item))
          .join('\n');
        if (merged) {
          return merged;
        }
      }

      throw new Error('assistant provider returned empty content');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildFallbackReply(payload: AssistantChatRequest, user?: AuthUser) {
    const { message, context } = payload;
    const includePageContext = this.shouldIncludePageContext(context);
    const normalized = message.trim().toLowerCase();
    const title = context.pageTitle || '当前页面';
    const summary = context.pageSummary?.trim();

    if (context.app === 'admin') {
      if (!includePageContext) {
        if (normalized.includes('标题')) {
          return {
            reply:
              '可以。把你的标题草稿发给我，我直接给你 3 到 5 个可用版本，并顺手补一句每版适合的场景。',
            mood: 'spark' as AssistantMood,
          };
        }

        if (normalized.includes('seo') || normalized.includes('摘要')) {
          return {
            reply:
              '可以直接做，但现在没有附带页面内容。把正文、草稿或需求贴给我，我就按 SEO 标题、描述和摘要三块一起整理。',
            mood: 'thinking' as AssistantMood,
          };
        }

        return {
          reply: `${user?.name || '当前管理员'}，现在是普通对话模式，我不会默认读取当前页面。你可以直接发需求、草稿、正文或报错信息，我按你给的内容处理。`,
          mood: 'idle' as AssistantMood,
        };
      }

      if (normalized.includes('标题')) {
        return {
          reply: `我建议先把「${title}」的标题压缩到 18 到 28 个字，突出一个核心动作或收益点。你可以先发我草稿标题，我按后台页面内容帮你改三版。`,
          mood: 'spark' as AssistantMood,
        };
      }

      if (normalized.includes('seo') || normalized.includes('摘要')) {
        return {
          reply: `这页更适合先补两块：一是 70 到 110 字的摘要，二是更具体的 SEO 标题。${summary ? `基于当前页面，我先抓到的重点是：${summary}` : '你也可以把正文或表单内容贴给我，我继续细化。'}`,
          mood: 'thinking' as AssistantMood,
        };
      }

      return {
        reply: `${user?.name || '当前管理员'}，我现在已经能基于页面上下文给你做编辑建议。当前更适合的动作是：优化标题、生成摘要、补 SEO、梳理标签，或者检查发布前缺口。`,
        mood: 'idle' as AssistantMood,
      };
    }

    if (!includePageContext) {
      if (normalized.includes('总结') || normalized.includes('摘要')) {
        return {
          reply:
            '可以总结，但你现在没有附带页文。把文章正文、段落或链接内容贴给我，我会直接帮你压缩重点。',
          mood: 'spark' as AssistantMood,
        };
      }

      if (normalized.includes('推荐') || normalized.includes('还想看')) {
        return {
          reply:
            '可以。告诉我你刚看完的主题、难度或你想继续看的方向，我直接给你排一个阅读路径。',
          mood: 'celebrate' as AssistantMood,
        };
      }

      return {
        reply:
          '现在是普通对话模式，我不会默认带上当前页内容。你可以直接提问，或者把文章片段贴给我再让我总结、解释、润色。',
        mood: 'idle' as AssistantMood,
      };
    }

    if (normalized.includes('总结') || normalized.includes('摘要')) {
      return {
        reply: summary
          ? `这页的核心内容可以先这样理解：${summary}`
          : `我能先围绕「${title}」帮你做简短总结。当前页面上下文还不够完整，你也可以继续问我“这篇文章重点是什么”。`,
        mood: 'spark' as AssistantMood,
      };
    }

    if (normalized.includes('推荐') || normalized.includes('还想看')) {
      return {
        reply: `如果你刚看完「${title}」，我建议继续顺着同主题文章、相关标签页或首页精选往下读。你也可以直接让我按“入门 / 进阶 / 实战”给你排阅读路径。`,
        mood: 'celebrate' as AssistantMood,
      };
    }

    return {
      reply: `我现在可以围绕「${title}」帮你做阅读辅助，比如总结重点、解释概念、推荐下一篇。你先给我一个目标，我会按当前页面继续展开。`,
      mood: 'idle' as AssistantMood,
    };
  }

  private buildCharacterDirectives(
    reply: string,
    mood: AssistantMood,
    context: AssistantContext,
  ): Pick<AssistantChatResponse, 'presence' | 'speech'> {
    return {
      presence: this.buildPresenceDirective(reply, mood, context),
      speech: this.buildSpeechDirective(reply, mood, context),
    };
  }

  private buildPresenceDirective(
    reply: string,
    mood: AssistantMood,
    context: AssistantContext,
  ): AssistantPresenceDirective {
    const includePageContext = this.shouldIncludePageContext(context);
    const animationMap: Record<AssistantMood, AssistantAnimation> = {
      idle: 'idle',
      thinking: 'ponder',
      spark: 'wave',
      warning: 'alert',
      celebrate: 'cheer',
    };

    const auraMap: Record<AssistantMood, AssistantPresenceDirective['aura']> = {
      idle: 'calm',
      thinking: 'focus',
      spark: 'warm',
      warning: 'warning',
      celebrate: 'warm',
    };

    return {
      animation: animationMap[mood],
      bubbleText: this.buildBubbleText(reply),
      idleLines: this.buildIdleLines(context, includePageContext),
      aura: auraMap[mood],
      followCursor: mood !== 'warning',
    };
  }

  private buildSpeechDirective(
    reply: string,
    mood: AssistantMood,
    context: AssistantContext,
  ): AssistantSpeechDirective {
    const speechText = this.buildSpeechText(reply);

    const pitchMap: Record<AssistantMood, number> = {
      idle: 1,
      thinking: 0.94,
      spark: 1.08,
      warning: 0.92,
      celebrate: 1.12,
    };

    return {
      text: speechText,
      auto: true,
      rate: context.app === 'admin' ? 1.03 : 1,
      pitch: pitchMap[mood],
      volume: 0.86,
    };
  }

  private buildSpeechText(reply: string) {
    const normalized = this.sanitizeSpeechText(reply);
    const [firstSentence = normalized] = normalized.split(/[。！？!?]/);
    const concise = firstSentence.trim() || normalized;

    if (concise.length <= 40) {
      return concise;
    }

    return `${concise.slice(0, 37).trim()}...`;
  }

  private sanitizeSpeechText(reply: string) {
    return reply
      .replace(/```[\s\S]*?```/g, ' 代码片段 ')
      .replace(/`([^`]+)`/g, ' $1 ')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, ' $1 ')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, ' $1 ')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/>\s*/g, '')
      .replace(/\|/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildBubbleText(reply: string) {
    const normalized = reply.replace(/\s+/g, ' ').trim();
    const [firstSentence = normalized] = normalized.split(/[。！？!?]/);
    const concise = firstSentence.trim() || normalized;

    if (concise.length <= 34) {
      return concise;
    }

    return `${concise.slice(0, 31).trim()}...`;
  }

  private buildIdleLines(
    context: AssistantContext,
    includePageContext: boolean,
  ) {
    if (context.app === 'admin') {
      return includePageContext
        ? [
            '我盯着这页，有需要就叫我。',
            '想要我抓重点、做 SEO 或审稿都可以。',
            '点我一下，我帮你看看这页还有什么缺口。',
          ]
        : [
            '把草稿、需求或报错贴给我。',
            '我可以直接帮你改标题、摘要和发布文案。',
            '不读当前页也行，直接说你要我做什么。',
          ];
    }

    return includePageContext
      ? [
          '我正在陪你读这页。',
          '想抓重点、解释概念或延展阅读都可以。',
          '点我一下，我给你换个角度讲。',
        ]
      : [
          '直接聊天也行，不会默认带页文。',
          '把文章片段贴过来，我帮你压缩重点。',
          '想继续看什么主题，告诉我就行。',
        ];
  }

  private buildActions(context: AssistantContext): AssistantQuickAction[] {
    if (context.app === 'admin') {
      if (
        context.route.includes('/posts/new') ||
        (context.route.includes('/posts/') && context.route.includes('/edit'))
      ) {
        return [
          {
            id: 'title',
            label: '优化标题',
            prompt: '请帮我优化当前文章标题，给我 3 个版本。',
          },
          {
            id: 'excerpt',
            label: '生成摘要',
            prompt: '请根据当前页面内容生成一段适合摘要栏的文案。',
          },
          {
            id: 'seo',
            label: 'SEO 检查',
            prompt: '请检查当前文章的 SEO 缺口，并给出修改建议。',
          },
          {
            id: 'tags',
            label: '标签建议',
            prompt: '请基于当前内容推荐 5 个更合适的标签。',
          },
        ];
      }

      if (context.route.includes('/comments')) {
        return [
          {
            id: 'moderate',
            label: '审核建议',
            prompt: '请根据当前评论页面内容给我审核建议。',
          },
          {
            id: 'risk',
            label: '风险排查',
            prompt: '请帮我判断当前评论里有没有攻击性、广告或垃圾内容风险。',
          },
        ];
      }

      return [
        {
          id: 'summary',
          label: '当前页总结',
          prompt: '请总结当前后台页面重点。',
        },
        {
          id: 'next-step',
          label: '下一步建议',
          prompt: '请告诉我当前页面最值得先做的 3 件事。',
        },
      ];
    }

    if (context.route.includes('/posts/')) {
      return [
        {
          id: 'brief',
          label: '一键总结',
          prompt: '请帮我总结这篇文章的重点。',
        },
        {
          id: 'concept',
          label: '解释概念',
          prompt: '请解释这篇文章里最关键的概念。',
        },
        {
          id: 'path',
          label: '阅读路径',
          prompt: '请按入门到进阶给我推荐阅读路径。',
        },
      ];
    }

    return [
      {
        id: 'discover',
        label: '推荐阅读',
        prompt: '请根据当前页面推荐下一步阅读内容。',
      },
      {
        id: 'focus',
        label: '页面重点',
        prompt: '请告诉我当前页面最值得关注的重点。',
      },
    ];
  }

  private buildSuggestions(
    context: AssistantContext,
    actions: AssistantQuickAction[],
  ) {
    const base = actions.map((item) => item.label);
    if (context.app === 'admin') {
      return [...base, '生成发布建议', '指出信息缺口'].slice(0, 5);
    }

    return [...base, '继续提问', '换个角度解释'].slice(0, 5);
  }

  private detectMood(reply: string, context: AssistantContext): AssistantMood {
    if (/风险|警告|缺口|注意|失败/.test(reply)) {
      return 'warning';
    }

    if (/推荐|完成|可以继续|建议/.test(reply)) {
      return context.app === 'admin' ? 'spark' : 'celebrate';
    }

    if (/总结|理解|解释|先/.test(reply)) {
      return 'thinking';
    }

    return 'idle';
  }
}
