import { Inject, Injectable } from '@nestjs/common';
import { PRICING_STRATEGIES, PricingContext, PricingStrategy } from './pricing-strategy.interface';

export interface PasoPrecio {
  estrategia: string;
  efecto: string;
  precioAntes: number;
  precioDespues: number;
}

export interface PricingResult {
  subtotal: number;
  pasos: PasoPrecio[];
  total: number;
}

export type PricingInput = Omit<PricingContext, 'subtotal'>;

const redondear = (n: number): number => Math.round(n * 100) / 100;

/**
 * Context del patrón Strategy.
 * Recibe TODAS las estrategias registradas, se queda con las que aplican a la compra,
 * las ordena por prioridad y las aplica en cascada (cada una sobre el resultado de la anterior).
 * No conoce ninguna estrategia concreta: solo trabaja contra la interfaz PricingStrategy.
 */
@Injectable()
export class PricingEngine {
  private readonly estrategias: readonly PricingStrategy[];

  constructor(@Inject(PRICING_STRATEGIES) estrategias: readonly PricingStrategy[]) {
    // Copia ordenada: no se muta el registro y el orden es estable entre llamadas.
    this.estrategias = [...estrategias].sort((a, b) => a.prioridad - b.prioridad);
  }

  calcular(input: PricingInput): PricingResult {
    const subtotal = redondear(input.precioUnitario * input.cantidad);
    const ctx: PricingContext = { ...input, subtotal };

    const pasos: PasoPrecio[] = [];
    let precio = subtotal;

    for (const estrategia of this.estrategias) {
      if (!estrategia.aplica(ctx)) continue;
      const precioAntes = precio;
      precio = redondear(estrategia.aplicar(precio, ctx));
      pasos.push({
        estrategia: estrategia.nombre,
        efecto: estrategia.descripcion(ctx),
        precioAntes,
        precioDespues: precio,
      });
    }

    return { subtotal, pasos, total: precio };
  }
}
