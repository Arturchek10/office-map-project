import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser } from '../types/auth-user';

type RequestWithUser = Request & { user?: AuthUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtSecret = 'office-map-dev-secret';

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('User is not authorized');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: this.jwtSecret,
      });
      return true;
    } catch {
      throw new UnauthorizedException('Token expired');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
