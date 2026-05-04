import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ImageEmbeddingService } from '../../ai/image-embedding.service';
import { LocalStorageService } from '../../../infrastructure/storage/local-storage.service';
import { ImageVectorRepository } from '../repositories/image-vector.repository';

export interface IndexImageInput {
  businessId: string;
  ownerId?: string;
  category?: string;
  status?: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

export interface IndexImageOutput {
  imageId: string;
  status: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class IndexImageUseCase {
  private readonly logger = new Logger(IndexImageUseCase.name);

  constructor(
    private readonly embeddingService: ImageEmbeddingService,
    private readonly storageService: LocalStorageService,
    private readonly imageVectorRepo: ImageVectorRepository,
  ) {}

  async execute(input: IndexImageInput): Promise<IndexImageOutput> {
    if (!ALLOWED_TYPES.includes(input.file.mimetype)) {
      throw new BadRequestException(
        `Invalid image type: ${input.file.mimetype}. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      );
    }
    if (input.file.size > MAX_SIZE) {
      throw new BadRequestException(`Image too large. Max size: ${MAX_SIZE / 1024 / 1024}MB`);
    }

    const { imageId, imageUrl } = await this.storageService.saveImage(
      input.file.buffer,
      input.file.originalname,
      input.file.mimetype,
    );

    let vector: number[];
    try {
      vector = await this.embeddingService.embedImage(input.file.buffer);
    } catch (err) {
      this.logger.error(`Embedding generation failed for image ${imageId}`, err);
      throw new BadRequestException('Failed to generate image embedding');
    }

    try {
      await this.imageVectorRepo.upsertImageVector({
        imageId,
        vector,
        businessId: input.businessId,
        ownerId: input.ownerId,
        category: input.category,
        status: input.status || 'active',
        imageUrl,
        filename: input.file.originalname,
        contentType: input.file.mimetype,
      });
    } catch (err) {
      this.logger.error(`Qdrant upsert failed for image ${imageId}`, err);
      throw new BadRequestException('Failed to index image vector');
    }

    this.logger.log(`Image indexed: ${imageId}`);
    return { imageId, status: 'indexed' };
  }
}
