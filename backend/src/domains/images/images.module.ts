import { Module } from '@nestjs/common';
import { ImageVectorRepository } from './repositories/image-vector.repository';
import { IndexImageUseCase } from './use-cases/index-image.use-case';
import { SearchSimilarImagesUseCase } from './use-cases/search-similar-images.use-case';
import { DeleteImageVectorUseCase } from './use-cases/delete-image-vector.use-case';
import { ImagesController } from '../../api/v1/images/images.controller';

@Module({
  controllers: [ImagesController],
  providers: [
    ImageVectorRepository,
    IndexImageUseCase,
    SearchSimilarImagesUseCase,
    DeleteImageVectorUseCase,
  ],
  exports: [ImageVectorRepository],
})
export class ImagesModule {}
