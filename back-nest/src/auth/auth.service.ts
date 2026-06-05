import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  AuthResponseDto,
  SignInRequestDto,
  SignUpRequestDto,
} from './dto/auth.dto';
import { UserEntity } from './entities/user.entity';
import { AuthUser } from './types/auth-user';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly jwtSecret = 'office-map-dev-secret';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(request: SignUpRequestDto): Promise<AuthResponseDto> {
    const exists = await this.userRepository.findOne({
      where: { email: request.email },
    });

    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      email: request.email,
      name: request.name,
      password: await bcrypt.hash(request.password, this.saltRounds),
      role: 'USER',
    });

    const saved = await this.userRepository.save(user);
    return this.issueTokens(saved);
  }

  async signIn(request: SignInRequestDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: request.email },
      select: ['id', 'email', 'name', 'password', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      request.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid password');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let payload: AuthUser;

    try {
      payload = await this.jwtService.verifyAsync<AuthUser>(refreshToken, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.userRepository.findOne({
      where: { id: Number(payload.sub) },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueTokens(user);
  }

  private async issueTokens(user: UserEntity): Promise<AuthResponseDto> {
    const subject = String(user.id);
    const tokenPayload = {
      sub: subject,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      token: await this.jwtService.signAsync(tokenPayload, {
        secret: this.jwtSecret,
        expiresIn: '15m',
      }),
      refreshToken: await this.jwtService.signAsync(
        { sub: subject },
        {
          secret: this.jwtSecret,
          expiresIn: '7d',
        },
      ),
    };
  }
}
