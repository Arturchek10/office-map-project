import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    photo?: Express.Multer.File,
  ): Promise<OfficeDto> {
    if (await this.addressExists(request.address)) {
      throw new ConflictException(
        `Office with address=${request.address} already exists`,
      );
    }

    let office = this.officeRepository.create({
      name: request.name,
      address: request.address,
      latitude: request.latitude,
      longitude: request.longitude,
      city: request.city,
    });

    office = await this.officeRepository.save(office);

    if (photo && photo.size > 0) {
      office.photoKey = await this.storage.uploadImage(photo);
      office = await this.officeRepository.save(office);
    }

    office.floors = [];
    return toOfficeDto(office, this.storage);
  }

  async update(
    officeId: number,
    request: OfficeUpdateRequestDto,
    photo?: Express.Multer.File,
  ): Promise<OfficeDto> {
    const office = await this.findEntity(officeId);

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

    if (request.removePhoto === true) {
      await this.storage.deleteImage(office.photoKey);
      await this.officeRepository.update(officeId, { photoKey: () => 'NULL' });
      office.photoKey = undefined;
    } else if (photo && photo.size > 0) {
      await this.storage.deleteImage(office.photoKey);
      office.photoKey = await this.storage.uploadImage(photo);
    }

    const saved = await this.officeRepository.save(office);
    saved.floors = office.floors ?? [];
    return toOfficeDto(saved, this.storage);
  }

  async delete(officeId: number): Promise<void> {
    const office = await this.findEntity(officeId);
    await this.storage.deleteImage(office.photoKey);
    await this.officeRepository.remove(office);
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
