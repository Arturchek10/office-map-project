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
  create(
    @Param('officeId', ParseIntPipe) officeId: number,
    @Body() request: FloorCreateRequestDto,
  ): Promise<FloorViewDto> {
    return this.floorsService.create(officeId, request);
  }

  @Patch(':floorId')
  update(
    @Param('floorId', ParseIntPipe) floorId: number,
    @Body() request: FloorUpdateRequestDto,
  ): Promise<FloorViewDto> {
    return this.floorsService.update(floorId, request);
  }

  @Patch('plan/:floorId')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FloorPlanPatchRequestDto })
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 10_485_760 } }))
  async uploadPlan(
    @Param('floorId', ParseIntPipe) floorId: number,
    @Body('data') rawData: unknown,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<FloorViewDto> {
    const request = await parseMultipartJson(rawData, FloorPlanPatchRequestDto);
    return this.floorsService.updatePlan(floorId, request, photo);
  }

  @Delete(':floorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('floorId', ParseIntPipe) floorId: number): Promise<void> {
    await this.floorsService.delete(floorId);
  }
}
