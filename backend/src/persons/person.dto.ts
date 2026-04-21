import { IsString, IsOptional } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  userId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
