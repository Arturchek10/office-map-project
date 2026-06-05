import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  RefreshTokenRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
} from './dto/auth.dto';

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
}
