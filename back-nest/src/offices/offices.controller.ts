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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  MultipartFiles,
  resolveMultipartDataField,
} from '../common/utils/multipart-data';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { parseMultipartJson } from '../common/utils/multipart-json';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../auth/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user';
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
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: OfficeCreateRequestDto })
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
    @CurrentUser() user: AuthUser,
    @Body('data') rawData: unknown,
    @UploadedFiles() files?: MultipartFiles,
  ): Promise<OfficeDto> {
    const request = await parseMultipartJson(
      resolveMultipartDataField(rawData, files),
      OfficeCreateRequestDto,
    );
    const photo = files?.photo?.[0];
    return this.officesService.create(request, Number(user.sub), photo);
  }

  @Patch(':officeId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: OfficeUpdateRequestDto })
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
    @Param('officeId', ParseIntPipe) officeId: number,
    @CurrentUser() user: AuthUser,
    @Body('data') rawData: unknown,
    @UploadedFiles() files?: MultipartFiles,
  ): Promise<OfficeDto> {
    const request = await parseMultipartJson(
      resolveMultipartDataField(rawData, files),
      OfficeUpdateRequestDto,
    );
    const photo = files?.photo?.[0];
    return this.officesService.update(officeId, request, user, photo);
  }

  @Delete(':officeId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('officeId', ParseIntPipe) officeId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.officesService.delete(officeId, user);
  }
}
