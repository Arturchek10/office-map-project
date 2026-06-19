import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleName } from '../auth/entities/role.entity';
import { AuthUser } from '../auth/types/auth-user';
import { LocalFileStorageService } from '../storage/storage.service';
import {
  OfficeCreateRequestDto,
  OfficeDto,
  OfficeShortDto,
  OfficeUpdateRequestDto,
} from './dto/office.dto';
import { OfficeEntity } from './entities/office.entity';
import { toOfficeDto, toOfficeShortDto } from './offices.mapper';

@Injectable()
export class OfficesService {
  constructor(
    @InjectRepository(OfficeEntity)
    private readonly officeRepository: Repository<OfficeEntity>,
    private readonly storage: LocalFileStorageService,
  ) {}

  async getAll(): Promise<OfficeDto[]> {
    const offices = await this.officeRepository.find({
      relations: { floors: true },
      order: { id: 'ASC' },
    });

    return offices.map((office) => toOfficeDto(office, this.storage));
  }

  async getById(officeId: number): Promise<OfficeShortDto> {
    const office = await this.officeRepository.findOne({
      where: { id: officeId },
      relations: { floors: true },
    });

    if (!office) {
      throw new NotFoundException(`Office with id=${officeId} not found`);
    }

    return toOfficeShortDto(office);
  }

  async create(
    request: OfficeCreateRequestDto,
    createdByUserId: number,
    photo?: Express.Multer.File,
  ): Promise<OfficeDto> {
    if (await this.addressExists(request.address)) {
      throw new ConflictException(
        `Office with address=${request.address} already exists`,
      );
    }

    const photoKey =
      photo && photo.size > 0
        ? await this.storage.uploadImage(photo, 'offices')
        : undefined;

    const office = this.officeRepository.create({
      name: request.name,
      address: request.address,
      latitude: request.latitude,
      longitude: request.longitude,
      city: request.city,
      photoKey,
      createdByUserId,
    });

    await this.officeRepository.save(office);
    office.floors = [];
    return toOfficeDto(office, this.storage);
  }

  async update(
    officeId: number,
    request: OfficeUpdateRequestDto,
    user: AuthUser,
    photo?: Express.Multer.File,
  ): Promise<OfficeDto> {
    const office = await this.findEntity(officeId);
    this.assertCanManageLoadedOffice(office, user);

    if (request.address) {
      const newAddress = request.address.trim();
      const changed =
        !office.address || office.address.toLowerCase() !== newAddress.toLowerCase();

      if (changed && (await this.addressExists(newAddress, officeId))) {
        throw new ConflictException(
          `Office with address=${newAddress} already exists`,
        );
      }

      office.address = newAddress;
    }

    if (request.name !== undefined) {
      office.name = request.name;
    }

    if (request.removePhoto === true && photo && photo.size > 0) {
      throw new BadRequestException('Cannot remove and upload photo at once');
    }

    const oldPhotoKey = office.photoKey;
    const nextPhotoKey =
      photo && photo.size > 0
        ? await this.storage.uploadImage(photo, 'offices')
        : undefined;

    if (request.removePhoto === true) {
      office.photoKey = null;
    } else if (nextPhotoKey) {
      office.photoKey = nextPhotoKey;
    }

    const updateData: Partial<OfficeEntity> = {};
    if (request.address) {
      updateData.address = office.address;
    }
    if (request.name !== undefined) {
      updateData.name = office.name;
    }
    if (request.removePhoto === true || nextPhotoKey) {
      updateData.photoKey = office.photoKey;
    }

    try {
      if (Object.keys(updateData).length > 0) {
        await this.officeRepository.update(officeId, updateData);
      }

      if (request.removePhoto === true || nextPhotoKey) {
        await this.storage.deleteImage(oldPhotoKey);
      }

      const saved = await this.findEntity(officeId);
      return toOfficeDto(saved, this.storage);
    } catch (error) {
      await this.storage.deleteImage(nextPhotoKey);
      throw error;
    }
  }

  async delete(officeId: number, user: AuthUser): Promise<void> {
    const office = await this.findEntity(officeId);
    this.assertCanManageLoadedOffice(office, user);
    await this.officeRepository.softDelete(office.id);
  }

  async exists(officeId: number): Promise<boolean> {
    return this.officeRepository.exists({ where: { id: officeId } });
  }

  async findEntity(officeId: number): Promise<OfficeEntity> {
    const office = await this.officeRepository.findOne({
      where: { id: officeId },
      relations: { floors: true },
    });

    if (!office) {
      throw new NotFoundException(`Office with id=${officeId} not found`);
    }

    return office;
  }

  async assertCanManageOffice(officeId: number, user: AuthUser): Promise<void> {
    const office = await this.findEntity(officeId);
    this.assertCanManageLoadedOffice(office, user);
  }

  assertCanManageLoadedOffice(office: OfficeEntity, user: AuthUser): void {
    if (user.role === RoleName.SUPER_ADMIN) {
      return;
    }

    if (user.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only office admin can manage office');
    }

    if (!office.createdByUserId || Number(office.createdByUserId) !== Number(user.sub)) {
      throw new ForbiddenException('You can manage only your own offices');
    }
  }

  private async addressExists(address: string, exceptId?: number) {
    const query = this.officeRepository
      .createQueryBuilder('office')
      .where('LOWER(office.address) = LOWER(:address)', { address });

    if (exceptId != null) {
      query.andWhere('office.id <> :exceptId', { exceptId });
    }

    return query.getExists();
  }
}
