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
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  MultipartFiles,
  resolveMultipartDataField,
} from '../common/utils/multipart-data';
import { parseMultipartJson } from '../common/utils/multipart-json';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../auth/entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/types/auth-user';
import {
  FloorCreateRequestDto,
  FloorPlanPatchRequestDto,
  FloorUpdateRequestDto,
  FloorViewDto,
} from './dto/floor.dto';
import { FloorsService } from './floors.service';

@ApiTags('floors')
@Controller('api/v1/floors')
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Get(':floorId')
  getFloor(
    @Param('floorId', ParseIntPipe) floorId: number,
  ): Promise<FloorViewDto> {
    return this.floorsService.getFloorView(floorId);
  }

  @Post(':officeId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Param('officeId', ParseIntPipe) officeId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: FloorCreateRequestDto,
  ): Promise<FloorViewDto> {
    return this.floorsService.create(officeId, request, user);
  }

  @Patch(':floorId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('floorId', ParseIntPipe) floorId: number,
    @CurrentUser() user: AuthUser,
    @Body() request: FloorUpdateRequestDto,
  ): Promise<FloorViewDto> {
    return this.floorsService.update(floorId, request, user);
  }

  @Patch('plan/:floorId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FloorPlanPatchRequestDto })
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
  async uploadPlan(
    @Param('floorId', ParseIntPipe) floorId: number,
    @CurrentUser() user: AuthUser,
    @Body('data') rawData: unknown,
    @UploadedFiles() files?: MultipartFiles,
  ): Promise<FloorViewDto> {
    const request = await parseMultipartJson(
      resolveMultipartDataField(rawData, files),
      FloorPlanPatchRequestDto,
    );
    const photo = files?.photo?.[0];
    return this.floorsService.updatePlan(floorId, request, user, photo);
  }

  @Delete(':floorId')
  @Roles(RoleName.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('floorId', ParseIntPipe) floorId: number,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.floorsService.delete(floorId, user);
  }
}
