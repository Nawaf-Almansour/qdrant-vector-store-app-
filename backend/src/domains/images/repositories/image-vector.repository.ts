import { Injectable, Logger } from '@nestjs/common';
import { QdrantClientService } from '../../../infrastructure/vector/qdrant.client';

export interface UpsertImageVectorInput {
  imageId: string;
  vector: number[];
  businessId: string;
  ownerId?: string;
  category?: string;
  status?: string;
  imageUrl: string;
  filename: string;
  contentType: string;
}

export interface SearchSimilarImagesInput {
  vector: number[];
  limit: number;
  businessId: string;
  category?: string;
  status?: string;
}

export interface ImageSearchResult {
  imageId: string;
  score: number;
  imageUrl?: string;
  category?: string;
  businessId?: string;
  filename?: string;
}

@Injectable()
export class ImageVectorRepository {
  private readonly logger = new Logger(ImageVectorRepository.name);

  constructor(private readonly qdrantClient: QdrantClientService) {}

  async upsertImageVector(input: UpsertImageVectorInput): Promise<void> {
    const payload = {
      image_id: input.imageId,
      business_id: input.businessId,
      owner_id: input.ownerId || '',
      category: input.category || '',
      status: input.status || 'active',
      image_url: input.imageUrl,
      filename: input.filename,
      content_type: input.contentType,
      created_at: new Date().toISOString(),
    };

    await this.qdrantClient.upsert(input.imageId, input.vector, payload);
    this.logger.log(`Upserted vector for image: ${input.imageId}`);
  }

  async searchSimilarImages(input: SearchSimilarImagesInput): Promise<ImageSearchResult[]> {
    const mustConditions: Array<{ key: string; match: { value: string } }> = [
      { key: 'business_id', match: { value: input.businessId } },
    ];

    if (input.category) {
      mustConditions.push({ key: 'category', match: { value: input.category } });
    }
    if (input.status) {
      mustConditions.push({ key: 'status', match: { value: input.status } });
    }

    const filter = { must: mustConditions };

    const results = await this.qdrantClient.search(input.vector, input.limit, filter);

    return results.map((point) => ({
      imageId: String(point.id),
      score: point.score,
      imageUrl: point.payload?.image_url as string | undefined,
      category: point.payload?.category as string | undefined,
      businessId: point.payload?.business_id as string | undefined,
      filename: point.payload?.filename as string | undefined,
    }));
  }

  async deleteImageVector(imageId: string): Promise<void> {
    await this.qdrantClient.delete(imageId);
    this.logger.log(`Deleted vector for image: ${imageId}`);
  }
}
