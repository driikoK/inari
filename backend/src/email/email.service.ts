import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import nodemailer from 'nodemailer';
import type { AppConfig } from '../config/configuration.js';

type Transport = ReturnType<typeof nodemailer.createTransport>;
type MailOptions = Parameters<Transport['sendMail']>[0];

@Injectable()
export class EmailService {
  private readonly nodemailerTransport: Transport;
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService<AppConfig, true>,
  ) {
    const { user, pass } = config.get('mailer', { infer: true });

    this.nodemailerTransport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  private sendMail(options: MailOptions) {
    return this.nodemailerTransport.sendMail(options);
  }

  public async sendResetPasswordLink(email: string): Promise<void> {
    const payload = { email };

    const token = this.jwtService.sign(payload, {
      secret: this.config.get('auth.jwtSecret', { infer: true }),
      expiresIn: '1h',
    });

    const user = await this.usersService.findOneByEmail(email);
    if (!user) throw new NotFoundException(`No user found`);

    const url = `${this.config.get('app.cors', { infer: true })}/reset/${token}`;
    const text = `Привіт! \nЩоб скинути пароль перейди за посиланням: ${url}`;

    return this.sendMail({
      to: email,
      subject: 'Reset password',
      text,
    });
  }

  public async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.config.get('auth.jwtSecret', { infer: true }),
      });

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }

      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }
      throw new BadRequestException('Bad confirmation token');
    }
  }
}
