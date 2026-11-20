import { TipoCliente } from '../../src/modules/clientes/entities/tipo-cliente.enum';
import { MetodoEnvio } from '../../src/modules/ventas/entities/metodo-envio.enum';
import { PricingEngine, PricingInput } from '../../src/modules/ventas/pricing/pricing.engine';
import { ESTRATEGIAS_DE_PRECIO } from '../../src/modules/ventas/pricing/pricing.registry';
import { PricingContext, PricingStrategy } from '../../src/modules/ventas/pricing/pricing-strategy.interface';
import { ClienteComunStrategy } from '../../src/modules/ventas/pricing/strategies/cliente-comun.strategy';
import { ClientePremiumStrategy } from '../../src/modules/ventas/pricing/strategies/cliente-premium.strategy';
import { ClienteVipStrategy } from '../../src/modules/ventas/pricing/strategies/cliente-vip.strategy';
import { DescuentoCantidadMayorA10Strategy } from '../../src/modules/ventas/pricing/strategies/descuento-cantidad-mayor-a-10.strategy';
import { DescuentoCantidadMayorA5Strategy } from '../../src/modules/ventas/pricing/strategies/descuento-cantidad-mayor-a-5.strategy';
import { EnvioExpressStrategy } from '../../src/modules/ventas/pricing/strategies/envio-express.strategy';
import { EnvioNormalStrategy } from '../../src/modules/ventas/pricing/strategies/envio-normal.strategy';
import { PromocionEspecialStrategy } from '../../src/modules/ventas/pricing/strategies/promocion-especial.strategy';
import { RetiroEnSucursalStrategy } from '../../src/modules/ventas/pricing/strategies/retiro-en-sucursal.strategy';

const input = (over: Partial<PricingInput> = {}): PricingInput => ({
  cliente: { tipo: TipoCliente.COMUN },
  precioUnitario: 1000,
  cantidad: 1,
  envio: MetodoEnvio.RETIRO,
  promociones: [],
  ...over,
});

const ctx = (over: Partial<PricingInput> = {}): PricingContext => {
  const i = input(over);
  return { ...i, subtotal: i.precioUnitario * i.cantidad };
};

describe('Estrategias de precio (cada una es independiente)', () => {
  describe('por tipo de cliente', () => {
    it('should apply 0% to a common client', () => {
      const s = new ClienteComunStrategy();
      expect(s.aplica(ctx())).toBe(true);
      expect(s.aplicar(100000, ctx())).toBe(100000);
    });

    it('should apply 10% to a premium client only', () => {
      const s = new ClientePremiumStrategy();
      expect(s.aplica(ctx({ cliente: { tipo: TipoCliente.PREMIUM } }))).toBe(true);
      expect(s.aplica(ctx())).toBe(false);
      expect(s.aplicar(100000, ctx())).toBe(90000);
    });

    it('should apply 15% to a VIP client only', () => {
      const s = new ClienteVipStrategy();
      expect(s.aplica(ctx({ cliente: { tipo: TipoCliente.VIP } }))).toBe(true);
      expect(s.aplica(ctx({ cliente: { tipo: TipoCliente.PREMIUM } }))).toBe(false);
      expect(s.aplicar(100000, ctx())).toBe(85000);
    });
  });

  describe('por cantidad (rangos excluyentes)', () => {
    const cinco = new DescuentoCantidadMayorA5Strategy();
    const diez = new DescuentoCantidadMayorA10Strategy();

    it.each([
      [5, false, false],
      [6, true, false],
      [10, true, false],
      [11, false, true],
    ])('with %i units: >5 -> %s, >10 -> %s', (cantidad, aplica5, aplica10) => {
      expect(cinco.aplica(ctx({ cantidad }))).toBe(aplica5);
      expect(diez.aplica(ctx({ cantidad }))).toBe(aplica10);
    });

    it('should discount 5% and 10%', () => {
      expect(cinco.aplicar(100000, ctx())).toBe(95000);
      expect(diez.aplicar(100000, ctx())).toBe(90000);
    });
  });

  describe('promoción especial', () => {
    it('should apply only when the code is present', () => {
      const promo = new PromocionEspecialStrategy('PROMO10', 10);
      expect(promo.aplica(ctx({ promociones: ['PROMO10'] }))).toBe(true);
      expect(promo.aplica(ctx({ promociones: ['OTRA'] }))).toBe(false);
      expect(promo.aplicar(100000, ctx())).toBe(90000);
    });
  });

  describe('envío', () => {
    it.each([
      [new RetiroEnSucursalStrategy(), MetodoEnvio.RETIRO, 0],
      [new EnvioNormalStrategy(), MetodoEnvio.NORMAL, 5000],
      [new EnvioExpressStrategy(), MetodoEnvio.EXPRESS, 10000],
    ])('%o should add its fixed charge', (s, envio, monto) => {
      expect(s.aplica(ctx({ envio }))).toBe(true);
      expect(s.aplicar(100000, ctx({ envio }))).toBe(100000 + monto);
    });
  });
});

