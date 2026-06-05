import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageResponse, toPageResponse } from '../common/dto/page-response.dto';
import { applyPoint } from '../common/utils/point';
import { FloorEntity } from '../floors/entities/floor.entity';
import { LocalFileStorageService } from '../storage/storage.service';
import {
  FurnitureCreateRequestDto,
  FurnitureDto,
  FurnitureMoveRequestDto,
  FurniturePatchRequestDto,
  FurniturePatchUiRequestDto,
  FurniturePlaceRequestDto,
  FurnitureShortDto,
} from './dto/furniture.dto';
import { FurnitureEntity } from './entities/furniture.entity';
import { toFurnitureDto, toFurnitureShortDto } from './furniture.mapper';

@Injectable()
export class FurnitureService {
  constructor(
    @InjectRepository(FurnitureEntity)
    private readonly furnitureRepository: Repository<FurnitureEntity>,
    @InjectRepository(FloorEntity)
    private readonly floorRepository: Repository<FloorEntity>,
    private readonly storage: LocalFileStorageService,
  ) {}

  async getFurnitureById(furnitureId: number): Promise<FurnitureDto> {
    return toFurnitureDto(await this.findEntity(furnitureId), this.storage);
  }

  async getCatalog(
    page: number,
    size: number,
  ): Promise<PageResponse<FurnitureShortDto>> {
    const safePage = Math.max(0, page);
    const safeSize = Math.max(1, Math.min(size, 100));

    const query = this.furnitureRepository
      .createQueryBuilder('furniture')
      .where(
        `furniture.id IN (
          SELECT MIN(ff.id)
          FROM furniture ff
          GROUP BY LOWER(ff.name)
        )`,
      )
      .orderBy('furniture.id', 'ASC')
      .skip(safePage * safeSize)
      .take(safeSize);

    const [items, total] = await query.getManyAndCount();
    return toPageResponse(
      items.map((item) => toFurnitureShortDto(item, this.storage)),
      total,
      safePage,
      safeSize,
    );
  }

  async create(
    request: FurnitureCreateRequestDto,
    photo?: Express.Multer.File,
  ): Promise<FurnitureDto> {
    if (await this.existsByName(request.name)) {
      throw new ConflictException(
        `Furniture with name ${request.name} already exists`,
      );
    }

    if (!photo || photo.size === 0) {
      throw new BadRequestException('Photo is required');
    }

    const furniture = this.furnitureRepository.create({
      name: request.name,
      photoKey: await this.storage.uploadImage(photo),
      angle: 0,
      sizeFactor: 1,
    });

    return toFurnitureDto(
      await this.furnitureRepository.save(furniture),
      this.storage,
    );
  }

  async placeFurniture(
    floorId: number,
    request: FurniturePlaceRequestDto,
  ): Promise<FurnitureDto> {
    const floor = await this.floorRepository.findOne({ where: { id: floorId } });

    if (!floor) {
      throw new NotFoundException(`Floor with id=${floorId} not found`);
    }

    const photoKey = this.storage.extractObjectKeyFromUrl(request.photoUrl);

    if (!photoKey) {
      throw new BadRequestException('Cannot extract photo key from provided photoUrl');
    }

    const furniture = this.furnitureRepository.create({
      name: request.name,
      photoKey,
      angle: 0,
      sizeFactor: 1,
      floor,
      floorId,
    });
    applyPoint(furniture, request.position);

    return toFurnitureDto(
      await this.furnitureRepository.save(furniture),
      this.storage,
    );
  }

  async move(
    furnitureId: number,
    request: FurnitureMoveRequestDto,
  ): Promise<FurnitureDto> {
    const furniture = await this.findEntity(furnitureId);
    applyPoint(furniture, request.position);
    return toFurnitureDto(
      await this.furnitureRepository.save(furniture),
      this.storage,
    );
  }

  async updateUi(
    furnitureId: number,
    request: FurniturePatchUiRequestDto,
  ): Promise<FurnitureDto> {
    const furniture = await this.findEntity(furnitureId);

    if (request.angle !== undefined) {
      furniture.angle = request.angle;
    }
    if (request.sizeFactor !== undefined) {
      furniture.sizeFactor = request.sizeFactor;
    }

    return toFurnitureDto(
      await this.furnitureRepository.save(furniture),
      this.storage,
    );
  }

  async update(
    furnitureId: number,
    request: FurniturePatchRequestDto,
    photo?: Express.Multer.File,
  ): Promise<FurnitureDto> {
    const furniture = await this.findEntity(furnitureId);

    if (request.name !== undefined) {
      furniture.name = request.name;
    }

    if (request.removePhoto === true) {
      await this.storage.deleteImage(furniture.photoKey);
      furniture.photoKey = '';
    } else if (photo && photo.size > 0) {
      await this.storage.deleteImage(furniture.photoKey);
      furniture.photoKey = await this.storage.uploadImage(photo);
    }

    return toFurnitureDto(
      await this.furnitureRepository.save(furniture),
      this.storage,
    );
  }

  async deleteFurniture(furnitureId: number): Promise<void> {
    const furniture = await this.findEntity(furnitureId);
    await this.furnitureRepository.remove(furniture);
  }

  async findEntity(furnitureId: number): Promise<FurnitureEntity> {
    const furniture = await this.furnitureRepository.findOne({
      where: { id: furnitureId },
      relations: { floor: true },
    });

    if (!furniture) {
      throw new NotFoundException(`Furniture with id=${furnitureId} not found`);
    }

    return furniture;
  }

  private existsByName(name: string): Promise<boolean> {
    return this.furnitureRepository
      .createQueryBuilder('furniture')
      .where('LOWER(furniture.name) = LOWER(:name)', { name })
      .getExists();
  }
}
