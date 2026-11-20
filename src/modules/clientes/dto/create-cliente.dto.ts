import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoCliente } from '../entities/tipo-cliente.enum';

export class CreateClienteDto {
  @ApiProperty({ example: 'Ana Lopez' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El campo nombre es obligatorio' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio' })
  nombre: string;

  @ApiProperty({ example: 'ana@email.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El email es inválido' })
  email: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'El campo bloqueado debe ser booleano' })
  bloqueado?: boolean;

  @ApiPropertyOptional({ enum: TipoCliente, default: TipoCliente.COMUN })
  @IsOptional()
  @IsEnum(TipoCliente, { message: 'El campo tipo debe ser COMUN, PREMIUM o VIP' })
  tipo?: TipoCliente;
}
