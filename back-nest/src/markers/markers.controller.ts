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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  createMarker(
    @Param('layerId', ParseIntPipe) layerId: number,
    @Body() request: CreateMarkerRequestDto,
  ): Promise<MarkerDto> {
    return this.markersService.createMarker(layerId, request);
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

  @Patch(':markerId')
  updateMarker(
    @Param('markerId', ParseIntPipe) markerId: number,
    @Body() request: UpdateMarkerRequestDto,
  ): Promise<MarkerDto> {
    return this.markersService.update(markerId, request);
  }

  @Patch('move/:markerId')
  moveMarker(
    @Param('markerId', ParseIntPipe) markerId: number,
    @Body() request: MarkerMoveRequestDto,
  ): Promise<MarkerDto> {
    return this.markersService.moveMarker(markerId, request);
  }

  @Delete(':markerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMarker(
    @Param('markerId', ParseIntPipe) markerId: number,
  ): Promise<void> {
    await this.markersService.delete(markerId);
  }
}
