/**
 * Demo por consola del TP: Strategy + Chain of Responsibility.
 * Usa las MISMAS clases que la API, sin Nest ni base de datos.
 *
 *   npm run demo
 */
import { TipoCliente } from '../src/modules/clientes/entities/tipo-cliente.enum';
import { MetodoEnvio } from '../src/modules/ventas/entities/metodo-envio.enum';
import { PricingEngine } from '../src/modules/ventas/pricing/pricing.engine';
import { ESTRATEGIAS_DE_PRECIO } from '../src/modules/ventas/pricing/pricing.registry';
import { AbstractPedidoHandler } from '../src/modules/ventas/rules/abstract-pedido.handler';
import { construirCadena } from '../src/modules/ventas/rules/pedido-chain.builder';
import { PedidoContext } from '../src/modules/ventas/rules/pedido-context';
import { crearHandlersDePedido } from '../src/modules/ventas/rules/pedido-handlers.registry';

const pesos = (n: number): string => `$${n.toLocaleString('es-AR')}`;
const linea = (c = '─', n = 72): string => c.repeat(n);

interface Escenario {
  titulo: string;
  cliente: { nombre: string; tipo: TipoCliente; bloqueado: boolean };
  producto: { nombre: string; precio: number; stock: number };
  cantidad: number;
  envio: MetodoEnvio;
  promociones: string[];
  pago: { medio: string; saldoDisponible: number };
}

async function ejecutar(e: Escenario): Promise<void> {
  console.log(`\n${linea('═')}\n${e.titulo}\n${linea('═')}`);
  console.log(
    `Cliente: ${e.cliente.nombre} (${e.cliente.tipo}) | Producto: ${e.producto.nombre} x ${e.cantidad}` +
      ` | Envío: ${e.envio} | Promociones: ${e.promociones.join(', ') || 'ninguna'}`
  );

  // ── PARTE 1: STRATEGY ────────────────────────────────────────────────────
  const engine = new PricingEngine(ESTRATEGIAS_DE_PRECIO);
  const calculo = engine.calcular({
    cliente: e.cliente,
    precioUnitario: e.producto.precio,
    cantidad: e.cantidad,
    envio: e.envio,
    promociones: e.promociones,
  });

  console.log(`\n[STRATEGY] Precio de lista (subtotal): ${pesos(calculo.subtotal)}`);
  console.log('Estrategias aplicadas:');
  calculo.pasos.forEach((p, i) => {
    console.log(
      `  ${i + 1}. ${p.estrategia.padEnd(38)} ${p.efecto.padStart(9)}   ` +
        `${pesos(p.precioAntes)} -> ${pesos(p.precioDespues)}`
    );
  });
  console.log(`Precio final: ${pesos(calculo.total)}`);

  // ── PARTE 2: CHAIN OF RESPONSIBILITY ─────────────────────────────────────
  const handlers = crearHandlersDePedido();
  const cadena = construirCadena(handlers);
  const ctx: PedidoContext = {
    cliente: e.cliente,
    producto: e.producto,
    cantidad: e.cantidad,
    precioFinal: calculo.total,
    pago: e.pago,
    traza: [],
  };

  console.log('\n[CHAIN] Validación del pedido:');
  const resultado = await cadena.handle(ctx);
  resultado.traza.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.handler.padEnd(16)} ${p.ok ? 'OK   ' : 'ERROR'}  ${p.detalle}`);
  });

  const ejecutados = new Set(resultado.traza.map((p) => p.handler));
  const omitidos = (handlers as AbstractPedidoHandler[])
    .map((h) => h.nombre)
    .filter((n) => !ejecutados.has(n));
  omitidos.forEach((n) => console.log(`  -  ${n.padEnd(16)} (no se ejecuta: la cadena se detuvo)`));

  console.log(
    resultado.aprobado
      ? `\nResultado: PEDIDO APROBADO por ${pesos(calculo.total)}`
      : `\nResultado: PEDIDO RECHAZADO por "${resultado.rechazadoPor}" -> ${resultado.motivo}`
  );
}

async function main(): Promise<void> {
  await ejecutar({
    titulo: 'ESCENARIO 1 — Pedido aprobado',
    cliente: { nombre: 'Lucia Gomez', tipo: TipoCliente.VIP, bloqueado: false },
    producto: { nombre: 'Teclado Mecanico', precio: 15000, stock: 20 },
    cantidad: 12,
    envio: MetodoEnvio.EXPRESS,
    promociones: ['PROMO5'],
    pago: { medio: 'TARJETA', saldoDisponible: 500000 },
  });

  await ejecutar({
    titulo: 'ESCENARIO 2 — Pedido rechazado por falta de stock',
    cliente: { nombre: 'Juan Perez', tipo: TipoCliente.COMUN, bloqueado: false },
    producto: { nombre: 'Monitor 24"', precio: 60000, stock: 3 },
    cantidad: 5,
    envio: MetodoEnvio.RETIRO,
    promociones: [],
    pago: { medio: 'TARJETA', saldoDisponible: 1000000 },
  });

  await ejecutar({
    titulo: 'ESCENARIO 3 — Pedido rechazado por problema en el pago',
    cliente: { nombre: 'Maria Lopez', tipo: TipoCliente.PREMIUM, bloqueado: false },
    producto: { nombre: 'Mouse Gamer', precio: 8000, stock: 50 },
    cantidad: 8,
    envio: MetodoEnvio.NORMAL,
    promociones: ['PROMO5'],
    pago: { medio: 'TARJETA', saldoDisponible: 20000 },
  });

  // ── DESAFÍO: Black Friday y Límite de compra, agregados sin tocar lo existente ──
  await ejecutar({
    titulo: 'ESCENARIO 4 — Desafío: DescuentoBlackFriday se suma a las demás estrategias',
    cliente: { nombre: 'Lucia Gomez', tipo: TipoCliente.VIP, bloqueado: false },
    producto: { nombre: 'Teclado Mecanico', precio: 15000, stock: 20 },
    cantidad: 12,
    envio: MetodoEnvio.EXPRESS,
    promociones: ['PROMO5', 'BLACK_FRIDAY'],
    pago: { medio: 'TARJETA', saldoDisponible: 500000 },
  });

  await ejecutar({
    titulo: 'ESCENARIO 5 — Desafío: ValidarLimiteCompra corta la cadena antes del pago',
    cliente: { nombre: 'Juan Perez', tipo: TipoCliente.COMUN, bloqueado: false },
    producto: { nombre: 'Mouse Gamer', precio: 8000, stock: 500 },
    cantidad: 60,
    envio: MetodoEnvio.RETIRO,
    promociones: [],
    pago: { medio: 'TRANSFERENCIA', saldoDisponible: 5000000 },
  });

  console.log(`\n${linea('═')}\nFin del demo\n${linea('═')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
