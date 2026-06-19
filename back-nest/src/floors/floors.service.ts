import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayerEntity } from '../layers/entities/layer.entity';
import { LayersService } from '../layers/layers.service';
import { MarkerEntity } from '../markers/entities/marker.entity';
import { OfficeEntity } from '../offices/entities/office.entity';
import { OfficesService } from '../offices/offices.service';
import { LocalFileStorageService } from '../storage/storage.service';
import { AuthUser } from '../auth/types/auth-user';
import {
  FloorCreateRequestDto,
  FloorPlanPatchRequestDto,
  FloorUpdateRequestDto,
  FloorViewDto,
} from './dto/floor.dto';
import { FloorEntity } from './entities/floor.entity';
import { toFloorViewDto } from './floors.mapper';

@Injectable()
export class FloorsService {
  constructor(
    @InjectRepository(FloorEntity)
    private readonly floorRepository: Repository<FloorEntity>,
    @InjectRepository(OfficeEntity)
    private readonly officeRepository: Repository<OfficeEntity>,
    @InjectRepository(LayerEntity)
    private readonly layerRepository: Repository<LayerEntity>,
    @InjectRepository(MarkerEntity)
    private readonly markerRepository: Repository<MarkerEntity>,
    private readonly layersService: LayersService,
    private readonly officesService: OfficesService,
    private readonly storage: LocalFileStorageService,
  ) {}

  async getFloorView(floorId: number): Promise<FloorViewDto> {
    const floor = await this.floorRepository.findOne({
      where: { id: floorId },
      relations: { furnitures: true },
      order: { furnitures: { id: 'ASC' } },
    });

    if (!floor) {
      throw new NotFoundException(`Floor with id=${floorId} not found`);
    }

    const layers = await this.layerRepository.find({
      where: { floorId },
      order: { name: 'ASC' },
    });
    const baseLayer = layers.find((layer) => layer.base);

    if (!baseLayer) {
      throw new NotFoundException(`Base layer for floor with id=${floorId} not found`);
    }

    const allMarkers = await this.markerRepository
      .createQueryBuilder('marker')
      .leftJoinAndSelect('marker.photos', 'photo')
      .leftJoin('marker.layer', 'layer')
      .where('layer.floor_id = :floorId', { floorId })
      .orderBy('marker.id', 'ASC')
      .addOrderBy('photo.sort_order', 'ASC')
      .getMany();

    return toFloorViewDto(floor, layers, baseLayer, allMarkers, this.storage);
  }

  async create(
    officeId: number,
    request: FloorCreateRequestDto,
    user: AuthUser,
  ): Promise<FloorViewDto> {
    const office = await this.officeRepository.findOne({
      where: { id: officeId },
    });

    if (!office) {
      throw new NotFoundException(`Office with id=${officeId} not found`);
    }
    this.officesService.assertCanManageLoadedOffice(office, user);

    if (await this.orderNumberExists(officeId, request.orderNumber)) {
      throw new ConflictException('Floor already exists');
    }

    const floor = await this.floorRepository.save(
      this.floorRepository.create({
        name: request.name,
        orderNumber: request.orderNumber,
        office,
        officeId,
      }),
    );

    await this.layersService.createBaseLayer(floor.id);
    return this.getFloorView(floor.id);
  }

  async update(
    floorId: number,
    request: FloorUpdateRequestDto,
    user: AuthUser,
  ): Promise<FloorViewDto> {
    const floor = await this.findEntity(floorId);
    this.officesService.assertCanManageLoadedOffice(floor.office, user);

    if (
      request.orderNumber !== undefined &&
      request.orderNumber !== floor.orderNumber &&
      (await this.orderNumberExists(floor.officeId, request.orderNumber, floorId))
    ) {
      throw new ConflictException(`Floor with id=${floorId} already exists`);
    }

    if (request.name !== undefined) {
      floor.name = request.name;
    }
    if (request.orderNumber !== undefined) {
      floor.orderNumber = request.orderNumber;
    }

    await this.floorRepository.save(floor);
    return this.getFloorView(floorId);
  }

  async updatePlan(
    floorId: number,
    request: FloorPlanPatchRequestDto,
    user: AuthUser,
    photo?: Express.Multer.File,
  ): Promise<FloorViewDto> {
    if (request.removePhoto === true && photo && photo.size > 0) {
      throw new BadRequestException('Cannot remove and upload photo at once');
    }

    const floor = await this.findEntity(floorId);
    this.officesService.assertCanManageLoadedOffice(floor.office, user);

    if (request.removePhoto === true) {
      await this.storage.deleteImage(floor.photoKey);
      await this.floorRepository.update(floorId, { photoKey: () => 'NULL' });
      floor.photoKey = undefined;
    } else if (photo && photo.size > 0) {
      await this.storage.deleteImage(floor.photoKey);
      floor.photoKey = await this.storage.uploadImage(photo, 'floors');
    }

    await this.floorRepository.save(floor);
    return this.getFloorView(floorId);
  }

  async delete(floorId: number, user: AuthUser): Promise<void> {
    const floor = await this.findEntity(floorId);
    this.officesService.assertCanManageLoadedOffice(floor.office, user);
    await this.storage.deleteImage(floor.photoKey);
    await this.floorRepository.remove(floor);
  }

  async findEntity(floorId: number): Promise<FloorEntity> {
    const floor = await this.floorRepository.findOne({
      where: { id: floorId },
      relations: { office: true },
    });

    if (!floor) {
      throw new NotFoundException(`Floor with id=${floorId} not found`);
    }

    return floor;
  }

  private orderNumberExists(
    officeId: number,
    orderNumber: number,
    exceptFloorId?: number,
  ): Promise<boolean> {
    const query = this.floorRepository
      .createQueryBuilder('floor')
      .where('floor.office_id = :officeId', { officeId })
      .andWhere('floor.order_number = :orderNumber', { orderNumber });

    if (exceptFloorId != null) {
      query.andWhere('floor.id <> :exceptFloorId', { exceptFloorId });
    }

    return query.getExists();
  }
}
