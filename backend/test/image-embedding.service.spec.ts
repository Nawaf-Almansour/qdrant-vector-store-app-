import { Test, TestingModule } from '@nestjs/testing';
import { ImageEmbeddingService } from '../src/domains/ai/image-embedding.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ImageEmbeddingService', () => {
  let service: ImageEmbeddingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageEmbeddingService],
    }).compile();

    service = module.get<ImageEmbeddingService>(ImageEmbeddingService);
  }, 120000);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a 512-dimensional embedding from image buffer', async () => {
    const testImagePath = path.join(__dirname, 'fixtures', 'test.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.warn('Skipping: test fixture test.jpg not found');
      return;
    }

    const buffer = fs.readFileSync(testImagePath);
    const embedding = await service.embedImage(buffer);

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(512);
    expect(embedding.every((v) => typeof v === 'number')).toBe(true);

    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    expect(norm).toBeCloseTo(1.0, 2);
  }, 120000);
});