describe('PricingEngine', () => {
  const engine = new PricingEngine(ESTRATEGIAS_DE_PRECIO);

  it('should reproduce the TP example: VIP -15%, quantity -10%, promo -5%, express +$10.000', () => {
    // 20 x $5.000 = $100.000
    const r = engine.calcular(
      input({
        cliente: { tipo: TipoCliente.VIP },
        precioUnitario: 5000,
        cantidad: 20,
        envio: MetodoEnvio.EXPRESS,
        promociones: ['PROMO5'],
      })
    );

    expect(r.subtotal).toBe(100000);
    expect(r.pasos.map((p) => [p.estrategia, p.precioDespues])).toEqual([
      ['Cliente VIP', 85000],
      ['Descuento por cantidad (más de 10)', 76500],
      ['Promoción especial PROMO5', 72675],
      ['Envío express', 82675],
    ]);
    expect(r.total).toBe(82675);
  });

  it('should list a 0% step for a common client and a $0 step for pickup', () => {
    const r = engine.calcular(input({ precioUnitario: 100000 }));
    expect(r.pasos.map((p) => p.estrategia)).toEqual(['Cliente común', 'Retiro en sucursal']);
    expect(r.total).toBe(100000);
  });

  it('should apply shipping after every discount regardless of registration order', () => {
    const invertido = new PricingEngine([...ESTRATEGIAS_DE_PRECIO].reverse());
    const entrada = input({
      cliente: { tipo: TipoCliente.PREMIUM },
      precioUnitario: 10000,
      cantidad: 6,
      envio: MetodoEnvio.NORMAL,
    });
    // 60.000 -> -10% = 54.000 -> -5% = 51.300 -> +5.000
    expect(invertido.calcular(entrada).total).toBe(56300);
    expect(invertido.calcular(entrada)).toEqual(engine.calcular(entrada));
  });

  it('should not mutate the strategy list it receives', () => {
    const lista = [...ESTRATEGIAS_DE_PRECIO].reverse();
    const copia = [...lista];
    new PricingEngine(lista);
    expect(lista).toEqual(copia);
  });

  it('should accept a new strategy without modifying the existing ones (OCP)', () => {
    const descuentoNuevo: PricingStrategy = {
      nombre: 'Descuento de prueba',
      prioridad: 35,
      aplica: () => true,
      aplicar: (precio) => precio * 0.5,
      descripcion: () => '-50%',
    };
    const extendido = new PricingEngine([...ESTRATEGIAS_DE_PRECIO, descuentoNuevo]);
    const r = extendido.calcular(input({ precioUnitario: 100000 }));
    expect(r.pasos.map((p) => p.estrategia)).toContain('Descuento de prueba');
    expect(r.total).toBe(50000);
  });
});
