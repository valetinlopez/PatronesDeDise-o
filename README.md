# Sistema de Ventas — Strategy + Chain of Responsibility (NestJS)

TP de **Patrones de Diseño** implementado sobre una API REST de ventas en **NestJS + TypeScript + TypeORM (SQLite)**.
Este README es también una **guía de estudio**: explica qué se hizo, **por qué se hizo así** y qué alternativas se descartaron.

> Si solo querés ver el TP funcionando: `npm install && npm run demo`.

## Índice

1. [Mapa del TP: requisito → dónde está](#1-mapa-del-tp-requisito--dónde-está)
2. [Inicio rápido](#2-inicio-rápido)
3. [Guía de estudio](#3-guía-de-estudio)
   - [3.1 El problema de partida](#31-el-problema-de-partida)
   - [3.2 Strategy](#32-strategy-parte-1)
   - [3.3 Varias estrategias a la vez: cascada vs aditivo](#33-varias-estrategias-a-la-vez-cascada-vs-aditivo)
   - [3.4 Chain of Responsibility](#34-chain-of-responsibility-parte-2)
   - [3.5 Cómo trabajan juntos](#35-cómo-trabajan-juntos-los-dos-patrones)
   - [3.6 SOLID en este proyecto](#36-solid-en-este-proyecto)
   - [3.7 El Desafío como prueba del Open/Closed](#37-el-desafío-como-prueba-del-openclosed)
   - [3.8 Decisiones, trade-offs y alternativas descartadas](#38-decisiones-trade-offs-y-alternativas-descartadas)
4. [Respuestas a las preguntas del TP](#4-respuestas-a-las-preguntas-del-tp)
5. [Salida del demo](#5-salida-del-demo)
6. [Recetas: cómo extender el sistema](#6-recetas-cómo-extender-el-sistema)
7. [Preguntas de repaso y glosario](#7-preguntas-de-repaso-y-glosario)
8. [Referencia de la API](#8-referencia-de-la-api)
9. [Estructura y documentación](#9-estructura-y-documentación)

---

## 1. Mapa del TP: requisito → dónde está

| Requisito del TP | Dónde está |
|---|---|
| Interfaz/clases del patrón Strategy | `src/modules/ventas/pricing/pricing-strategy.interface.ts`, `pricing.engine.ts` |
| Mínimo 3 estrategias (hay 9 clases) | `src/modules/ventas/pricing/strategies/` |
| Varias estrategias en una misma compra | `PricingEngine.calcular()` (aplica todas las que corresponden, en cascada) |
| Agregar estrategias sin modificar las existentes | `pricing.registry.ts` (1 línea por estrategia) |
| Interfaz/clases del patrón Chain | `src/modules/ventas/rules/abstract-pedido.handler.ts`, `pedido-handler.interface.ts`, `pedido-chain.builder.ts` |
| Mínimo 3 handlers: Cliente → Stock → Pago | `src/modules/ventas/rules/handlers/` |
| Cada handler decide si continúa o detiene | `AbstractPedidoHandler.handle()` |
| 3 escenarios (aprobado, stock, pago) por consola | `scripts/demo.ts` → `npm run demo` |
| Mostrar estrategias, precio y pasos de la cadena | Salida del demo ([sección 5](#5-salida-del-demo)) |
| Diagrama UML | [`docs/DIAGRAMA-CLASES.md`](docs/DIAGRAMA-CLASES.md) |
| Explicación breve (4 preguntas) | [Sección 4](#4-respuestas-a-las-preguntas-del-tp) |
| Desafío: `DescuentoBlackFriday` y `ValidarLimiteCompra` | `strategies/descuento-black-friday.strategy.ts`, `handlers/validar-limite-compra.handler.ts` ([3.7](#37-el-desafío-como-prueba-del-openclosed)) |

## 2. Inicio rápido

Requisitos: Node.js >= 20, npm >= 9.

```bash
npm install
npm run demo        # los 5 escenarios del TP por consola (sin base de datos)
npm test            # 47 tests (unitarios + e2e)
npm run start:dev   # API en http://localhost:3000  ·  Swagger en /api-docs
```

| Script | Descripción |
|---|---|
| `npm run demo` | Escenarios del TP por consola |
| `npm run start:dev` | API con recarga |
| `npm run build` / `npm start` | Compilar / ejecutar `dist/` |
| `npm test` · `test:unit` · `test:e2e` | Tests (con cobertura) |
| `npm run lint` · `lint:fix` · `format` | Calidad de código |

Instalación guiada: `scripts/install.sh` (Unix) o `scripts\install.bat` (Windows). Docker: `docker compose up --build` (la base persiste en el volumen `ventas_data`).

---

## 3. Guía de estudio

### 3.1 El problema de partida

Sin patrones, el cálculo de una compra suele terminar así:

```ts
// ❌ Lo que queremos evitar
let precio = subtotal;
if (cliente.tipo === 'VIP') precio *= 0.85;
else if (cliente.tipo === 'PREMIUM') precio *= 0.90;
if (cantidad > 10) precio *= 0.90;
else if (cantidad > 5) precio *= 0.95;
if (promos.includes('PROMO5')) precio *= 0.95;
if (envio === 'EXPRESS') precio += 10000;
else if (envio === 'NORMAL') precio += 5000;
// ...y después otro bloque de if para validar cliente, stock, pago...
```

Problemas concretos:

- **Cada regla nueva obliga a editar este bloque** (riesgo de romper las que ya andaban). Viola *Open/Closed*.
- **Una sola función hace de todo** (descuenta, suma envío, valida). Viola *Single Responsibility*.
- **No se puede probar una regla sola**: hay que armar toda la compra.
- **El orden está implícito** en el orden de los `if`, y nadie lo documenta.

Los dos patrones del TP atacan dos mitades distintas del problema:

| | Strategy | Chain of Responsibility |
|---|---|---|
| Pregunta que responde | *¿Cómo se calcula esto?* | *¿Puede este pedido seguir adelante?* |
| Qué reemplaza | El bloque de `if` de precios | El bloque de `if` de validaciones |
| Cuántos participan | Todos los que **apliquen** | Todos hasta el **primer rechazo** |
| Qué produce | Un número (el precio final) | Un veredicto (aprobado / rechazado + motivo) |

### 3.2 Strategy (Parte 1)

**Idea:** sacar cada regla a su propia clase, todas con la **misma interfaz**, y que un objeto central (el *Context*) las use sin saber cuál es cuál.

**Roles del patrón y quién los cumple:**

| Rol | En este proyecto |
|---|---|
| **Strategy** (interfaz) | `PricingStrategy` |
| **ConcreteStrategy** | `ClienteVipStrategy`, `EnvioExpressStrategy`, `PromocionEspecialStrategy`, ... |
| **Context** | `PricingEngine` |
| **Client** | `VentasService` (y `scripts/demo.ts`) |

**La interfaz** (`pricing-strategy.interface.ts`):

```ts
export interface PricingStrategy {
  readonly nombre: string;
  readonly prioridad: number;                      // orden de aplicación
  aplica(ctx: PricingContext): boolean;            // ¿corresponde a esta compra?
  aplicar(precioActual: number, ctx): number;      // precio nuevo
  descripcion(ctx): string;                        // "-15%", "+$10.000"
}
```

**Una estrategia concreta** — todo lo que sabe es lo suyo:

```ts
export class ClienteVipStrategy extends DescuentoPorcentualStrategy {
  readonly nombre = 'Cliente VIP';
  readonly prioridad = 10;
  protected readonly porcentaje = 15;
  aplica(ctx: PricingContext) { return ctx.cliente.tipo === TipoCliente.VIP; }
}
```

**El Context** (`pricing.engine.ts`) — no menciona ninguna estrategia concreta:

```ts
calcular(input: PricingInput): PricingResult {
  const subtotal = redondear(input.precioUnitario * input.cantidad);
  const ctx = { ...input, subtotal };
  let precio = subtotal;
  for (const estrategia of this.estrategias) {        // ya ordenadas por prioridad
    if (!estrategia.aplica(ctx)) continue;
    const precioAntes = precio;
    precio = redondear(estrategia.aplicar(precio, ctx));
    pasos.push({ estrategia: estrategia.nombre, efecto: estrategia.descripcion(ctx),
                 precioAntes, precioDespues: precio });
  }
  return { subtotal, pasos, total: precio };
}
```

**Estrategias del TP** (cada una en su archivo, `pricing/strategies/`):

| Regla | Clase | Efecto | Prioridad |
|---|---|---|---|
| Cliente común | `ClienteComunStrategy` | 0% | 10 |
| Cliente Premium | `ClientePremiumStrategy` | -10% | 10 |
| Cliente VIP | `ClienteVipStrategy` | -15% | 10 |
| Más de 5 productos | `DescuentoCantidadMayorA5Strategy` | -5% (6 a 10 u.) | 20 |
| Más de 10 productos | `DescuentoCantidadMayorA10Strategy` | -10% | 20 |
| Promoción especial | `PromocionEspecialStrategy(codigo, %)` | -X% si viene el código | 30 |
| Retiro en sucursal | `RetiroEnSucursalStrategy` | +$0 | 90 |
| Envío normal | `EnvioNormalStrategy` | +$5.000 | 90 |
| Envío express | `EnvioExpressStrategy` | +$10.000 | 90 |

Dos clases base (Template Method) evitan repetir código: `DescuentoPorcentualStrategy` (solo declara el `porcentaje`) y `CargoFijoStrategy` (solo declara el `monto`).

### 3.3 Varias estrategias a la vez: cascada vs aditivo

El TP pide que **una misma compra use varias estrategias**. Eso abre una decisión que el enunciado no resuelve: ¿cómo se combinan los porcentajes? Con el ejemplo del TP ($100.000, VIP -15%, cantidad -10%, promo -5%, envío +$10.000):

| Enfoque | Cálculo | Resultado |
|---|---|---|
| **Cascada** (elegido) | 100.000 → ×0,85 = 85.000 → ×0,90 = 76.500 → ×0,95 = 72.675 → +10.000 | **$82.675** |
| Aditivo sobre la base | 100.000 × (1 − 0,15 − 0,10 − 0,05) = 70.000 → +10.000 | $80.000 |

**Por qué cascada:**

1. Es el comportamiento natural del patrón: cada estrategia recibe *el precio actual* y devuelve *el nuevo*. No necesita conocer a las demás.
2. En el modo aditivo habría que **sumar porcentajes antes de aplicar**, lo que obliga a una estrategia (o al motor) a saber qué otras corrieron: se rompe la independencia que pide el TP.
3. Un descuento nunca puede dejar el precio en negativo (en aditivo, 40% + 40% + 30% sí).
4. El envío es un **cargo fijo**, no un porcentaje: tiene que ir **después** de los descuentos (si no, se estaría descontando sobre el envío). Por eso existe `prioridad`.

**Cómo se garantiza el orden:** el motor ordena por `prioridad` (descuentos 10–39, envío 90). El orden en que se *registran* es irrelevante: hay un test que registra todo al revés y obtiene el mismo resultado.

**¿Por qué "más de 5" y "más de 10" no se pisan?** Con 12 unidades, ambas reglas literalmente se cumplen. Hay dos formas de resolverlo:

- (a) Que el motor sepa que son excluyentes → acopla el motor al dominio. ❌
- (b) Que cada estrategia defina un **rango excluyente** (`>5 y <=10` vs `>10`). ✅ Cada una sigue siendo independiente.

### 3.4 Chain of Responsibility (Parte 2)

**Idea:** el pedido pasa por una cadena de eslabones. Cada uno hace **una** validación y decide: *continuar* (pasar al siguiente) o *cortar* (rechazar y explicar por qué). El que arma el pedido no sabe cuántos eslabones hay ni en qué orden.

**Roles del patrón y quién los cumple:**

| Rol | En este proyecto |
|---|---|
| **Handler** (interfaz) | `PedidoHandler` (`setNext`, `handle`) |
| **Base Handler** | `AbstractPedidoHandler` (guarda el siguiente y fija el algoritmo) |
| **ConcreteHandler** | `ValidarClienteHandler`, `ValidarStockHandler`, `ValidarPagoHandler` |
| **Client** | `VentasService` (y `scripts/demo.ts`) |

**El corazón** (`abstract-pedido.handler.ts`):

```ts
async handle(ctx: PedidoContext): Promise<ResultadoPedido> {
  const paso = await this.validar(ctx);                 // ← lo único que cambia en cada handler
  ctx.traza.push({ handler: this.nombre, ok: paso.ok, detalle: paso.detalle });

  if (!paso.ok) {                                       // ❌ CORTA: no se llama al siguiente
    return { aprobado: false, rechazadoPor: this.nombre, motivo: paso.detalle,
             error: paso.error, traza: ctx.traza };
  }
  return this.siguiente                                  // ✅ continúa
    ? this.siguiente.handle(ctx)
    : { aprobado: true, traza: ctx.traza };
}
```

**Un handler concreto** solo implementa su validación:

```ts
export class ValidarStockHandler extends AbstractPedidoHandler {
  readonly nombre = 'Validar Stock';
  protected validar(ctx: PedidoContext): ResultadoPaso {
    if (ctx.producto.stock < ctx.cantidad) {
      return this.rechazar(new BusinessRuleError('Stock insuficiente', 'STOCK_INSUFICIENTE'),
        `Stock insuficiente de "${ctx.producto.nombre}": disponible ..., solicitado ...`);
    }
    return this.aprobar(`Hay stock de "${ctx.producto.nombre}": ...`);
  }
}
```

**Cómo se arma la cadena** (`pedido-chain.builder.ts` + `pedido-handlers.registry.ts`): una lista ordenada que se enlaza con `setNext`. **El orden de la lista es el orden de ejecución.**

```ts
export function crearHandlersDePedido(): PedidoHandler[] {
  return [new ValidarClienteHandler(), new ValidarStockHandler(),
          new ValidarLimiteCompraHandler(), new ValidarPagoHandler()];
}
```

**¿Por qué ese orden (Cliente → Stock → Pago)?** De lo más barato y más probable de fallar a lo más costoso. Rechazar a un cliente bloqueado no cuesta nada; cobrar es lo último porque en un sistema real es lo más difícil de revertir. Esto es una decisión de negocio y por eso vive en **un solo lugar** (el registry).

**¿Y si un handler quiere seguir pese a un fallo?** `handle()` es sobreescribible: un handler "informativo" podría registrar una advertencia y llamar igual al siguiente. El TP pide que *cada handler pueda decidir*, y esa decisión queda en el handler, no en el cliente.

### 3.5 Cómo trabajan juntos los dos patrones

Son **independientes** pero se encadenan en el flujo: el TP dice que la cadena corre *"una vez calculado el precio final"*, porque `ValidarPago` necesita el precio final para comparar contra el saldo.

```
POST /ventas
   │
   ▼
VentasService.crear()                         ┌── dentro de UNA transacción ──┐
   1. cargar cliente y producto  ─────────────┤ 404 si no existen             │
   2. PricingEngine.calcular()   ◄── STRATEGY │ → subtotal, pasos, total      │
   3. cadena.handle(pedido)      ◄── CHAIN    │ Cliente → Stock → Límite → Pago
   4. ¿rechazado?  → throw error ─────────────┤ rollback, nada se guarda      │
   5. descontar stock + guardar venta         └───────────────────────────────┘
```

El **resultado de un patrón es entrada del otro**: `precioFinal` (salida de Strategy) viaja dentro de `PedidoContext` hacia la cadena. Mirá el UML en [`docs/DIAGRAMA-CLASES.md`](docs/DIAGRAMA-CLASES.md).

`POST /ventas/cotizar` ejecuta solo el paso 2: sirve para ver qué estrategias aplican sin crear nada.

### 3.6 SOLID en este proyecto

| Principio | Cómo se cumple (con clases reales) |
|---|---|
| **S** — una sola razón de cambio | Cada estrategia cambia solo si cambia *su* regla. Cada handler valida *una* cosa. `VentasService` solo orquesta: no tiene un `if` de precio ni de validación. |
| **O** — abierto a extensión, cerrado a modificación | Agregar `DescuentoBlackFriday` o `ValidarLimiteCompra` = archivo nuevo + 1 línea en el registry ([3.7](#37-el-desafío-como-prueba-del-openclosed)). |
| **L** — sustitución de Liskov | Cualquier `PricingStrategy` puede ocupar el lugar de otra en el motor; cualquier `PedidoHandler` en la cadena. Los tests usan una estrategia inline sin tocar el motor. |
| **I** — interfaces chicas | `PricingStrategy` y `PedidoHandler` tienen pocos métodos. `IVentaRepository` omite `update` porque las ventas no se modifican. |
| **D** — depender de abstracciones | `VentasService` recibe `PricingEngine`, `PEDIDO_CHAIN` (un `PedidoHandler`) y repositorios por **tokens e interfaces**. Los handlers son puros (sin DB), por eso el demo corre sin Nest. |

### 3.7 El Desafío como prueba del Open/Closed

> *"Sin modificar las estrategias ni los validadores existentes, agregar `DescuentoBlackFriday` y `ValidarLimiteCompra`."*

Lo que se hizo:

| Elemento | Archivo nuevo | Línea agregada |
|---|---|---|
| `DescuentoBlackFriday` (-20% con código `BLACK_FRIDAY`, prioridad 35) | `pricing/strategies/descuento-black-friday.strategy.ts` | 1 en `pricing.registry.ts` |
| `ValidarLimiteCompra` (máx. 50 unidades o $1.000.000), entre Stock y Pago | `rules/handlers/validar-limite-compra.handler.ts` | 1 en `pedido-handlers.registry.ts` |

**Evidencia, no solo afirmación:** antes de agregarlos se calculó el SHA-1 de los 24 archivos de `pricing/`, `rules/`, `ventas.service.ts` y `ventas.module.ts`. Después, **22 siguen idénticos** (motor, todas las estrategias, todos los handlers, la clase base, el builder, el service y el módulo); solo cambiaron los dos registries. Los tests de `desafio.test.ts` confirman que el comportamiento anterior no cambia (sin el código `BLACK_FRIDAY` el total del ejemplo sigue siendo $82.675).

**El límite, dicho con honestidad:** el registry **sí se edita**. Es el *composition root* (el único lugar que conoce las clases concretas). No es una violación: alguien tiene que decidir qué piezas componen el sistema, y concentrarlo en una línea por pieza es lo mínimo posible sin recurrir a descubrimiento automático (ver 3.8).

**Una consecuencia real que apareció:** al sumar el cuarto handler, dos de mis tests fallaron porque armaban la cadena desde el registry y esperaban exactamente 3 pasos. No era un bug del Desafío sino tests **acoplados a la composición**; se pasaron a una lista explícita de handlers (prueban la *mecánica* de la cadena, no el contenido del registry). Moraleja: los tests de un patrón deben construir su propio escenario, no depender de la configuración global.

### 3.8 Decisiones, trade-offs y alternativas descartadas

| Decisión | Por qué | Alternativa descartada |
|---|---|---|
| `aplica()` dentro de cada estrategia | El motor no necesita un `switch` por tipo de cliente/envío; agregar una estrategia no toca el motor | Elegir la estrategia con un `if`/`switch` fuera → vuelve el problema original |
| Motor ordena por `prioridad` | El resultado no depende del orden de registro; los cargos fijos siempre van al final | Orden = orden del array (frágil, un cambio de línea cambia el precio) |
| Rangos excluyentes en cantidad | Estrategias independientes entre sí | Que el motor conozca la exclusión |
| Registry con instancias sin DI | Lo comparten Nest y el demo; las estrategias no tienen dependencias | `@Injectable` + `DiscoveryService`: sin tocar registry, pero más "magia" y difícil de explicar |
| Handlers **puros** (reciben cliente, producto y precio ya cargados) | Se prueban sin DB y corren en el demo de consola | Handlers que consultan repositorios: mezclan I/O con la validación y obligan a mockear |
| **Template Method** en `AbstractPedidoHandler` | La lógica "si falla corto, si pasa sigo" está en un solo lugar; no se repite ni se olvida en ningún handler | Cada handler llama a `next` a mano (3 copias del mismo flujo, fácil de olvidar un `return`) |
| El rechazo es un **valor** (`ResultadoPedido`), no una excepción | Cortar la cadena es un resultado *esperado*, no un error del programa; la traza completa viaja con él | `throw` en cada handler: se pierde la traza y se mezcla control de flujo con errores |
| El rechazo lleva el `AppError` a lanzar | `VentasService` lo lanza **una vez**, fuera de la cadena, y el filtro global responde con el HTTP y mensaje correctos (`Cliente bloqueado`, `Stock insuficiente`, `PAGO_RECHAZADO`) | Que la cadena conozca HTTP |
| Cadena armada **una vez** en el módulo | Los handlers guardan su `siguiente` pero no estado del pedido (el estado va en `PedidoContext`), así que es seguro compartirla entre requests | Armar una cadena por request (innecesario) |
| Precio **antes** de la cadena | `ValidarPago` necesita el precio final | Cadena primero: no hay con qué validar el pago |
| Pago simulado (`saldoDisponible`) | El TP evalúa el patrón, no una pasarela | Integrar un proveedor real |
| Descuento y 404 antes de la cadena | Cliente o producto inexistentes no son un "rechazo del pedido" sino un recurso que no existe: 404 | Meterlo en un handler (el handler necesitaría acceso a DB) |

---

## 4. Respuestas a las preguntas del TP

**¿Qué problema resuelve Strategy?**
Permite **encapsular cada algoritmo o regla** (acá, cada forma de modificar el precio) en su propia clase con una interfaz común, y **intercambiarlas o combinarlas** sin tocar el código que las usa. Elimina los `if/else` o `switch` gigantes, hace que cada regla sea testeable por separado y permite agregar reglas nuevas sin modificar las existentes (Open/Closed).

**¿Por qué una compra puede necesitar varias estrategias?**
Porque el precio final es el resultado de **reglas independientes que ocurren a la vez**: quién compra (tipo de cliente), cuánto compra (cantidad), qué promoción trae y cómo recibe el pedido (envío). Una compra de un cliente VIP con 12 unidades, una promo y envío express cumple cuatro reglas al mismo tiempo. Si hubiera una sola estrategia por compra habría que crear una clase por cada combinación posible (explosión combinatoria); aplicando varias en cascada, cada regla se escribe una vez y se combina sola.

**¿Qué problema resuelve Chain of Responsibility?**
Desacopla **quién envía una solicitud de quién la procesa**, dejando que varios objetos tengan la oportunidad de manejarla en secuencia. Acá evita un método gigante con todas las validaciones: cada control es una clase con una responsabilidad, el orden se configura en un solo lugar y se pueden agregar, quitar o reordenar controles sin tocar los demás.

**¿Qué sucede cuando un elemento de la cadena rechaza el pedido?**
La cadena **se detiene en ese punto**: el handler registra su paso con el motivo, devuelve un `ResultadoPedido` con `aprobado: false`, `rechazadoPor` y `motivo`, y **no invoca al siguiente**. Los eslabones posteriores no se ejecutan (hay tests que lo verifican con un spy). `VentasService` lanza entonces el error asociado y la **transacción hace rollback**, así que no se descuenta stock ni se guarda la venta. Ejemplo: Cliente OK → Stock OK → Pago ERROR ⇒ pedido rechazado por el pago.

---

## 5. Salida del demo

`npm run demo` — extracto del **escenario 1** (los cinco están en la consola):

```
ESCENARIO 1 — Pedido aprobado
Cliente: Lucia Gomez (VIP) | Producto: Teclado Mecanico x 12 | Envío: EXPRESS | Promociones: PROMO5

[STRATEGY] Precio de lista (subtotal): $180.000
Estrategias aplicadas:
  1. Cliente VIP                                 -15%   $180.000 -> $153.000
  2. Descuento por cantidad (más de 10)          -10%   $153.000 -> $137.700
  3. Promoción especial PROMO5                    -5%   $137.700 -> $130.815
  4. Envío express                           +$10.000   $130.815 -> $140.815
Precio final: $140.815

[CHAIN] Validación del pedido:
  1. Validar Cliente  OK     El cliente Lucia Gomez está habilitado
  2. Validar Stock    OK     Hay stock de "Teclado Mecanico": disponible 20, solicitado 12
  3. Validar Limite   OK     Dentro del límite: 12 unidades y $140.815
  4. Validar Pago     OK     Pago aceptado (TARJETA): saldo $500.000 >= total $140.815

Resultado: PEDIDO APROBADO por $140.815
```

Rechazo por stock (el pago **no se ejecuta**):

```
  1. Validar Cliente  OK     El cliente Juan Perez está habilitado
  2. Validar Stock    ERROR  Stock insuficiente de "Monitor 24"": disponible 3, solicitado 5
  -  Validar Limite   (no se ejecuta: la cadena se detuvo)
  -  Validar Pago     (no se ejecuta: la cadena se detuvo)

Resultado: PEDIDO RECHAZADO por "Validar Stock" -> Stock insuficiente ...
```

| # | Escenario | Qué demuestra |
|---|---|---|
| 1 | Aprobado | 3 estrategias de descuento + envío en cascada y la cadena completa |
| 2 | Rechazo por stock | La cadena corta; los siguientes no corren |
| 3 | Rechazo por pago | Los dos primeros pasan, el tercero rechaza |
| 4 | Desafío: Black Friday | Una estrategia nueva se suma al cálculo sin tocar las demás |
| 5 | Desafío: límite de compra | Un handler nuevo corta la cadena antes del pago |

---

## 6. Recetas: cómo extender el sistema

**Agregar una estrategia de precio** (ej. descuento por primera compra):
1. Crear `pricing/strategies/descuento-primera-compra.strategy.ts` extendiendo `DescuentoPorcentualStrategy` (nombre, prioridad, porcentaje, `aplica`).
2. Sumar `new DescuentoPrimeraCompraStrategy()` en `pricing.registry.ts`.
3. Test unitario propio. **No se toca nada más.**

**Agregar un control a la cadena** (ej. horario de venta):
1. Crear `rules/handlers/validar-horario.handler.ts` extendiendo `AbstractPedidoHandler`, implementando `validar()` con `this.aprobar()` / `this.rechazar(new BusinessRuleError(...))`.
2. Insertarlo en `crearHandlersDePedido()` **en la posición deseada**.
3. Test unitario + una aserción de que los siguientes no corren si rechaza.

**Agregar una promoción especial:** una línea en el registry: `new PromocionEspecialStrategy('VERANO', 12)`. El cliente la activa enviando `"promociones": ["VERANO"]`.

---

## 7. Preguntas de repaso y glosario

1. ¿Qué diferencia hay entre `Strategy` y un `if/else` con funciones? *(Pista: quién decide cuál usar y dónde vive esa decisión.)*
2. ¿Por qué el envío tiene `prioridad = 90` y no se aplica "cuando toca"?
3. Si hubiera que cambiar a descuentos **aditivos**, ¿qué clase(s) habría que modificar? ¿Qué principio se estaría forzando?
4. ¿Por qué `ValidarPago` va último? ¿Qué pasaría si fuera primero?
5. ¿Por qué el rechazo es un valor de retorno y no una excepción?
6. ¿Qué garantiza que `ValidarPago` no se ejecute si falla `ValidarStock`? ¿Cómo lo prueba el test?
7. ¿Por qué los handlers no consultan la base de datos?
8. ¿Qué es el *composition root* y por qué editarlo no viola Open/Closed?
9. ¿Qué pasa con el stock si el pago es rechazado? ¿Qué mecanismo lo asegura?
10. ¿Cómo agregarías una regla "máximo 2 promociones por compra"? ¿Strategy o Chain? Justificá.

| Término | Significado |
|---|---|
| **Strategy** | Patrón de comportamiento: familia de algoritmos intercambiables detrás de una interfaz |
| **Context** | Objeto que usa las estrategias (`PricingEngine`) |
| **Cascada** | Cada estrategia recibe el resultado de la anterior |
| **Chain of Responsibility** | Patrón de comportamiento: la solicitud recorre una cadena de handlers hasta que uno la maneja o la corta |
| **Handler** | Eslabón de la cadena (`PedidoHandler`) |
| **Template Method** | Una clase base define el esqueleto del algoritmo y las subclases completan un paso (`validar()`, `porcentaje`) |
| **Composition root** | Único lugar que conoce las clases concretas y arma el sistema (los dos registries) |
| **Traza** | Lista de pasos ejecutados de la cadena, con su resultado |
| **OCP** | Open/Closed: abierto a extensión, cerrado a modificación |

---

## 8. Referencia de la API

Prefijo `/api/v1`. Las listas aceptan `?page=1&limit=20`. Swagger en `/api-docs`.

| Recurso | Endpoints |
|---|---|
| `/productos` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/clientes` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/ventas` | `GET /`, `GET /:id`, `POST /`, `POST /cotizar`, `DELETE /:id` (cancelar) |
| `/health` | Estado (fuera del prefijo) |

```json
POST /api/v1/clientes
{ "nombre": "Ana Lopez", "email": "ana@email.com", "tipo": "VIP" }

POST /api/v1/ventas/cotizar     (no crea nada)
{ "clienteId": 4, "productoId": 1, "cantidad": 11, "envio": "EXPRESS", "promociones": ["PROMO5"] }

POST /api/v1/ventas
{ "clienteId": 4, "productoId": 2, "cantidad": 5, "envio": "NORMAL",
  "promociones": ["BLACK_FRIDAY"],
  "pago": { "medio": "TARJETA", "saldoDisponible": 500000 } }
```

| Campo | Valores |
|---|---|
| `tipo` (cliente) | `COMUN` (default), `PREMIUM`, `VIP` |
| `envio` | `RETIRO` (default), `NORMAL`, `EXPRESS` |
| `promociones` | `PROMO10`, `PROMO5`, `BLACK_FRIDAY` |
| `pago.medio` | `TARJETA`, `EFECTIVO`, `TRANSFERENCIA` (`pago` es obligatorio) |

**Formato de respuesta:**

```json
{ "success": true, "message": "Venta creada", "data": { }, "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 } }
{ "success": false, "error": { "code": "PAGO_RECHAZADO", "message": "Pago rechazado: saldo insuficiente" } }
```

**Códigos de rechazo de la cadena:** `CLIENTE_BLOQUEADO`, `STOCK_INSUFICIENTE`, `LIMITE_COMPRA_EXCEDIDO`, `PAGO_RECHAZADO` (todos HTTP 400). Cliente o producto inexistente: 404.

**Reglas de negocio heredadas:** email único (sin distinguir mayúsculas), no se elimina un cliente o producto con ventas, crear y cancelar ventas es transaccional (cancelar restaura el stock).

**Datos iniciales** (tablas vacías): productos Teclado Mecanico ($15.000, stock 10), Mouse Gamer ($8.000, stock 5), Monitor 24" ($60.000, stock 3); clientes Juan Perez (COMUN), Maria Lopez (PREMIUM), Carlos Ruiz (VIP, bloqueado), Lucia Gomez (VIP).

> Si ya tenías un archivo `data/*.db` de una versión anterior, borralo para que se regenere con las columnas nuevas.

## 9. Estructura y documentación

```
PatronesDeDiseño/
├── src/
│   ├── config/  database/  common/            infraestructura transversal
│   └── modules/
│       ├── productos/  clientes/              CRUD (controller · service · repositories · entities · dto)
│       └── ventas/
│           ├── pricing/                       ← STRATEGY
│           │   ├── pricing-strategy.interface.ts   contrato + contexto
│           │   ├── pricing.engine.ts               Context del patrón
│           │   ├── descuento-porcentual.strategy.ts · cargo-fijo.strategy.ts   bases
│           │   ├── strategies/                     una clase por regla
│           │   └── pricing.registry.ts             composition root
│           └── rules/                         ← CHAIN OF RESPONSIBILITY
│               ├── pedido-handler.interface.ts · abstract-pedido.handler.ts · pedido-context.ts
│               ├── pedido-chain.builder.ts
│               ├── handlers/                       un handler por control
│               └── pedido-handlers.registry.ts     composition root (orden de la cadena)
├── scripts/       demo.ts · install.sh · install.bat
├── tests/         unit/ (pricing, pedido-chain, desafio) · integration/ (e2e)
└── docs/          DIAGRAMA-CLASES.md · ARQUITECTURA.md · ROADMAP-PATRONES.md · postman_collection.json
```

Más documentación: [`AGENT.md`](AGENT.md) (guía para agentes, y uno por carpeta) · [`docs/DIAGRAMA-CLASES.md`](docs/DIAGRAMA-CLASES.md) · [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) · [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`CHANGELOG.md`](CHANGELOG.md).
