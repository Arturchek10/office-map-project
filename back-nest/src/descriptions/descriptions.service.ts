import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DescriptionPayloadDto, MarkerTypeValue } from '../markers/dto/marker.dto';
import { DescriptionEntity } from './entities/description.entity';
import { EmergencyDescriptionEntity } from './entities/emergency-description.entity';
import { RoomDescriptionEntity } from './entities/room-description.entity';
import { UtilityDescriptionEntity } from './entities/utility-description.entity';
import { WorkspaceDescriptionEntity } from './entities/workspace-description.entity';

@Injectable()
export class DescriptionsService {
  constructor(
    @InjectRepository(DescriptionEntity)
    private readonly descriptionRepository: Repository<DescriptionEntity>,
    @InjectRepository(RoomDescriptionEntity)
    private readonly roomRepository: Repository<RoomDescriptionEntity>,
    @InjectRepository(WorkspaceDescriptionEntity)
    private readonly workspaceRepository: Repository<WorkspaceDescriptionEntity>,
    @InjectRepository(UtilityDescriptionEntity)
    private readonly utilityRepository: Repository<UtilityDescriptionEntity>,
    @InjectRepository(EmergencyDescriptionEntity)
    private readonly emergencyRepository: Repository<EmergencyDescriptionEntity>,
  ) {}

  async getPayload(
    descriptionId: number | null,
    type: MarkerTypeValue | null,
  ): Promise<DescriptionPayloadDto | null> {
    if (!descriptionId || !type) return null;

    const description = await this.descriptionRepository.findOne({
      where: { id: descriptionId },
    });

    if (!description) return null;

    if (type === 'room') {
      const room = await this.roomRepository.findOne({
        where: { id: descriptionId },
      });
      return {
        text: description.text ?? null,
        capacity: room?.capacity ?? null,
      };
    }

    if (type === 'workspace') {
      const workspace = await this.workspaceRepository.findOne({
        where: { id: descriptionId },
      });
      return {
        text: description.text ?? null,
        haveComputer: workspace?.haveComputer ?? null,
      };
    }

    return {
      text: description.text ?? null,
    };
  }

  async savePayload(
    existingDescriptionId: number | null,
    previousType: MarkerTypeValue | null,
    nextType: MarkerTypeValue,
    payload: Record<string, unknown>,
  ): Promise<DescriptionEntity> {
    const sameType = previousType === nextType && existingDescriptionId != null;
    let description = existingDescriptionId
      ? await this.descriptionRepository.findOne({
          where: { id: existingDescriptionId },
        })
      : null;

    if (!description) {
      description = await this.descriptionRepository.save(
        this.descriptionRepository.create({}),
      );
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'text')) {
      description.text = this.asOptionalString(payload.text);
      description = await this.descriptionRepository.save(description);
      if (description.text === undefined) {
        await this.descriptionRepository.update(description.id, {
          text: () => 'NULL',
        });
      }
    }

    if (!sameType) {
      await this.deleteSubtypeRows(description.id);
    }

    await this.patchSubtype(description, nextType, payload);
    return description;
  }

  async removeDescription(descriptionId?: number | null): Promise<void> {
    if (!descriptionId) return;
    await this.descriptionRepository.delete({ id: descriptionId });
  }

  private async patchSubtype(
    description: DescriptionEntity,
    type: MarkerTypeValue,
    payload: Record<string, unknown>,
  ) {
    if (type === 'room') {
      const room =
        (await this.roomRepository.findOne({ where: { id: description.id } })) ??
        this.roomRepository.create({ id: description.id, description });
      if (Object.prototype.hasOwnProperty.call(payload, 'capacity')) {
        room.capacity = this.asOptionalNumber(payload.capacity);
      }
      await this.roomRepository.save(room);
      if (
        Object.prototype.hasOwnProperty.call(payload, 'capacity') &&
        room.capacity === undefined
      ) {
        await this.roomRepository.update(room.id, { capacity: () => 'NULL' });
      }
      return;
    }

    if (type === 'workspace') {
      const workspace =
        (await this.workspaceRepository.findOne({
          where: { id: description.id },
        })) ?? this.workspaceRepository.create({ id: description.id, description });
      if (Object.prototype.hasOwnProperty.call(payload, 'haveComputer')) {
        workspace.haveComputer = this.asOptionalBoolean(payload.haveComputer);
      }
      await this.workspaceRepository.save(workspace);
      if (
        Object.prototype.hasOwnProperty.call(payload, 'haveComputer') &&
        workspace.haveComputer === undefined
      ) {
        await this.workspaceRepository.update(workspace.id, {
          haveComputer: () => 'NULL',
        });
      }
      return;
    }

    if (type === 'utility') {
      await this.utilityRepository.save(
        this.utilityRepository.create({ id: description.id, description }),
      );
      return;
    }

    await this.emergencyRepository.save(
      this.emergencyRepository.create({ id: description.id, description }),
    );
  }

  private async deleteSubtypeRows(descriptionId: number): Promise<void> {
    await Promise.all([
      this.roomRepository.delete({ id: descriptionId }),
      this.workspaceRepository.delete({ id: descriptionId }),
      this.utilityRepository.delete({ id: descriptionId }),
      this.emergencyRepository.delete({ id: descriptionId }),
    ]);
  }

  private asOptionalString(value: unknown): string | undefined {
    if (value == null) return undefined;
    return String(value);
  }

  private asOptionalNumber(value: unknown): number | undefined {
    if (value == null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private asOptionalBoolean(value: unknown): boolean | undefined {
    if (value == null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  }
}
