import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/types/auth-user';
import { FloorEntity } from '../floors/entities/floor.entity';
import { OfficesService } from '../offices/offices.service';
import {
  LayerCreateRequestDto,
  LayerDto,
  LayerUpdateRequestDto,
} from './dto/layer.dto';
import { LayerEntity } from './entities/layer.entity';
import { toLayerDto } from './layers.mapper';

@Injectable()
export class LayersService {
  private readonly baseLayerName = 'Base layer';

  constructor(
    @InjectRepository(LayerEntity)
    private readonly layerRepository: Repository<LayerEntity>,
    @InjectRepository(FloorEntity)
    private readonly floorRepository: Repository<FloorEntity>,
    private readonly officesService: OfficesService,
  ) {}

  async create(
    floorId: number,
    request: LayerCreateRequestDto,
    user: AuthUser,
  ): Promise<LayerDto> {
    const floor = await this.findFloor(floorId);
    await this.officesService.assertCanManageOffice(floor.officeId, user);

    if (await this.existsByName(floorId, request.name)) {
      throw new ConflictException(
        `Layer with name=${request.name} already exists`,
      );
    }

    const layer = this.layerRepository.create({
      name: request.name,
      base: false,
      floor,
      floorId,
    });

    return toLayerDto(await this.layerRepository.save(layer));
  }

  async createBaseLayer(floorId: number): Promise<LayerEntity> {
    const floor = await this.findFloor(floorId);
    const exists = await this.layerRepository.exists({
      where: { floorId, base: true },
    });

    if (exists) {
      throw new ConflictException(
        `Base layer for floor with id=${floorId} already exists`,
      );
    }

    return this.layerRepository.save(
      this.layerRepository.create({
        name: this.baseLayerName,
        base: true,
        floor,
        floorId,
      }),
    );
  }

  async getById(layerId: number): Promise<LayerDto> {
    const layer = await this.layerRepository.findOne({
      where: { id: layerId },
      relations: { markers: true },
      order: { markers: { id: 'ASC' } },
    });

    if (!layer) {
      throw new NotFoundException(`Layer with id=${layerId} not found`);
    }

    return toLayerDto(layer);
  }

  async update(
    layerId: number,
    request: LayerUpdateRequestDto,
    user: AuthUser,
  ): Promise<LayerDto> {
    const layer = await this.findEntity(layerId);
    await this.officesService.assertCanManageOffice(layer.floor.officeId, user);

    if (request.name !== undefined) {
      layer.name = request.name;
    }

    return toLayerDto(await this.layerRepository.save(layer));
  }

  async delete(layerId: number, user: AuthUser): Promise<void> {
    const layer = await this.findEntity(layerId);
    await this.officesService.assertCanManageOffice(layer.floor.officeId, user);
    await this.layerRepository.remove(layer);
  }

  async findEntity(layerId: number): Promise<LayerEntity> {
    const layer = await this.layerRepository.findOne({
      where: { id: layerId },
      relations: { markers: true, floor: true },
    });

    if (!layer) {
      throw new NotFoundException(`Layer with id=${layerId} not found`);
    }

    return layer;
  }

  private async findFloor(floorId: number): Promise<FloorEntity> {
    const floor = await this.floorRepository.findOne({ where: { id: floorId } });

    if (!floor) {
      throw new NotFoundException(`Floor with id=${floorId} not found`);
    }

    return floor;
  }

  private existsByName(floorId: number, name: string): Promise<boolean> {
    return this.layerRepository
      .createQueryBuilder('layer')
      .where('layer.floor_id = :floorId', { floorId })
      .andWhere('LOWER(layer.name) = LOWER(:name)', { name })
      .getExists();
  }
}
