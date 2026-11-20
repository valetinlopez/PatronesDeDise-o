import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsNumber, Min, ValidateNested } from 'class-validator';
import { MedioPago } from '../entities/medio-pago.enum';
import { CotizarVentaDto } from './cotizar-venta.dto';

/** Pago simulado: no hay pasarela, solo el saldo con el que cuenta el cliente. */
export class PagoDto {
  @ApiProperty({ enum: MedioPago, example: MedioPago.TARJETA })
  @IsEnum(MedioPago, { message: 'El campo medio debe ser TARJETA, EFECTIVO o TRANSFERENCIA' })
  medio: MedioPago;

  @ApiProperty({ example: 500000, description: 'Saldo disponible para pagar' })
  @IsNumber({}, { message: 'El campo saldoDisponible debe ser un número' })
  @Min(0, { message: 'El campo saldoDisponible no puede ser negativo' })
  saldoDisponible: number;
}

export class CreateVentaDto extends CotizarVentaDto {
  @ApiProperty({ type: PagoDto })
  @IsDefined({ message: 'El campo pago es obligatorio' })
  @ValidateNested()
  @Type(() => PagoDto)
  pago: PagoDto;
}
