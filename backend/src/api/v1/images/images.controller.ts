import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { IndexImageUseCase } from '../../../domains/images/use-cases/index-image.use-case';
import { SearchSimilarImagesUseCase } from '../../../domains/images/use-cases/search-similar-images.use-case';
import { DeleteImageVectorUseCase } from '../../../domains/images/use-cases/delete-image-vector.use-case';
import { IndexImageDto } from '../../../domains/images/dto/index-image.dto';
import { SearchImagesDto } from '../../../domains/images/dto/search-images.dto';

@ApiTags('Images')
@Controller('api/v1/images')
export class ImagesController {
  constructor(
    private readonly indexImageUseCase: IndexImageUseCase,
    private readonly searchSimilarImagesUseCase: SearchSimilarImagesUseCase,
    private readonly deleteImageVectorUseCase: DeleteImageVectorUseCase,
  ) {}

  @Post('index')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload and index an image' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image', 'business_id'],
      properties: {
        image: { type: 'string', format: 'binary' },
        business_id: { type: 'string' },
        owner_id: { type: 'string' },
        category: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image indexed successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async indexImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: IndexImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.indexImageUseCase.execute({
      businessId: dto.business_id,
      ownerId: dto.owner_id,
      category: dto.category,
      status: dto.status,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  }

  @Post('search')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Search for similar images' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image', 'business_id'],
      properties: {
        image: { type: 'string', format: 'binary' },
        business_id: { type: 'string' },
        category: { type: 'string' },
        status: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async searchImages(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SearchImagesDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const results = await this.searchSimilarImagesUseCase.execute({
      businessId: dto.business_id,
      category: dto.category,
      status: dto.status,
      limit: dto.limit || 10,
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
      },
    });

    return { results };
  }

  @Delete(':imageId/vector')
  @ApiOperation({ summary: 'Delete an image vector from Qdrant' })
  @ApiResponse({ status: 200, description: 'Vector deleted successfully' })
  async deleteVector(@Param('imageId') imageId: string) {
    await this.deleteImageVectorUseCase.execute(imageId);
    return { status: 'deleted', imageId };
  }
}
