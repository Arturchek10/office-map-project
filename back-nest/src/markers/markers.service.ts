import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applyPoint } from '../common/utils/point';
import { AuthUser } from '../auth/types/auth-user';
import { LayerEntity } from '../layers/entities/layer.entity';
import { OfficesService } from '../offices/offices.service';
import { LocalFileStorageService } from '../storage/storage.service';
import {
  CreateMarkerRequestDto,
  MarkerDto,
  MarkerMoveRequestDto,
  UpdateMarkerRequestDto,
} from './dto/marker.dto';
import { MarkerEntity, MarkerType } from './entities/marker.entity';
import { MarkerPhotoEntity } from './entities/marker-photo.entity';
import { toMarkerDto } from './markers.mapper';

@Injectable()
export class MarkersService {
  constructor(
    @InjectRepository(MarkerEntity)
    private readonly markerRepository: Repository<MarkerEntity>,
    @InjectRepository(MarkerPhotoEntity)
    private readonly markerPhotoRepository: Repository<MarkerPhotoEntity>,
    @InjectRepository(LayerEntity)
    private readonly layerRepository: Repository<LayerEntity>,
    private readonly officesService: OfficesService,
    private readonly storage: LocalFileStorageService,
  ) {}

  async createMarker(
    layerId: number,
    request: CreateMarkerRequestDto,
    user: AuthUser,
  ): Promise<MarkerDto> {
    const layer = await this.layerRepository.findOne({
      where: { id: layerId },
      relations: { floor: true },
    });

    if (!layer) {
      throw new NotFoundException(`Layer with id=${layerId} not found`);
    }
    await this.officesService.assertCanManageOffice(layer.floor.officeId, user);

    const marker = this.markerRepository.create({
      type: this.parseType(request.type),
      layer,
      layerId,
      pricePerHour: request.pricePerHour ?? 0,
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
      .leftJoinAndSelect('marker.photos', 'photo')
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
    user: AuthUser,
  ): Promise<MarkerDto> {
    const marker = await this.findEntity(markerId);
    await this.officesService.assertCanManageOffice(
      this.getMarkerOfficeId(marker),
      user,
    );
    const nextType = this.parseType(request.type);

    marker.name = request.name;
    marker.type = nextType;

    if (request.pricePerHour !== undefined) {
      marker.pricePerHour = request.pricePerHour;
    }

    if (request.uncomfortable !== undefined) {
      marker.uncomfortable = request.uncomfortable;
    }

    if (request.payload !== undefined) {
      marker.payload = this.normalizePayload(request.payload);
    }

    const saved = await this.markerRepository.save(marker);
    return this.toDto(saved);
  }

  async moveMarker(
    markerId: number,
    request: MarkerMoveRequestDto,
    user: AuthUser,
  ): Promise<MarkerDto> {
    const marker = await this.findEntity(markerId);
    await this.officesService.assertCanManageOffice(
      this.getMarkerOfficeId(marker),
      user,
    );
    applyPoint(marker, request.position);
    return this.toDto(await this.markerRepository.save(marker));
  }

  async delete(markerId: number, user: AuthUser): Promise<void> {
    const marker = await this.findEntity(markerId);
    await this.officesService.assertCanManageOffice(
      this.getMarkerOfficeId(marker),
      user,
    );
    await Promise.all(
      (marker.photos ?? []).map((photo) => this.storage.deleteImage(photo.photoKey)),
    );
    await this.markerRepository.remove(marker);
  }

  async addPhotos(
    markerId: number,
    user: AuthUser,
    photos: Express.Multer.File[] = [],
  ): Promise<MarkerDto> {
    const marker = await this.findEntity(markerId);
    await this.officesService.assertCanManageOffice(
      this.getMarkerOfficeId(marker),
      user,
    );
    if (photos.length === 0) {
      throw new BadRequestException('At least one photo is required');
    }

    const currentCount = await this.markerPhotoRepository.count({
      where: { markerId },
    });

    const savedPhotos = await Promise.all(
      photos.map(async (photo, index) =>
        this.markerPhotoRepository.create({
          markerId,
          marker,
          photoKey: await this.storage.uploadImage(photo, 'markers'),
          sortOrder: currentCount + index,
        }),
      ),
    );

    await this.markerPhotoRepository.save(savedPhotos);
    return this.getMarkerById(markerId);
  }

  async deletePhoto(
    markerId: number,
    photoId: number,
    user: AuthUser,
  ): Promise<MarkerDto> {
    const marker = await this.findEntity(markerId);
    await this.officesService.assertCanManageOffice(
      this.getMarkerOfficeId(marker),
      user,
    );

    const photo = await this.markerPhotoRepository.findOne({
      where: { id: photoId, markerId },
    });
    if (!photo) {
      throw new NotFoundException(`Marker photo with id=${photoId} not found`);
    }

    await this.storage.deleteImage(photo.photoKey);
    await this.markerPhotoRepository.remove(photo);
    return this.getMarkerById(markerId);
  }

  async findEntity(markerId: number): Promise<MarkerEntity> {
    const marker = await this.markerRepository.findOne({
      where: { id: markerId },
      relations: { layer: { floor: true }, photos: true },
    });

    if (!marker) {
      throw new NotFoundException(`Marker with id=${markerId} not found`);
    }

    return marker;
  }

  private async toDto(marker: MarkerEntity): Promise<MarkerDto> {
    return toMarkerDto(marker, this.storage);
  }

  private normalizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );
  }

  private getMarkerOfficeId(marker: MarkerEntity): number {
    if (!marker.layer?.floor) {
      throw new NotFoundException(`Office for marker id=${marker.id} not found`);
    }

    return marker.layer.floor.officeId;
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
