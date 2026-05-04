import { Test, TestingModule } from '@nestjs/testing';
import { ImageVectorRepository } from '../src/domains/images/repositories/image-vector.repository';
import { QdrantClientService } from '../src/infrastructure/vector/qdrant.client';

const mockQdrantClient = {
  upsert: jest.fn().mockResolvedValue(undefined),
  search: jest.fn().mockResolvedValue([
    {
      id: 'img_001',
      score: 0.95,
      payload: {
        image_id: 'img_001',
        business_id: 'biz_001',
        image_url: '/uploads/img_001.jpg',
        category: 'product',
        filename: 'chair.jpg',
      },
    },
  ]),
  delete: jest.fn().mockResolvedValue(undefined),
};

describe('ImageVectorRepository', () => {
  let repository: ImageVectorRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageVectorRepository,
        { provide: QdrantClientService, useValue: mockQdrantClient },
      ],
    }).compile();

    repository = module.get<ImageVectorRepository>(ImageVectorRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('upsertImageVector', () => {
    it('should call qdrant upsert with correct params', async () => {
      const input = {
        imageId: 'img_001',
        vector: new Array(512).fill(0.1),
        businessId: 'biz_001',
        ownerId: 'user_001',
        category: 'product',
        status: 'active',
        imageUrl: '/uploads/img_001.jpg',
        filename: 'chair.jpg',
        contentType: 'image/jpeg',
      };

      await repository.upsertImageVector(input);

      expect(mockQdrantClient.upsert).toHaveBeenCalledTimes(1);
      expect(mockQdrantClient.upsert).toHaveBeenCalledWith(
        'img_001',
        input.vector,
        expect.objectContaining({
          image_id: 'img_001',
          business_id: 'biz_001',
        }),
      );
    });
  });

  describe('searchSimilarImages', () => {
    it('should return mapped search results', async () => {
      const results = await repository.searchSimilarImages({
        vector: new Array(512).fill(0.1),
        limit: 10,
        businessId: 'biz_001',
        category: 'product',
      });

      expect(mockQdrantClient.search).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          imageId: 'img_001',
          score: 0.95,
          imageUrl: '/uploads/img_001.jpg',
          category: 'product',
        }),
      );
    });
  });

  describe('deleteImageVector', () => {
    it('should call qdrant delete', async () => {
      await repository.deleteImageVector('img_001');
      expect(mockQdrantClient.delete).toHaveBeenCalledWith('img_001');
    });
  });
});
