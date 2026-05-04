import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantClientService implements OnModuleInit {
  private readonly logger = new Logger(QdrantClientService.name);
  private client!: QdrantClient;
  private collectionName!: string;
  private embeddingDimension!: number;
  private collectionReady = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('QDRANT_URL', 'http://localhost:6333');
    const apiKey = this.configService.get<string>('QDRANT_API_KEY', '');
    this.collectionName = this.configService.get<string>('QDRANT_COLLECTION_IMAGES', 'image_vectors');

    const dimRaw = this.configService.get('IMAGE_EMBEDDING_DIMENSION', '512');
    this.embeddingDimension = typeof dimRaw === 'number' ? dimRaw : parseInt(String(dimRaw), 10);

    this.client = new QdrantClient({
      url,
      ...(apiKey ? { apiKey } : {}),
    });

    this.logger.log(
      `Qdrant config: url=${url}, collection=${this.collectionName}, dim=${this.embeddingDimension} (type=${typeof this.embeddingDimension})`,
    );

    try {
      await this.ensureCollection();
      this.logger.log(`Qdrant connected. Collection: ${this.collectionName}`);
    } catch (err: any) {
      this.logger.warn(
        `Qdrant init failed: ${err?.message}. Collection will be created on first request. ` +
        `Make sure Qdrant is running (docker-compose up -d).`,
      );
    }
  }

  private async ensureCollection(): Promise<void> {
    if (this.collectionReady) return;

    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c: { name: string }) => c.name === this.collectionName);

    if (!exists) {
      this.logger.log(`Creating collection "${this.collectionName}" with dim=${this.embeddingDimension}...`);
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.embeddingDimension,
          distance: 'Cosine',
        },
      });
      this.logger.log(`Created collection: ${this.collectionName}`);

      await this.createPayloadIndexes();
    }

    this.collectionReady = true;
  }

  private async createPayloadIndexes(): Promise<void> {
    const fields = ['business_id', 'owner_id', 'category', 'status'];
    for (const field of fields) {
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: field,
        field_schema: 'keyword',
      });
    }
    await this.client.createPayloadIndex(this.collectionName, {
      field_name: 'created_at',
      field_schema: 'datetime',
    });
    this.logger.log('Payload indexes created');
  }

  async upsert(
    id: string,
    vector: number[],
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.ensureCollection();
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    });
  }

  async search(
    vector: number[],
    limit: number,
    filter?: Record<string, unknown>,
  ): Promise<Array<{ id: string | number; score: number; payload?: Record<string, unknown> }>> {
    await this.ensureCollection();
    const result = await this.client.search(this.collectionName, {
      vector,
      limit,
      with_payload: true,
      ...(filter ? { filter } : {}),
    });

    return result.map((point) => ({
      id: point.id,
      score: point.score,
      payload: point.payload as Record<string, unknown> | undefined,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.ensureCollection();
    await this.client.delete(this.collectionName, {
      wait: true,
      points: [id],
    });
  }
}
