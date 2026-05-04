import { Injectable, Logger } from '@nestjs/common';
import { ImageVectorRepository } from '../repositories/image-vector.repository';

@Injectable()
export class DeleteImageVectorUseCase {
  private readonly logger = new Logger(DeleteImageVectorUseCase.name);

  constructor(private readonly imageVectorRepo: ImageVectorRepository) {}

  async execute(imageId: string): Promise<void> {
    await this.imageVectorRepo.deleteImageVector(imageId);
    this.logger.log(`Deleted image vector: ${imageId}`);
  }
}
