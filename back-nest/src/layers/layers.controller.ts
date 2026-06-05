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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  create(
    @Param('floorId', ParseIntPipe) floorId: number,
    @Body() request: LayerCreateRequestDto,
  ): Promise<LayerDto> {
    return this.layersService.create(floorId, request);
  }

  @Get(':layerId')
  getById(@Param('layerId', ParseIntPipe) layerId: number): Promise<LayerDto> {
    return this.layersService.getById(layerId);
  }

  @Patch(':layerId')
  update(
    @Param('layerId', ParseIntPipe) layerId: number,
    @Body() request: LayerUpdateRequestDto,
  ): Promise<LayerDto> {
    return this.layersService.update(layerId, request);
  }

  @Delete(':layerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('layerId', ParseIntPipe) layerId: number): Promise<void> {
    await this.layersService.delete(layerId);
  }
}
