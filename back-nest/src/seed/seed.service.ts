import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RoleEntity, RoleName } from '../auth/entities/role.entity';
import { UserEntity } from '../auth/entities/user.entity';

type RoleSeed = {
  id: number;
  name: RoleName;
  description: string;
};

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly superAdminEmail = 'admin@mail.ru';
  private readonly superAdminPasswordHash =
    '$2b$10$mD8eiB53SwnR6SIGra5.3eWV8SXvvlBdv.OVgEtN7Bx/5tz3ZoIca';

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.runSeeds();
  }

  async runSeeds(): Promise<void> {
    await this.userRoles();
    await this.superAdmin();
    await this.syncSequences();
  }

  async userRoles(): Promise<void> {
    const roles: RoleSeed[] = [
      {
        id: 1,
        name: RoleName.SUPER_ADMIN,
        description: 'Can manage admins, users, bans and all admin offices',
      },
      {
        id: 2,
        name: RoleName.ADMIN,
        description: 'Can create offices and manage own office maps',
      },
      {
        id: 3,
        name: RoleName.USER,
        description: 'Can view offices and create bookings',
      },
    ];

    for (const role of roles) {
      const existingByName = await this.roleRepository.findOne({
        where: { name: role.name },
      });

      if (existingByName) {
        existingByName.description = role.description;
        await this.roleRepository.save(existingByName);
        continue;
      }

      await this.roleRepository.save(this.roleRepository.create(role));
    }
  }

  async superAdmin(): Promise<void> {
    const role = await this.roleRepository.findOneByOrFail({
      name: RoleName.SUPER_ADMIN,
    });

    const existingUser = await this.userRepository.findOne({
      where: { email: this.superAdminEmail },
      withDeleted: true,
    });

    if (existingUser) {
      await this.userRepository
        .createQueryBuilder()
        .update(UserEntity)
        .set({
          name: 'Super Admin',
          password: this.superAdminPasswordHash,
          roleId: role.id,
          bannedAt: () => 'NULL',
          bannedReason: () => 'NULL',
          deletedAt: () => 'NULL',
        })
        .where('id = :id', { id: existingUser.id })
        .execute();
      return;
    }

    await this.userRepository.save(
      this.userRepository.create({
        id: 1,
        email: this.superAdminEmail,
        name: 'Super Admin',
        password: this.superAdminPasswordHash,
        role,
        roleId: role.id,
      }),
    );
  }

  private async syncSequences(): Promise<void> {
    await this.dataSource.query(`
      SELECT setval(
        pg_get_serial_sequence('roles', 'id'),
        COALESCE((SELECT MAX(id) FROM roles), 1),
        true
      )
    `);
    await this.dataSource.query(`
      SELECT setval(
        pg_get_serial_sequence('users', 'id'),
        COALESCE((SELECT MAX(id) FROM users), 1),
        true
      )
    `);
  }
}
