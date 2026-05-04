import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IndexImageDto {
  @ApiProperty({ description: 'Business ID that owns this image' })
  @IsNotEmpty()
  @IsString()
  business_id!: string;

  @ApiPropertyOptional({ description: 'Owner/user ID' })
  @IsOptional()
  @IsString()
  owner_id?: string;

  @ApiPropertyOptional({ description: 'Image category', example: 'product' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Image status', example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;
}
