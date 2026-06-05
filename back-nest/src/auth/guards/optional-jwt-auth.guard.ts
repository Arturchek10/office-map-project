import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser } from '../types/auth-user';

type RequestWithUser = Request & { user?: AuthUser };

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  private readonly jwtSecret = 'office-map-dev-secret';

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      return true;
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: this.jwtSecret,
      });
    } catch {
      request.user = undefined;
    }

    return true;
  }
}
