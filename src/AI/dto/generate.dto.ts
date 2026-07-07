import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateDto {
  @IsString()
  @IsNotEmpty()
  diff!: string;
}