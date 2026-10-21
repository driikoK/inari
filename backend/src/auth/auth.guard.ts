import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { IncomingHttpHeaders } from 'node:http';
import type { AppConfig } from '../config/configuration.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService<AppConfig, true>,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: { username?: string };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('auth.jwtSecret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException();
    }

    const user =
      payload.username &&
      (await this.usersService.findOneByUsername(payload.username));

    if (!user) {
      throw new UnauthorizedException();
    }

    request['user'] = user;

    return true;
  }

  private extractTokenFromHeader(request: {
    headers: IncomingHttpHeaders;
  }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
