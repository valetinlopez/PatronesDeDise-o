import { PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';

/** PUT parcial (comportamiento PATCH del original). El service exige al menos un campo. */
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}
