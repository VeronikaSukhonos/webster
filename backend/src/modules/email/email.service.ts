import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import path from 'path';

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
    const to = recipient.email;
    subject = 'SketCherry: ' + subject;
    const logoSrc =
      this.configService.get('NODE_ENV') === 'production'
        ? (this.configService.get('CLOUDFLARE_R2_BUCKET_URL') ??
            this.configService.get<string>('VITE_API_URL')?.replace(/\/api$/, '')) +
          '/files/logo.png'
        : 'cid:logo';
    const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sketcherry: ${subject}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Berkshire+Swash&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
      rel="stylesheet"
    />
    <style>
      .body {
        background: linear-gradient(90deg, #d9d9d9, #91acd7);
        background-attachment: fixed;
        color: #0f1314;
        font-family: "Nunito", sans-serif;
        font-size: 1.03rem;
        padding: 20px;
      }
      .container {
        background: #eaeaea;
        border: 1px solid #fff;
        border-radius: 20px;
        padding: 20px;
        max-width: 450px;
        margin: auto;
      }
      .greeting {
        font-weight: 600;
        font-style: italic;
        padding-bottom: 10px;
      }
      .app-name {
        color: #4069a9;
        font-weight: bold;
      }
      .app-name span {
        color: #78366f;
      }
      a {
        color: #78366f !important;
        font-weight: bold;
      }
      a:hover {
        color: #a44998 !important;
      }
    </style>
  </head>
  <body class="body">
    <div class="container">
      <div class="greeting">
        Hello${recipient.name ? ` ${recipient.name}` : ''},
      </div>
      ${content}
      <div class="greeting" style="padding-top: 10px">
        Best regards,<br />SketCherry
      </div>
      <a href="${this.configService.get('APP_URL')}"
        ><img src="${logoSrc}" style="width: 50px; margin: auto" alt="SketCherry"
      /></a>
    </div>
  </body>
</html>
  `;
    if (this.configService.get('EMAIL_API_AND_CLOUD_FILE_STORAGE') === 'true')
      await axios.post(
        'https://mailserver.automationlounge.com/api/v1/messages/send',
        { to, subject, html },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('PROMAILER_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );
    else
      await this.mailerService.sendMail({
        to,
        subject,
        html,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join('files', 'logo.png'),
            cid: 'logo',
          },
        ],
      });
  }

  async sendEmailConfirmation(recipient: Recipient, token: string) {
    await this.sendEmail(
      recipient,
      'Confirm Your Email',
      `
<p>We are happy to have you with <span class="app-name">Sket<span>Cherry</span></span>.
To complete your registration, please confirm your email using the following <a href="${this.configService.get('APP_URL')}/email-confirmation/${token}">link</a>.
It will expire soon and can only be used once.</p>
      `,
    );
  }

  async sendPasswordReset(recipient: Recipient, token: string) {
    await this.sendEmail(
      recipient,
      'Reset Your Password',
      `
<p>To reset your password, please use the following <a href="${this.configService.get('APP_URL')}/password-reset/${token}">link</a>.
It will expire soon and can only be used once. If you did not request this email, feel free to ignore it.</p>
      `,
    );
  }

  async sendAccountDeletion(recipient: Recipient, token: string) {
    await this.sendEmail(
      recipient,
      'Confirm Account Deletion',
      `
<p>We received your request for account deletion. To confirm it, please use the following <a href="${this.configService.get('APP_URL')}/account-deletion/${token}">link</a>.
It will expire soon and can only be used once. If you did not request account deletion or changed your mind, feel free to ignore this email.</p>
      `,
    );
  }
}
