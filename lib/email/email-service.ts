/**
 * Email Service
 *
 * Unified email service that supports multiple providers:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - SMTP
 */

export interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'resend' | 'smtp';
  apiKey?: string;
  from: string;
  region?: string; // For AWS SES
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send an email
   */
  async send(message: EmailMessage): Promise<void> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];

    console.log(`Sending email via ${this.config.provider} to ${recipients.length} recipient(s)`);

    switch (this.config.provider) {
      case 'sendgrid':
        await this.sendViaSendGrid(message);
        break;
      case 'ses':
        await this.sendViaSES(message);
        break;
      case 'resend':
        await this.sendViaResend(message);
        break;
      case 'smtp':
        await this.sendViaSMTP(message);
        break;
      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
    }
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(message: EmailMessage): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    // Dynamic import to avoid loading unnecessary dependencies
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.config.apiKey);

    const msg = {
      to: message.to,
      from: this.config.from,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments?.map((att) => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : att.content,
        type: att.contentType,
        disposition: 'attachment',
      })),
    };

    await sgMail.send(msg);
  }

  /**
   * Send via AWS SES
   */
  private async sendViaSES(message: EmailMessage): Promise<void> {
    if (!this.config.region) {
      throw new Error('AWS SES region not configured');
    }

    // Dynamic import
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

    const client = new SESClient({ region: this.config.region });

    const command = new SendEmailCommand({
      Source: this.config.from,
      Destination: {
        ToAddresses: Array.isArray(message.to) ? message.to : [message.to],
      },
      Message: {
        Subject: {
          Data: message.subject,
        },
        Body: {
          Text: message.text ? { Data: message.text } : undefined,
          Html: message.html ? { Data: message.html } : undefined,
        },
      },
    });

    await client.send(command);
  }

  /**
   * Send via Resend
   */
  private async sendViaResend(message: EmailMessage): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Resend API key not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send via SMTP
   */
  private async sendViaSMTP(message: EmailMessage): Promise<void> {
    if (!this.config.smtpConfig) {
      throw new Error('SMTP configuration not provided');
    }

    // Dynamic import
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransporter(this.config.smtpConfig);

    await transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments,
    });
  }

  /**
   * Send report email
   */
  async sendReport(params: {
    recipients: string[];
    reportName: string;
    reportContent: string;
    reportFormat: string;
    frequency: string;
  }): Promise<void> {
    const isHtml = params.reportFormat === 'html';

    await this.send({
      to: params.recipients,
      subject: `Monitoring Report: ${params.reportName} (${params.frequency})`,
      text: isHtml
        ? `Please view the HTML report attached or in your email client.`
        : params.reportContent,
      html: isHtml ? params.reportContent : undefined,
      attachments: !isHtml
        ? [
            {
              filename: `report.${params.reportFormat}`,
              content: params.reportContent,
              contentType:
                params.reportFormat === 'json'
                  ? 'application/json'
                  : 'text/markdown',
            },
          ]
        : undefined,
    });
  }

  /**
   * Send alert email
   */
  async sendAlert(params: {
    recipients: string[];
    title: string;
    message: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    metadata?: Record<string, any>;
  }): Promise<void> {
    const priorityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '📢',
      low: 'ℹ️',
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .alert { padding: 20px; border-left: 4px solid #f00; background: #fff3cd; }
    .alert.critical { border-color: #dc3545; background: #f8d7da; }
    .alert.high { border-color: #fd7e14; background: #fff3cd; }
    .alert.medium { border-color: #ffc107; background: #fff3cd; }
    .alert.low { border-color: #17a2b8; background: #d1ecf1; }
    .metadata { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="alert ${params.priority}">
    <h2>${priorityEmoji[params.priority]} ${params.title}</h2>
    <p>${params.message}</p>
    ${
      params.metadata
        ? `
    <div class="metadata">
      <strong>Additional Information:</strong><br>
      <pre>${JSON.stringify(params.metadata, null, 2)}</pre>
    </div>
    `
        : ''
    }
  </div>
</body>
</html>
    `;

    await this.send({
      to: params.recipients,
      subject: `${priorityEmoji[params.priority]} [${params.priority.toUpperCase()}] ${params.title}`,
      text: `${params.title}\n\n${params.message}${
        params.metadata
          ? '\n\nMetadata:\n' + JSON.stringify(params.metadata, null, 2)
          : ''
      }`,
      html,
    });
  }
}

/**
 * Create email service from environment variables
 */
export function createEmailService(): EmailService | null {
  const provider = (process.env.EMAIL_PROVIDER || 'sendgrid') as EmailConfig['provider'];
  const from = process.env.EMAIL_FROM || 'monitoring@example.com';

  let config: EmailConfig;

  switch (provider) {
    case 'sendgrid':
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid API key not configured');
        return null;
      }
      config = {
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY,
        from,
      };
      break;

    case 'ses':
      if (!process.env.AWS_REGION) {
        console.warn('AWS SES region not configured');
        return null;
      }
      config = {
        provider: 'ses',
        region: process.env.AWS_REGION,
        from,
      };
      break;

    case 'resend':
      if (!process.env.RESEND_API_KEY) {
        console.warn('Resend API key not configured');
        return null;
      }
      config = {
        provider: 'resend',
        apiKey: process.env.RESEND_API_KEY,
        from,
      };
      break;

    case 'smtp':
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP configuration not complete');
        return null;
      }
      config = {
        provider: 'smtp',
        from,
        smtpConfig: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      };
      break;

    default:
      console.warn(`Unsupported email provider: ${provider}`);
      return null;
  }

  return new EmailService(config);
}
