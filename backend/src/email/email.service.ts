import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@users/users.service';
import * as nodemailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private readonly nodemailerTransport: Mail;
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    this.nodemailerTransport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
      },
    });
  }

  private sendMail(options: Mail.Options) {
    return this.nodemailerTransport.sendMail(options);
  }

  public async sendResetPasswordLink(email: string): Promise<void> {
    const payload = { email };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: '1h',
    });

    const user = await this.usersService.findOneByEmail(email);
    if (!user) throw new NotFoundException(`No user found`);

    const url = `${process.env.CORS}/reset/${token}`;
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
        secret: process.env.JWT_SECRET_KEY,
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
