import { Injectable, Logger } from '@nestjs/common';
import * as sharpModule from 'sharp';

const sharp = (sharpModule as any).default || sharpModule;

@Injectable()
export class ImageEmbeddingService {
  private readonly logger = new Logger(ImageEmbeddingService.name);
  private pipeline: any = null;
  private processor: any = null;
  private model: any = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private async ensureModel(): Promise<void> {
    if (this.model && this.processor) return;
    if (this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.isLoading = true;
    this.loadPromise = this.loadModel();
    await this.loadPromise;
    this.isLoading = false;
  }

  private async loadModel(): Promise<void> {
    this.logger.log('Loading CLIP model (this may take a moment on first run)...');
    const startTime = Date.now();

    const transformers = await import('@huggingface/transformers');

    this.processor = await transformers.AutoProcessor.from_pretrained(
      'Xenova/clip-vit-base-patch32',
    );
    this.model = await transformers.CLIPVisionModelWithProjection.from_pretrained(
      'Xenova/clip-vit-base-patch32',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { quantized: false } as any,
    );

    const duration = Date.now() - startTime;
    this.logger.log(`CLIP model loaded in ${duration}ms`);
  }

  async embedImage(buffer: Buffer): Promise<number[]> {
    const startTime = Date.now();
    await this.ensureModel();

    const { data, info } = await sharp(buffer)
      .resize(224, 224, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const transformers = await import('@huggingface/transformers');
    const { RawImage } = transformers;

    const rawImage = new RawImage(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      info.channels,
    );

    const imageInputs = await this.processor(rawImage);
    const output = await this.model(imageInputs);

    const embedding = Array.from(output.image_embeds.data as Float32Array);

    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = embedding.map((val) => val / norm);

    const duration = Date.now() - startTime;
    this.logger.log(`Image embedded in ${duration}ms (dim=${normalized.length})`);

    return normalized;
  }
}
