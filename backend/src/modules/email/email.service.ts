import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface Recipient {
  email: string;
  name?: string;
}

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  private async sendEmail(recipient: Recipient, subject: string, content: string): Promise<void> {
    await this.mailerService.sendMail({
      to: recipient.email,
      subject: 'SketCherry: ' + subject,
      html: `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sketcherry: ${subject}</title>
  </head>
  <body>
    <div>
      <div>Hello${recipient.name ? ` ${recipient.name}` : ''},</div>
      <div>${content}</div>
      <div>Best regards,<br />SketCherry</div>
    </div>
  </body>
</html>
  `,
    });
  }

  async sendEmailConfirmation(recipient: Recipient, token: string) {
    await this.sendEmail(
      recipient,
      'Confirm Your Email',
      `
<p>We are happy to have you with SketCherry.</p>
<p>To complete your registration, please confirm your email using the following <a href="${this.configService.get('APP_URL')}/email-confirmation/${token}">link</a><br />
It will expire soon and can only be used once.</p>
      `,
    );
  }

  async sendPasswordReset(recipient: Recipient, token: string) {
    await this.sendEmail(
      recipient,
      'Reset Your Password',
      `
<p>To reset your password, please use the following <a href="${this.configService.get('APP_URL')}/password-reset/${token}">link</a><br />
It will expire soon and can only be used once. If you did not request this email, feel free to ignore it.</p>
      `,
    );
  }

  async sendAccountDeletion(recipient: Recipient, token: string) {
    await this.sendEmail(
      recipient,
      'Confirm Account Deletion',
      `
<p>We received your request for account deletion. To confirm it, please use the following <a href="${this.configService.get('APP_URL')}/account-deletion/${token}">link</a><br />
It will expire soon and can only be used once. If you did not request account deletion or changed your mind, feel free to ignore this email.</p>
      `,
    );
  }
}
