import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageSearchResultDto {
  @ApiProperty()
  image_id!: string;

  @ApiProperty()
  score!: number;

  @ApiPropertyOptional()
  image_url?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  business_id?: string;

  @ApiPropertyOptional()
  filename?: string;
}
