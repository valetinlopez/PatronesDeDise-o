import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { MetodoEnvio } from '../entities/metodo-envio.enum';

/** Datos necesarios para calcular el precio (Strategy). Es la base de CreateVentaDto. */
export class CotizarVentaDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'El campo clienteId debe ser un entero mayor a cero' })
  @IsPositive({ message: 'El campo clienteId debe ser un entero mayor a cero' })
  clienteId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'El campo productoId debe ser un entero mayor a cero' })
  @IsPositive({ message: 'El campo productoId debe ser un entero mayor a cero' })
  productoId: number;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'El campo cantidad debe ser un entero mayor a cero' })
  @IsPositive({ message: 'El campo cantidad debe ser un entero mayor a cero' })
  cantidad: number;

  @ApiPropertyOptional({ enum: MetodoEnvio, default: MetodoEnvio.RETIRO })
  @IsOptional()
  @IsEnum(MetodoEnvio, { message: 'El campo envio debe ser RETIRO, NORMAL o EXPRESS' })
  envio?: MetodoEnvio;

  @ApiPropertyOptional({ example: ['PROMO10'], description: 'Códigos de promociones especiales' })
  @IsOptional()
  @IsArray({ message: 'El campo promociones debe ser una lista de códigos' })
  @ArrayMaxSize(10, { message: 'No se pueden enviar más de 10 promociones' })
  @IsString({ each: true, message: 'Cada promoción debe ser un texto' })
  promociones?: string[];
}
