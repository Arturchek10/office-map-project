import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  AuthResponseDto,
  MeResponseDto,
  SignInRequestDto,
  SignUpRequestDto,
} from './dto/auth.dto';
import { RoleEntity, RoleName } from './entities/role.entity';
import { UserEntity } from './entities/user.entity';
import { AuthUser } from './types/auth-user';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly jwtSecret = 'office-map-dev-secret';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(request: SignUpRequestDto): Promise<AuthResponseDto> {
    const exists = await this.userRepository.findOne({
      where: { email: request.email },
    });

    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.getRole(RoleName.USER);
    const user = this.userRepository.create({
      email: request.email,
      name: request.name,
      password: await bcrypt.hash(request.password, this.saltRounds),
      role,
      roleId: role.id,
    });

    const saved = await this.userRepository.save(user);
    return this.issueTokens(saved);
  }

  async signIn(request: SignInRequestDto): Promise<AuthResponseDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect('user.password')
      .where('LOWER(user.email) = LOWER(:email)', { email: request.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.bannedAt) {
      throw new UnauthorizedException('User is blocked');
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
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.bannedAt) {
      throw new UnauthorizedException('User is blocked');
    }

    return this.issueTokens(user);
  }

  async getMe(userId: number): Promise<MeResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.bannedAt) {
      throw new UnauthorizedException('User is blocked');
    }

    return {
      id: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role.name,
    };
  }

  private async issueTokens(user: UserEntity): Promise<AuthResponseDto> {
    const subject = String(user.id);
    const roleName = user.role?.name ?? (await this.getUserRoleName(user.id));
    const tokenPayload = {
      sub: subject,
      email: user.email,
      name: user.name,
      role: roleName,
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

  private async getRole(name: RoleName): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) {
      throw new InternalServerErrorException(
        `Role dictionary is not initialized: ${name}`,
      );
    }
    return role;
  }

  private async getUserRoleName(userId: number): Promise<RoleName> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user?.role) {
      throw new InternalServerErrorException(
        `Role for user id=${userId} is not assigned`,
      );
    }

    return user.role.name;
  }
}
