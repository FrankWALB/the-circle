import { IsString, IsOptional } from 'class-validator';

export class CreateFactDto {
  @IsString()
  personId: string;

  @IsString()
  userId: string;

  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateFactDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
