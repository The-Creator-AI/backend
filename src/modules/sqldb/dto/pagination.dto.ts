import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { transformStringToInteger } from 'src/utils/utils';

export class PaginationDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  @Transform(transformStringToInteger('pageNumber must be an integer'))
  pageNumber?: number;

  @IsInt()
  @IsOptional()
  @Min(10)
  @Max(100)
  @Transform(transformStringToInteger('pageSize must be an integer'))
  pageSize?: number;
}
