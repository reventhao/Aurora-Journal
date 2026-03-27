import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

type AuthMailPurpose = 'register' | 'resetPassword';

type SendVerificationCodeInput = {
  email: string;
  code: string;
  purpose: AuthMailPurpose;
  expiresInMinutes: number;
};

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  private transporter: Transporter | null | undefined;

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(input: SendVerificationCodeInput) {
    const transporter = this.getTransporter();
    if (!transporter) {
      if (this.isProduction()) {
        throw new ServiceUnavailableException('邮件服务未配置');
      }

      this.logger.warn(`SMTP 未配置，验证码已切换到开发模式: ${input.email}`);
      return {
        delivered: false,
        debugCode: input.code,
      };
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: input.email,
        subject: input.purpose === 'register' ? 'Aurora Admin 注册验证码' : 'Aurora Admin 重置密码验证码',
        text: `验证码：${input.code}，${input.expiresInMinutes} 分钟内有效。若非本人操作请忽略。`,
        html: `
          <div style="font-family:Segoe UI, PingFang SC, Microsoft YaHei, sans-serif; padding:24px; color:#0f172a;">
            <div style="max-width:520px; margin:0 auto; border:1px solid #e2e8f0; border-radius:20px; overflow:hidden; background:#ffffff;">
              <div style="padding:20px 24px; background:linear-gradient(135deg, #0f172a, #1d4ed8); color:#ffffff;">
                <strong style="font-size:18px;">Aurora Admin</strong>
              </div>
              <div style="padding:24px;">
                <p style="margin:0 0 12px; font-size:14px; color:#475569;">${input.purpose === 'register' ? '注册验证码' : '重置密码验证码'}</p>
                <div style="display:inline-block; padding:14px 18px; border-radius:16px; background:#eff6ff; color:#1d4ed8; font-size:28px; font-weight:700; letter-spacing:0.18em;">
                  ${input.code}
                </div>
                <p style="margin:16px 0 0; font-size:13px; color:#64748b;">${input.expiresInMinutes} 分钟内有效。若非本人操作，请忽略这封邮件。</p>
              </div>
            </div>
          </div>
        `,
      });

      return {
        delivered: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`验证码邮件发送失败: ${message}`);
      throw new ServiceUnavailableException('验证码发送失败，请稍后重试');
    }
  }

  private getTransporter() {
    if (this.transporter !== undefined) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS')?.trim();
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL')?.trim();
    const secure = this.parseBoolean(this.configService.get<string>('SMTP_SECURE'));

    if (!host || !port || !fromEmail) {
      this.transporter = null;
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }

  private getFromAddress() {
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'no-reply@aurora.local').trim();
    const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Aurora Admin').trim();
    return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
  }

  private parseBoolean(value: string | undefined) {
    return ['1', 'true', 'yes', 'on'].includes((value || '').trim().toLowerCase());
  }

  private isProduction() {
    return this.configService.get<string>('NODE_ENV', 'development') === 'production';
  }
}
