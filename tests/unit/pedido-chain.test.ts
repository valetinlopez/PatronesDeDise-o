import { construirCadena } from '../../src/modules/ventas/rules/pedido-chain.builder';
import { PedidoContext } from '../../src/modules/ventas/rules/pedido-context';
import { crearHandlersDePedido } from '../../src/modules/ventas/rules/pedido-handlers.registry';
import { ValidarClienteHandler } from '../../src/modules/ventas/rules/handlers/validar-cliente.handler';
import { ValidarPagoHandler } from '../../src/modules/ventas/rules/handlers/validar-pago.handler';
import { ValidarStockHandler } from '../../src/modules/ventas/rules/handlers/validar-stock.handler';

const pedido = (over: Partial<Omit<PedidoContext, 'traza'>> = {}): PedidoContext => ({
  cliente: { nombre: 'Lucia', bloqueado: false },
  producto: { nombre: 'Mouse', stock: 10 },
  cantidad: 2,
  precioFinal: 20000,
  pago: { medio: 'TARJETA', saldoDisponible: 50000 },
  traza: [],
  ...over,
});

describe('Cadena de validación del pedido', () => {
  it('should approve an order when every handler passes and trace every step', async () => {
    // Lista explícita: este test verifica la mecánica de la cadena, no la composición del registry.
    const cadena = construirCadena([
      new ValidarClienteHandler(),
      new ValidarStockHandler(),
      new ValidarPagoHandler(),
    ]);
    const r = await cadena.handle(pedido());

    expect(r.aprobado).toBe(true);
    expect(r.traza.map((p) => [p.handler, p.ok])).toEqual([
      ['Validar Cliente', true],
      ['Validar Stock', true],
      ['Validar Pago', true],
    ]);
  });

  it('should reject for lack of stock and NOT run the payment handler', async () => {
    const pago = new ValidarPagoHandler();
    const pagoSpy = jest.spyOn(pago, 'handle');
    const cadena = construirCadena([new ValidarClienteHandler(), new ValidarStockHandler(), pago]);

    const r = await cadena.handle(pedido({ cantidad: 99 }));

    expect(r.aprobado).toBe(false);
    expect(r.rechazadoPor).toBe('Validar Stock');
    expect(r.error?.message).toBe('Stock insuficiente');
    expect(r.error?.code).toBe('STOCK_INSUFICIENTE');
    expect(pagoSpy).not.toHaveBeenCalled();
    expect(r.traza.map((p) => p.handler)).toEqual(['Validar Cliente', 'Validar Stock']);
  });

  it('should reject for a payment problem after client and stock passed', async () => {
    const cadena = construirCadena([
      new ValidarClienteHandler(),
      new ValidarStockHandler(),
      new ValidarPagoHandler(),
    ]);
    const r = await cadena.handle(pedido({ pago: { medio: 'TARJETA', saldoDisponible: 100 } }));

    expect(r.aprobado).toBe(false);
    expect(r.rechazadoPor).toBe('Validar Pago');
    expect(r.error?.code).toBe('PAGO_RECHAZADO');
    expect(r.traza.map((p) => p.ok)).toEqual([true, true, false]);
  });

  it('should stop at the first handler when the client is blocked', async () => {
    const stock = new ValidarStockHandler();
    const stockSpy = jest.spyOn(stock, 'handle');
    const cadena = construirCadena([new ValidarClienteHandler(), stock, new ValidarPagoHandler()]);

    const r = await cadena.handle(pedido({ cliente: { nombre: 'Carlos', bloqueado: true } }));

    expect(r.rechazadoPor).toBe('Validar Cliente');
    expect(r.error?.message).toBe('Cliente bloqueado');
    expect(stockSpy).not.toHaveBeenCalled();
    expect(r.traza).toHaveLength(1);
  });

  it('should follow the order of the list it is built from', async () => {
    // Pago primero: con saldo insuficiente y stock insuficiente, el primero en fallar es Pago.
    const cadena = construirCadena([new ValidarPagoHandler(), new ValidarStockHandler()]);
    const r = await cadena.handle(
      pedido({ cantidad: 99, pago: { medio: 'EFECTIVO', saldoDisponible: 1 } })
    );
    expect(r.rechazadoPor).toBe('Validar Pago');
  });

  it('should build independent chains from the registry', async () => {
    const a = construirCadena(crearHandlersDePedido());
    const b = construirCadena(crearHandlersDePedido());
    expect(a).not.toBe(b);
    expect((await b.handle(pedido())).aprobado).toBe(true);
  });

  it('should refuse to build an empty chain', () => {
    expect(() => construirCadena([])).toThrow('al menos un handler');
  });
});
