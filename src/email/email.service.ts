import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  // Método privado que efetivamente chama a API da Brevo. Os métodos
  // públicos abaixo só montam o assunto e o corpo do e-mail e chamam este.
  private async sendEmail(to: string, subject: string, htmlContent: string) {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': this.config.get<string>('BREVO_API_KEY') ?? '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: 'contatoarchvrooms@gmail.com', name: 'Archv Rooms' },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Brevo error: ${JSON.stringify(error)}`);
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string) {
    await this.sendEmail(
      email,
      'Redefinição de senha — Archv Rooms',
      `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Redefinição de senha</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background-color:#000;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Redefinir senha</a>
        <p>Este link expira em <strong>1 hora</strong>.</p>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      </div>`,
    );
  }

  async sendVerificationEmail(email: string, verifyLink: string) {
    await this.sendEmail(
      email,
      'Verificação de e-mail — Archv Rooms',
      `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Verificação de e-mail</h2>
        <p>Obrigado por se cadastrar no Archv Rooms!</p>
        <p>Clique no botão abaixo para verificar seu e-mail:</p>
        <a href="${verifyLink}" style="display:inline-block;padding:12px 24px;background-color:#000;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Verificar e-mail</a>
        <p>Se você não criou uma conta, ignore este e-mail.</p>
      </div>`,
    );
  }

  async sendWelcomeEmail(email: string, name: string) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL');

    await this.sendEmail(
      email,
      'Bem-vindo ao Archv Rooms!',
      `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Bem-vindo, ${name}!</h2>
        <p>Sua conta no Archv Rooms foi criada com sucesso.</p>
        <p>Acesse a plataforma e explore nossos jogos retrô:</p>
        <a href="${frontendUrl}/library" style="display:inline-block;padding:12px 24px;background-color:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Explorar jogos</a>
        <p>Se precisar de ajuda, entre em contato: contatoarchvrooms@gmail.com</p>
      </div>`,
    );
  }
}
