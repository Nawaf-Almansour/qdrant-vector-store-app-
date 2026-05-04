import { Module, Global } from '@nestjs/common';
import { ImageEmbeddingService } from './image-embedding.service';

@Global()
@Module({
  providers: [ImageEmbeddingService],
  exports: [ImageEmbeddingService],
})
export class AiModule {}
