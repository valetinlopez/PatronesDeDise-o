import { TipoCliente } from '../../src/modules/clientes/entities/tipo-cliente.enum';
import { MetodoEnvio } from '../../src/modules/ventas/entities/metodo-envio.enum';
import { PricingEngine } from '../../src/modules/ventas/pricing/pricing.engine';
import { ESTRATEGIAS_DE_PRECIO } from '../../src/modules/ventas/pricing/pricing.registry';
import {
  CODIGO_BLACK_FRIDAY,
  DescuentoBlackFridayStrategy,
} from '../../src/modules/ventas/pricing/strategies/descuento-black-friday.strategy';
import {
  LIMITE_MONTO,
  LIMITE_UNIDADES,
  ValidarLimiteCompraHandler,
} from '../../src/modules/ventas/rules/handlers/validar-limite-compra.handler';
import { construirCadena } from '../../src/modules/ventas/rules/pedido-chain.builder';
import { PedidoContext } from '../../src/modules/ventas/rules/pedido-context';
import { crearHandlersDePedido } from '../../src/modules/ventas/rules/pedido-handlers.registry';

const compra = (promociones: string[] = []) => ({
  cliente: { tipo: TipoCliente.VIP },
  precioUnitario: 5000,
  cantidad: 20,
  envio: MetodoEnvio.EXPRESS,
  promociones,
});

const pedido = (over: Partial<Omit<PedidoContext, 'traza'>> = {}): PedidoContext => ({
  cliente: { nombre: 'Lucia', bloqueado: false },
  producto: { nombre: 'Mouse', stock: 1000 },
  cantidad: 2,
  precioFinal: 20000,
  pago: { medio: 'TARJETA', saldoDisponible: 10_000_000 },
  traza: [],
  ...over,
});

/** DESAFÍO: ambos elementos se incorporan sin modificar estrategias ni validadores existentes. */
describe('Desafío — DescuentoBlackFriday', () => {
  const engine = new PricingEngine(ESTRATEGIAS_DE_PRECIO);

  it('should apply -20% only when the BLACK_FRIDAY code is present', () => {
    const s = new DescuentoBlackFridayStrategy();
    const base = { ...compra(), subtotal: 100000 };
    expect(s.aplica({ ...base, promociones: [CODIGO_BLACK_FRIDAY] })).toBe(true);
    expect(s.aplica(base)).toBe(false);
    expect(s.aplicar(100000)).toBe(80000);
  });

  it('should combine with the existing strategies in cascade, before shipping', () => {
    const r = engine.calcular(compra(['PROMO5', CODIGO_BLACK_FRIDAY]));
    expect(r.pasos.map((p) => [p.estrategia, p.precioDespues])).toEqual([
      ['Cliente VIP', 85000],
      ['Descuento por cantidad (más de 10)', 76500],
      ['Promoción especial PROMO5', 72675],
      ['Descuento Black Friday', 58140],
      ['Envío express', 68140],
    ]);
    expect(r.total).toBe(68140);
  });

  it('should leave prices unchanged when the code is absent (existing behaviour intact)', () => {
    expect(engine.calcular(compra(['PROMO5'])).total).toBe(82675);
  });
});

describe('Desafío — ValidarLimiteCompra', () => {
  it('should sit between Stock and Pago in the registry chain', async () => {
    const r = await construirCadena(crearHandlersDePedido()).handle(pedido());
    expect(r.aprobado).toBe(true);
    expect(r.traza.map((p) => p.handler)).toEqual([
      'Validar Cliente',
      'Validar Stock',
      'Validar Limite',
      'Validar Pago',
    ]);
  });

  it('should reject over the unit limit and skip the payment handler', async () => {
    const r = await construirCadena(crearHandlersDePedido()).handle(
      pedido({ cantidad: LIMITE_UNIDADES + 1 })
    );
    expect(r.aprobado).toBe(false);
    expect(r.rechazadoPor).toBe('Validar Limite');
    expect(r.error?.code).toBe('LIMITE_COMPRA_EXCEDIDO');
    expect(r.traza.map((p) => p.handler)).not.toContain('Validar Pago');
  });

  it('should reject over the amount limit', async () => {
    const r = await construirCadena(crearHandlersDePedido()).handle(
      pedido({ precioFinal: LIMITE_MONTO + 1 })
    );
    expect(r.rechazadoPor).toBe('Validar Limite');
  });

  it('should accept exactly the limits', async () => {
    const h = new ValidarLimiteCompraHandler();
    const r = await construirCadena([h]).handle(
      pedido({ cantidad: LIMITE_UNIDADES, precioFinal: LIMITE_MONTO })
    );
    expect(r.aprobado).toBe(true);
  });

  it('should still fail on stock before reaching the new limit handler', async () => {
    const r = await construirCadena(crearHandlersDePedido()).handle(
      pedido({ cantidad: 5, producto: { nombre: 'Mouse', stock: 1 } })
    );
    expect(r.rechazadoPor).toBe('Validar Stock');
    expect(r.traza.map((p) => p.handler)).not.toContain('Validar Limite');
  });
});
