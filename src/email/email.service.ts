import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { IEmailConfig } from '../config/interfaces/email-config.interface';
import { UserEntity } from '../users/entities/user.entity';
import { loginConfirmationEmail } from './templates/login-confirmation';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  private readonly transport = createTransport(
    this.configService.get<IEmailConfig>('emailService'),
  );
  private readonly email = `"Flutter Slider" <${this.configService.get<string>(
    'EMAIL_USER',
  )}>`;

  public async sendAccessCode(
    { email, username }: UserEntity,
    accessCode: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      `Your access code ${username}`,
      loginConfirmationEmail(username, accessCode),
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    await this.transport.sendMail({
      from: this.email,
      subject,
      to,
      html,
    });
  }
}
