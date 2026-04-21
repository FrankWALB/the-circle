import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  personId: string;

  @IsString()
  userId: string;

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
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
