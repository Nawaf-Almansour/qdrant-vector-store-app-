import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
  }

  async saveImage(
    buffer: Buffer,
    originalFilename: string,
    contentType: string,
  ): Promise<{ imageId: string; filePath: string; imageUrl: string }> {
    const imageId = uuidv4();
    const ext = this.getExtension(contentType);
    const filename = `${imageId}${ext}`;
    const dir = join(process.cwd(), this.uploadDir);
    const filePath = join(dir, filename);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    this.logger.log(`Saved image: ${filename}`);

    return {
      imageId,
      filePath: filename,
      imageUrl: `/uploads/${filename}`,
    };
  }

  async deleteImage(filename: string): Promise<void> {
    const filePath = join(process.cwd(), this.uploadDir, filename);
    try {
      await fs.unlink(filePath);
      this.logger.log(`Deleted image: ${filename}`);
    } catch (err) {
      this.logger.warn(`Failed to delete image file: ${filename}`);
    }
  }

  private getExtension(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[contentType] || '.jpg';
  }
}
