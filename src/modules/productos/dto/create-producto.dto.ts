import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateProductoDto {
  @ApiProperty({ example: 'Teclado mecanico' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El campo nombre es obligatorio' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio' })
  nombre: string;

  @ApiProperty({ example: 45000 })
  @IsNumber({}, { message: 'El campo precio debe ser mayor a cero' })
  @IsPositive({ message: 'El campo precio debe ser mayor a cero' })
  precio: number;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'El campo stock no puede ser negativo' })
  @Min(0, { message: 'El campo stock no puede ser negativo' })
  stock: number;
}
