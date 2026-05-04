import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QdrantClientService } from './qdrant.client';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [QdrantClientService],
  exports: [QdrantClientService],
})
export class QdrantModule {}
