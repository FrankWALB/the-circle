import { IsString, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  personId: string;

  @IsString()
  title: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  id?: string;
}
