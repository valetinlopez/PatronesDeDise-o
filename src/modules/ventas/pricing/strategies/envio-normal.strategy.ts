import { MetodoEnvio } from '../../entities/metodo-envio.enum';
import { CargoFijoStrategy } from '../cargo-fijo.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/** Envío normal: $5.000. */
export class EnvioNormalStrategy extends CargoFijoStrategy {
  readonly nombre = 'Envío normal';
  protected readonly monto = 5000;

  aplica(ctx: PricingContext): boolean {
    return ctx.envio === MetodoEnvio.NORMAL;
  }
}
