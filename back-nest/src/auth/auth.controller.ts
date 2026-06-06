import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  MeResponseDto,
  RefreshTokenRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from './types/auth-user';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  signUp(@Body() request: SignUpRequestDto): Promise<AuthResponseDto> {
    return this.authService.signUp(request);
  }

  @Post('sign-in')
  signIn(@Body() request: SignInRequestDto): Promise<AuthResponseDto> {
    return this.authService.signIn(request);
  }

  @Post('refresh')
  refresh(@Body() request: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    return this.authService.refresh(request.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): Promise<MeResponseDto> {
    return this.authService.getMe(Number(user.sub));
  }
}
