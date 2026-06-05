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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { parseMultipartJson } from '../common/utils/multipart-json';
import {
  OfficeCreateRequestDto,
  OfficeDto,
  OfficeShortDto,
  OfficeUpdateRequestDto,
} from './dto/office.dto';
import { OfficesService } from './offices.service';

@ApiTags('offices')
@Controller('api/v1/offices')
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Get()
  getAll(): Promise<OfficeDto[]> {
    return this.officesService.getAll();
  }

  @Get(':officeId')
  getById(
    @Param('officeId', ParseIntPipe) officeId: number,
  ): Promise<OfficeShortDto> {
    return this.officesService.getById(officeId);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: OfficeCreateRequestDto })
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 10_485_760 } }))
  async create(
    @Body('data') rawData: unknown,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<OfficeDto> {
    const request = await parseMultipartJson(rawData, OfficeCreateRequestDto);
    return this.officesService.create(request, photo);
  }

  @Patch(':officeId')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: OfficeUpdateRequestDto })
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 10_485_760 } }))
  async update(
    @Param('officeId', ParseIntPipe) officeId: number,
    @Body('data') rawData: unknown,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<OfficeDto> {
    const request = await parseMultipartJson(rawData, OfficeUpdateRequestDto);
    return this.officesService.update(officeId, request, photo);
  }

  @Delete(':officeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('officeId', ParseIntPipe) officeId: number): Promise<void> {
    await this.officesService.delete(officeId);
  }
}
