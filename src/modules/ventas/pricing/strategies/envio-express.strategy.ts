import { MetodoEnvio } from '../../entities/metodo-envio.enum';
import { CargoFijoStrategy } from '../cargo-fijo.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/** Envío express: $10.000. */
export class EnvioExpressStrategy extends CargoFijoStrategy {
  readonly nombre = 'Envío express';
  protected readonly monto = 10000;

  aplica(ctx: PricingContext): boolean {
    return ctx.envio === MetodoEnvio.EXPRESS;
  }
}
