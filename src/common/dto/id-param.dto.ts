import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class IdParamDto {
  @Type(() => Number)
  @IsInt({ message: 'El id debe ser un entero mayor a cero' })
  @IsPositive({ message: 'El id debe ser un entero mayor a cero' })
  id: number;
}
