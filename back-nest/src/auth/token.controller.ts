import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponseDto, RefreshTokenRequestDto } from './dto/auth.dto';

@Controller('api/v1/token')
export class TokenController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh')
  refresh(@Body() request: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    return this.authService.refresh(request.refreshToken);
  }
}
