import { IsString, IsOptional } from 'class-validator';

export class CreateFactDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  id?: string;
}
