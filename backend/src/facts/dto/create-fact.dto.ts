import { IsString, IsOptional } from 'class-validator';

export class CreateFactDto {
  @IsString()
  personId: string;

  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  id?: string;
}
