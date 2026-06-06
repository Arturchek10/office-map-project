import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../auth/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user';
import {
  LayerCreateRequestDto,
  LayerDto,
  LayerUpdateRequestDto,
} from './dto/layer.dto';
import { LayersService } from './layers.service';

@ApiTags('layers')
@Controller('api/v1/layers')
export class LayersController {
  constructor(private readonly layersService: LayersService) {}

  @Post(':floorId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Param('floorId', ParseIntPipe) floorId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: LayerCreateRequestDto,
  ): Promise<LayerDto> {
    return this.layersService.create(floorId, request, user);
  }

  @Get(':layerId')
  getById(@Param('layerId', ParseIntPipe) layerId: number): Promise<LayerDto> {
    return this.layersService.getById(layerId);
  }

  @Patch(':layerId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('layerId', ParseIntPipe) layerId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: LayerUpdateRequestDto,
  ): Promise<LayerDto> {
    return this.layersService.update(layerId, request, user);
  }

  @Delete(':layerId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('layerId', ParseIntPipe) layerId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.layersService.delete(layerId, user);
  }
}
