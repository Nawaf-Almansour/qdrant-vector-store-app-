import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QdrantModule } from './infrastructure/vector/qdrant.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AiModule } from './domains/ai/ai.module';
import { ImagesModule } from './domains/images/images.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    QdrantModule,
    StorageModule,
    AiModule,
    ImagesModule,
  ],
})
export class AppModule {}
