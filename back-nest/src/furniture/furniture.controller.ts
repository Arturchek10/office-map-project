import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PageResponse } from '../common/dto/page-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../auth/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user';
import {
  MultipartFiles,
  resolveMultipartDataField,
} from '../common/utils/multipart-data';
import { parseMultipartJson } from '../common/utils/multipart-json';
import {
  FurnitureCreateRequestDto,
  FurnitureDto,
  FurnitureMoveRequestDto,
  FurniturePatchRequestDto,
  FurniturePatchUiRequestDto,
  FurniturePlaceRequestDto,
  FurnitureShortDto,
} from './dto/furniture.dto';
import { FurnitureService } from './furniture.service';

@ApiTags('furniture')
@Controller('api/v1/furniture')
export class FurnitureController {
  constructor(private readonly furnitureService: FurnitureService) {}

  @Get('catalog')
  getFurnitureCatalog(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ): Promise<PageResponse<FurnitureShortDto>> {
    return this.furnitureService.getCatalog(page, size);
  }

  @Get(':furnitureId')
  getFurniture(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
  ): Promise<FurnitureDto> {
    return this.furnitureService.getFurnitureById(furnitureId);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FurnitureCreateRequestDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'photo', maxCount: 1 },
        { name: 'data', maxCount: 1 },
      ],
      {
        limits: { fileSize: 10_485_760 },
      },
    ),
  )
  async create(
    @Body('data') rawData: unknown,
    @UploadedFiles() files?: MultipartFiles,
  ): Promise<FurnitureDto> {
    const request = await parseMultipartJson(
      resolveMultipartDataField(rawData, files),
      FurnitureCreateRequestDto,
    );
    const photo = files?.photo?.[0];
    return this.furnitureService.create(request, photo);
  }

  @Post(':floorId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  place(
    @Param('floorId', ParseIntPipe) floorId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: FurniturePlaceRequestDto,
  ): Promise<FurnitureDto> {
    return this.furnitureService.placeFurniture(floorId, request, user);
  }

  @Patch('move/:furnitureId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  move(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: FurnitureMoveRequestDto,
  ): Promise<FurnitureDto> {
    return this.furnitureService.move(furnitureId, request, user);
  }

  @Patch('ui/:furnitureId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateUi(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: FurniturePatchUiRequestDto,
  ): Promise<FurnitureDto> {
    return this.furnitureService.updateUi(furnitureId, request, user);
  }

  @Patch(':furnitureId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FurniturePatchRequestDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'photo', maxCount: 1 },
        { name: 'data', maxCount: 1 },
      ],
      {
        limits: { fileSize: 10_485_760 },
      },
    ),
  )
  async update(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
    @CurrentUser() user: AuthUser,
    @Body('data') rawData: unknown,
    @UploadedFiles() files?: MultipartFiles,
  ): Promise<FurnitureDto> {
    const request = await parseMultipartJson(
      resolveMultipartDataField(rawData, files),
      FurniturePatchRequestDto,
    );
    const photo = files?.photo?.[0];
    return this.furnitureService.update(furnitureId, request, user, photo);
  }

  @Delete(':furnitureId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.furnitureService.deleteFurniture(furnitureId, user);
  }
}
