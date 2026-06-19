import { Global, Module } from '@nestjs/common';
import { LocalFileStorageService } from './storage.service';

@Global()
@Module({
  providers: [LocalFileStorageService],
  exports: [LocalFileStorageService],
})
export class StorageModule {}
