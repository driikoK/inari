import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ROLE } from '../users/enums/index.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';

@Injectable()
export class CuratorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: ValidatedUser }>();

    if (user?.role !== ROLE.ADMIN && user?.role !== ROLE.DIRECTOR) {
      throw new ForbiddenException('Недостатньо прав');
    }

    return true;
  }
}
