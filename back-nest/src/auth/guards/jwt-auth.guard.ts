import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { AuthUser } from '../types/auth-user';

type RequestWithUser = Request & { user?: AuthUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtSecret = 'office-map-dev-secret';

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('User is not authorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: this.jwtSecret,
      });

      const user = await this.userRepository.findOne({
        where: { id: Number(payload.sub) },
        relations: { role: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (user.bannedAt) {
        throw new UnauthorizedException('User is blocked');
      }

      request.user = {
        ...payload,
        email: user.email,
        name: user.name,
        role: user.role.name,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token expired');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
