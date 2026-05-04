import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ImageEmbeddingService } from '../../ai/image-embedding.service';
import {
  ImageVectorRepository,
  ImageSearchResult,
} from '../repositories/image-vector.repository';

export interface SearchSimilarImagesInput {
  businessId: string;
  category?: string;
  status?: string;
  limit: number;
  file: {
    buffer: Buffer;
    mimetype: string;
  };
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class SearchSimilarImagesUseCase {
  private readonly logger = new Logger(SearchSimilarImagesUseCase.name);

  constructor(
    private readonly embeddingService: ImageEmbeddingService,
    private readonly imageVectorRepo: ImageVectorRepository,
  ) {}

  async execute(input: SearchSimilarImagesInput): Promise<ImageSearchResult[]> {
    if (!ALLOWED_TYPES.includes(input.file.mimetype)) {
      throw new BadRequestException(
        `Invalid image type: ${input.file.mimetype}. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    const startTime = Date.now();

    let vector: number[];
    try {
      vector = await this.embeddingService.embedImage(input.file.buffer);
    } catch (err) {
      this.logger.error('Embedding generation failed for search query', err);
      throw new BadRequestException('Failed to generate query embedding');
    }

    const results = await this.imageVectorRepo.searchSimilarImages({
      vector,
      limit: input.limit,
      businessId: input.businessId,
      category: input.category,
      status: input.status,
    });

    const duration = Date.now() - startTime;
    this.logger.log(`Search completed in ${duration}ms, found ${results.length} results`);

    return results;
  }
}
