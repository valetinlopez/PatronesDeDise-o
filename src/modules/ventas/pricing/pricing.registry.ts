import { PricingStrategy } from './pricing-strategy.interface';
import { ClienteComunStrategy } from './strategies/cliente-comun.strategy';
import { ClientePremiumStrategy } from './strategies/cliente-premium.strategy';
import { ClienteVipStrategy } from './strategies/cliente-vip.strategy';
import { DescuentoBlackFridayStrategy } from './strategies/descuento-black-friday.strategy';
import { DescuentoCantidadMayorA10Strategy } from './strategies/descuento-cantidad-mayor-a-10.strategy';
import { DescuentoCantidadMayorA5Strategy } from './strategies/descuento-cantidad-mayor-a-5.strategy';
import { EnvioExpressStrategy } from './strategies/envio-express.strategy';
import { EnvioNormalStrategy } from './strategies/envio-normal.strategy';
import { PromocionEspecialStrategy } from './strategies/promocion-especial.strategy';
import { RetiroEnSucursalStrategy } from './strategies/retiro-en-sucursal.strategy';

/**
 * REGISTRO ÚNICO de estrategias de precio (composition root del patrón Strategy).
 * Lo usan el módulo Nest y el demo de consola.
 *
 * Para agregar una estrategia: crear su archivo en strategies/ y sumar UNA línea aquí.
 * No hay que modificar ninguna estrategia existente ni el PricingEngine.
 * El orden de este array no importa: el motor ordena por `prioridad`.
 */
export const ESTRATEGIAS_DE_PRECIO: readonly PricingStrategy[] = [
  // Descuento por tipo de cliente
  new ClienteComunStrategy(),
  new ClientePremiumStrategy(),
  new ClienteVipStrategy(),
  // Descuento por cantidad
  new DescuentoCantidadMayorA5Strategy(),
  new DescuentoCantidadMayorA10Strategy(),
  // Promociones especiales (se activan con el código en la compra)
  new PromocionEspecialStrategy('PROMO10', 10),
  new PromocionEspecialStrategy('PROMO5', 5),
  new DescuentoBlackFridayStrategy(),
  // Entrega
  new RetiroEnSucursalStrategy(),
  new EnvioNormalStrategy(),
  new EnvioExpressStrategy(),
];
