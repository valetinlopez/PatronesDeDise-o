import { TipoCliente } from '../../clientes/entities/tipo-cliente.enum';
import { MetodoEnvio } from '../entities/metodo-envio.enum';

/**
 * Datos de la compra que las estrategias pueden mirar para decidir si aplican.
 * Es un objeto plano (sin entidades de TypeORM) para poder usarlo también en el demo de consola.
 */
export interface PricingContext {
  readonly cliente: { readonly tipo: TipoCliente };
  readonly precioUnitario: number;
  readonly cantidad: number;
  readonly envio: MetodoEnvio;
  readonly promociones: readonly string[];
  /** precioUnitario x cantidad, antes de cualquier estrategia. */
  readonly subtotal: number;
}

/**
 * STRATEGY: una regla de precio independiente.
 * Recibe el precio actual y devuelve el precio nuevo; no conoce a las demás estrategias.
 */
export interface PricingStrategy {
  readonly nombre: string;
  /** Define el orden de aplicación (menor = antes). Descuentos < 90, cargos de envío = 90. */
  readonly prioridad: number;
  /** ¿Corresponde aplicar esta estrategia a esta compra? */
  aplica(ctx: PricingContext): boolean;
  aplicar(precioActual: number, ctx: PricingContext): number;
  /** Texto para mostrar el efecto, ej: "-15%" o "+$10.000". */
  descripcion(ctx: PricingContext): string;
}

/** Token de inyección de la lista de estrategias registradas. */
export const PRICING_STRATEGIES = Symbol('PRICING_STRATEGIES');
