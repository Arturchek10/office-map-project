import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applyPoint } from '../common/utils/point';
import { DescriptionsService } from '../descriptions/descriptions.service';
import { LayerEntity } from '../layers/entities/layer.entity';
import {
  CreateMarkerRequestDto,
  MarkerDto,
  MarkerMoveRequestDto,
  MarkerTypeValue,
  UpdateMarkerRequestDto,
} from './dto/marker.dto';
import { MarkerEntity, MarkerType } from './entities/marker.entity';
import { toMarkerDto } from './markers.mapper';

@Injectable()
export class MarkersService {
  constructor(
    @InjectRepository(MarkerEntity)
    private readonly markerRepository: Repository<MarkerEntity>,
    @InjectRepository(LayerEntity)
    private readonly layerRepository: Repository<LayerEntity>,
    private readonly descriptionsService: DescriptionsService,
  ) {}

  async createMarker(
    layerId: number,
    request: CreateMarkerRequestDto,
  ): Promise<MarkerDto> {
    const layer = await this.layerRepository.findOne({ where: { id: layerId } });

    if (!layer) {
      throw new NotFoundException(`Layer with id=${layerId} not found`);
    }

    const marker = this.markerRepository.create({
      type: this.parseType(request.type),
      layer,
      layerId,
      uncomfortable: false,
    });

    applyPoint(marker, request.position ?? this.defaultPosition());

    const saved = await this.markerRepository.save(marker);
    return this.toDto(saved);
  }

  async getByLayerWithFilter(
    layerId: number,
    hideUncomfortable: boolean,
  ): Promise<MarkerDto[]> {
    const markers = await this.markerRepository
      .createQueryBuilder('marker')
      .where('marker.layer_id = :layerId', { layerId })
      .andWhere(
        hideUncomfortable ? 'COALESCE(marker.is_uncomfortable, false) = false' : '1=1',
      )
      .orderBy('marker.id', 'ASC')
      .getMany();

    return Promise.all(markers.map((marker) => this.toDto(marker)));
  }

  async getMarkerById(markerId: number): Promise<MarkerDto> {
    return this.toDto(await this.findEntity(markerId));
  }

  async update(
    markerId: number,
    request: UpdateMarkerRequestDto,
  ): Promise<MarkerDto> {
    const marker = await this.findEntity(markerId);
    const previousType = marker.type ? (marker.type as MarkerTypeValue) : null;
    const nextType = this.parseType(request.type);

    marker.name = request.name;
    marker.type = nextType;

    if (request.uncomfortable !== undefined) {
      marker.uncomfortable = request.uncomfortable;
    }

    if (request.payload !== undefined) {
      const description = await this.descriptionsService.savePayload(
        marker.descriptionId ?? null,
        previousType,
        nextType,
        request.payload,
      );
      marker.description = description;
      marker.descriptionId = description.id;
    }

    const saved = await this.markerRepository.save(marker);
    return this.toDto(saved);
  }

  async moveMarker(
    markerId: number,
    request: MarkerMoveRequestDto,
  ): Promise<MarkerDto> {
    const marker = await this.findEntity(markerId);
    applyPoint(marker, request.position);
    return this.toDto(await this.markerRepository.save(marker));
  }

  async delete(markerId: number): Promise<void> {
    const marker = await this.findEntity(markerId);
    const descriptionId = marker.descriptionId;
    await this.markerRepository.remove(marker);
    await this.descriptionsService.removeDescription(descriptionId);
  }

  async findEntity(markerId: number): Promise<MarkerEntity> {
    const marker = await this.markerRepository.findOne({
      where: { id: markerId },
      relations: { description: true, layer: true },
    });

    if (!marker) {
      throw new NotFoundException(`Marker with id=${markerId} not found`);
    }

    return marker;
  }

  private async toDto(marker: MarkerEntity): Promise<MarkerDto> {
    const payload = await this.descriptionsService.getPayload(
      marker.descriptionId ?? null,
      marker.type ? (marker.type as MarkerTypeValue) : null,
    );
    return toMarkerDto(marker, payload);
  }

  private parseType(type: string): MarkerType {
    const normalized = type.toLowerCase();
    if (!Object.values(MarkerType).includes(normalized as MarkerType)) {
      throw new BadRequestException(`Unsupported marker type=${type}`);
    }
    return normalized as MarkerType;
  }

  private defaultPosition() {
    return {
      position_x: 0,
      position_y: 0,
    };
  }
}
