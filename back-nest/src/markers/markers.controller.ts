import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../auth/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user';
import {
  CreateMarkerRequestDto,
  MarkerDto,
  MarkerMoveRequestDto,
  UpdateMarkerRequestDto,
} from './dto/marker.dto';
import { MarkersService } from './markers.service';

@ApiTags('markers')
@Controller('api/v1/markers')
export class MarkersController {
  constructor(private readonly markersService: MarkersService) {}

  @Post(':layerId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createMarker(
    @Param('layerId', ParseIntPipe) layerId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: CreateMarkerRequestDto,
  ): Promise<MarkerDto> {
    return this.markersService.createMarker(layerId, request, user);
  }

  @Get('all/:layerId')
  getMarkers(
    @Param('layerId', ParseIntPipe) layerId: number,
    @Query('hideUncomfortable', new ParseBoolPipe({ optional: true }))
    hideUncomfortable = false,
  ): Promise<MarkerDto[]> {
    return this.markersService.getByLayerWithFilter(
      layerId,
      hideUncomfortable,
    );
  }

  @Get(':markerId')
  getMarker(@Param('markerId', ParseIntPipe) markerId: number): Promise<MarkerDto> {
    return this.markersService.getMarkerById(markerId);
  }

  @Post(':markerId/photos')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photo', maxCount: 10 }], {
      limits: { fileSize: 10_485_760 },
    }),
  )
  addPhotos(
    @Param('markerId', ParseIntPipe) markerId: number,
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files?: { photo?: Express.Multer.File[] },
  ): Promise<MarkerDto> {
    return this.markersService.addPhotos(markerId, user, files?.photo ?? []);
  }

  @Patch(':markerId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateMarker(
    @Param('markerId', ParseIntPipe) markerId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: UpdateMarkerRequestDto,
  ): Promise<MarkerDto> {
    return this.markersService.update(markerId, request, user);
  }

  @Patch('move/:markerId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  moveMarker(
    @Param('markerId', ParseIntPipe) markerId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: MarkerMoveRequestDto,
  ): Promise<MarkerDto> {
    return this.markersService.moveMarker(markerId, request, user);
  }

  @Delete(':markerId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMarker(
    @Param('markerId', ParseIntPipe) markerId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.markersService.delete(markerId, user);
  }

  @Delete(':markerId/photos/:photoId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deletePhoto(
    @Param('markerId', ParseIntPipe) markerId: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<MarkerDto> {
    return this.markersService.deletePhoto(markerId, photoId, user);
  }
}
