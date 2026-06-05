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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PageResponse } from '../common/dto/page-response.dto';
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FurnitureCreateRequestDto })
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 10_485_760 } }))
  async create(
    @Body('data') rawData: unknown,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<FurnitureDto> {
    const request = await parseMultipartJson(rawData, FurnitureCreateRequestDto);
    return this.furnitureService.create(request, photo);
  }

  @Post(':floorId')
  place(
    @Param('floorId', ParseIntPipe) floorId: number,
    @Body() request: FurniturePlaceRequestDto,
  ): Promise<FurnitureDto> {
    return this.furnitureService.placeFurniture(floorId, request);
  }

  @Patch('move/:furnitureId')
  move(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
    @Body() request: FurnitureMoveRequestDto,
  ): Promise<FurnitureDto> {
    return this.furnitureService.move(furnitureId, request);
  }

  @Patch('ui/:furnitureId')
  updateUi(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
    @Body() request: FurniturePatchUiRequestDto,
  ): Promise<FurnitureDto> {
    return this.furnitureService.updateUi(furnitureId, request);
  }

  @Patch(':furnitureId')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FurniturePatchRequestDto })
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 10_485_760 } }))
  async update(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
    @Body('data') rawData: unknown,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<FurnitureDto> {
    const request = await parseMultipartJson(rawData, FurniturePatchRequestDto);
    return this.furnitureService.update(furnitureId, request, photo);
  }

  @Delete(':furnitureId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('furnitureId', ParseIntPipe) furnitureId: number,
  ): Promise<void> {
    await this.furnitureService.deleteFurniture(furnitureId);
  }
}
