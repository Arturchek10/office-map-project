import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

type ClassConstructor<T extends object> = new () => T;

export async function parseMultipartJson<T extends object>(
  raw: unknown,
  cls: ClassConstructor<T>,
): Promise<T> {
  if (raw == null) {
    throw new BadRequestException('Multipart field "data" is required');
  }

  let parsed: unknown = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('Multipart field "data" must be valid JSON');
    }
  }

  if (typeof parsed !== 'object' || parsed == null || Array.isArray(parsed)) {
    throw new BadRequestException('Multipart field "data" must be an object');
  }

  const instance = plainToInstance(cls, parsed);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    throw new BadRequestException({
      message: 'Validation failed',
      subErrors: errors.flatMap((error) =>
        Object.values(error.constraints ?? {}).map((message) => ({
          object: cls.name,
          field: error.property,
          rejectedValue: error.value,
          message,
        })),
      ),
    });
  }

  return instance;
}
