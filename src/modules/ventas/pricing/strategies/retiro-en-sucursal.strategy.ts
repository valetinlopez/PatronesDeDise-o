import { MetodoEnvio } from '../../entities/metodo-envio.enum';
import { CargoFijoStrategy } from '../cargo-fijo.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/** Retiro en sucursal: $0. */
export class RetiroEnSucursalStrategy extends CargoFijoStrategy {
  readonly nombre = 'Retiro en sucursal';
  protected readonly monto = 0;

  aplica(ctx: PricingContext): boolean {
    return ctx.envio === MetodoEnvio.RETIRO;
  }
}
