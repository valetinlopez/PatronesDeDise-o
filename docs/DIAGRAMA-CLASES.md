# Diagramas de clases (UML)

Los diagramas están en [Mermaid](https://mermaid.js.org/): se ven renderizados en GitHub, en VS Code (extensión *Markdown Preview Mermaid Support*) y en <https://mermaid.live>.

Contenido:

1. [Parte 1 — Strategy](#1-parte-1--strategy)
2. [Parte 2 — Chain of Responsibility](#2-parte-2--chain-of-responsibility)
3. [Relación entre los dos patrones](#3-relación-entre-los-dos-patrones)
4. [Secuencia de `POST /ventas`](#4-secuencia-de-post-ventas)
5. [Secuencia de un rechazo](#5-secuencia-de-un-rechazo-la-cadena-se-detiene)

Leyenda: `«interface»` contrato · `«abstract»` clase base · `<|--` herencia · `<|..` implementa · `o--` agregación · `..>` usa/depende. Las clases marcadas con **(Desafío)** se agregaron sin modificar las existentes.

---

## 1. Parte 1 — Strategy

```mermaid
classDiagram
    direction TB

    class PricingStrategy {
        <<interface>>
        +nombre: string
        +prioridad: number
        +aplica(ctx: PricingContext) boolean
        +aplicar(precioActual, ctx) number
        +descripcion(ctx) string
    }

    class PricingContext {
        <<value>>
        +cliente: tipo
        +precioUnitario: number
        +cantidad: number
        +envio: MetodoEnvio
        +promociones: string[]
        +subtotal: number
    }

    class PricingEngine {
        <<Context>>
        -estrategias: PricingStrategy[]
        +calcular(input) PricingResult
    }

    class PricingResult {
        +subtotal: number
        +pasos: PasoPrecio[]
        +total: number
    }

    class DescuentoPorcentualStrategy {
        <<abstract>>
        #porcentaje: number
        +aplicar(precio) number
        +descripcion() string
    }

    class CargoFijoStrategy {
        <<abstract>>
        #monto: number
        +prioridad = 90
        +aplicar(precio) number
        +descripcion() string
    }

    class ClienteComunStrategy
    class ClientePremiumStrategy
    class ClienteVipStrategy
    class DescuentoCantidadMayorA5Strategy
    class DescuentoCantidadMayorA10Strategy
    class PromocionEspecialStrategy {
        -codigo: string
    }
    class DescuentoBlackFridayStrategy {
        Desafío
    }
    class RetiroEnSucursalStrategy
    class EnvioNormalStrategy
    class EnvioExpressStrategy

    class ESTRATEGIAS_DE_PRECIO {
        <<registry>>
        composition root
    }

    PricingEngine o-- PricingStrategy : recibe N estrategias
    PricingEngine ..> PricingContext : arma
    PricingEngine ..> PricingResult : devuelve
    PricingStrategy ..> PricingContext : lee

    PricingStrategy <|.. DescuentoPorcentualStrategy
    PricingStrategy <|.. CargoFijoStrategy

    DescuentoPorcentualStrategy <|-- ClienteComunStrategy
    DescuentoPorcentualStrategy <|-- ClientePremiumStrategy
    DescuentoPorcentualStrategy <|-- ClienteVipStrategy
    DescuentoPorcentualStrategy <|-- DescuentoCantidadMayorA5Strategy
    DescuentoPorcentualStrategy <|-- DescuentoCantidadMayorA10Strategy
    DescuentoPorcentualStrategy <|-- PromocionEspecialStrategy
    DescuentoPorcentualStrategy <|-- DescuentoBlackFridayStrategy
    CargoFijoStrategy <|-- RetiroEnSucursalStrategy
    CargoFijoStrategy <|-- EnvioNormalStrategy
    CargoFijoStrategy <|-- EnvioExpressStrategy

    ESTRATEGIAS_DE_PRECIO ..> PricingStrategy : lista instancias
    PricingEngine ..> ESTRATEGIAS_DE_PRECIO : se construye con
```

**Cómo leerlo:** `PricingEngine` (Context) solo conoce la interfaz `PricingStrategy`. Las 10 clases concretas (más `DescuentoBlackFridayStrategy`, del Desafío) cuelgan de dos bases por herencia. El registry es el único que las nombra a todas.

---

## 2. Parte 2 — Chain of Responsibility

```mermaid
classDiagram
    direction TB

    class PedidoHandler {
        <<interface>>
        +setNext(siguiente: PedidoHandler) PedidoHandler
        +handle(ctx: PedidoContext) ResultadoPedido
    }

    class AbstractPedidoHandler {
        <<abstract>>
        +nombre: string
        -siguiente: PedidoHandler
        +setNext(siguiente) PedidoHandler
        +handle(ctx) ResultadoPedido
        #validar(ctx) ResultadoPaso
        #aprobar(detalle) ResultadoPaso
        #rechazar(error, detalle) ResultadoPaso
    }

    class ValidarClienteHandler {
        +nombre = Validar Cliente
        #validar(ctx)
    }
    class ValidarStockHandler {
        +nombre = Validar Stock
        #validar(ctx)
    }
    class ValidarLimiteCompraHandler {
        Desafío
        +nombre = Validar Limite
        #validar(ctx)
    }
    class ValidarPagoHandler {
        +nombre = Validar Pago
        #validar(ctx)
    }

    class PedidoContext {
        <<value>>
        +cliente
        +producto
        +cantidad: number
        +precioFinal: number
        +pago
        +traza: PasoValidacion[]
    }

    class ResultadoPedido {
        +aprobado: boolean
        +rechazadoPor?: string
        +motivo?: string
        +error?: AppError
        +traza: PasoValidacion[]
    }

    class construirCadena {
        <<builder>>
        enlaza con setNext en orden
    }

    class crearHandlersDePedido {
        <<registry>>
        orden = orden de ejecución
    }

    PedidoHandler <|.. AbstractPedidoHandler
    AbstractPedidoHandler <|-- ValidarClienteHandler
    AbstractPedidoHandler <|-- ValidarStockHandler
    AbstractPedidoHandler <|-- ValidarLimiteCompraHandler
    AbstractPedidoHandler <|-- ValidarPagoHandler

    AbstractPedidoHandler o-- PedidoHandler : siguiente (0..1)
    PedidoHandler ..> PedidoContext : recibe
    PedidoHandler ..> ResultadoPedido : devuelve
    construirCadena ..> PedidoHandler : enlaza
    crearHandlersDePedido ..> PedidoHandler : crea instancias
```

**Cómo leerlo:** la flecha `AbstractPedidoHandler o-- PedidoHandler` (el "siguiente") es lo que forma la cadena. `handle()` vive en la base (Template Method); cada hijo solo escribe `validar()`.

El orden resultante de la cadena:

```mermaid
flowchart LR
    A([pedido]) --> B[Validar Cliente]
    B -- OK --> C[Validar Stock]
    C -- OK --> D["Validar Limite<br/>(Desafío)"]
    D -- OK --> E[Validar Pago]
    E -- OK --> F([APROBADO])
    B -- rechaza --> X([RECHAZADO])
    C -- rechaza --> X
    D -- rechaza --> X
    E -- rechaza --> X
```

---

## 3. Relación entre los dos patrones

`VentasService` es el **cliente** de ambos. El resultado de Strategy (`total`) pasa a ser dato de entrada de la cadena (`precioFinal`).

```mermaid
classDiagram
    direction LR

    class VentasService {
        +crear(dto) Venta
        +cotizar(dto) PricingResult
    }

    class PricingEngine {
        <<Context>>
        +calcular(input) PricingResult
    }
    class PricingStrategy {
        <<interface>>
    }

    class PedidoHandler {
        <<interface>>
        +handle(ctx) ResultadoPedido
    }
    class AbstractPedidoHandler {
        <<abstract>>
    }

    class PricingResult {
        +total: number
    }
    class PedidoContext {
        +precioFinal: number
    }
    class ResultadoPedido {
        +aprobado: boolean
    }

    VentasService --> PricingEngine : 1. calcula el precio
    VentasService --> PedidoHandler : 2. valida (cabeza de la cadena)
    PricingEngine o-- PricingStrategy : N
    PedidoHandler <|.. AbstractPedidoHandler
    AbstractPedidoHandler o-- PedidoHandler : siguiente

    PricingEngine ..> PricingResult
    PricingResult ..> PedidoContext : total → precioFinal
    PedidoContext ..> PedidoHandler
    PedidoHandler ..> ResultadoPedido
    ResultadoPedido ..> VentasService : veredicto
```

| | Strategy | Chain |
|---|---|---|
| Quién lo dispara | `VentasService` (paso 2 del flujo) | `VentasService` (paso 3) |
| Participantes que actúan | **Todos** los que `aplica()` | **Hasta** el primer rechazo |
| Salida | `PricingResult` (precio + pasos) | `ResultadoPedido` (veredicto + traza) |
| Se conectan por | `PricingResult.total` → `PedidoContext.precioFinal` | |

---

## 4. Secuencia de `POST /ventas`

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente HTTP
    participant VC as VentasController
    participant VS as VentasService
    participant TX as TransactionRunner
    participant PE as PricingEngine
    participant CH as Cadena (Cliente→Stock→Límite→Pago)
    participant PS as ProductosService
    participant VR as VentaRepository

    C->>VC: POST /ventas {cliente, producto, cantidad, envio, promociones, pago}
    VC->>VS: crear(dto)
    VS->>TX: run(...) — abre transacción
    VS->>VS: cargar cliente y producto (404 si no existen)

    rect rgb(235, 245, 255)
    Note over VS,PE: PARTE 1 — STRATEGY
    VS->>PE: calcular({cliente, precioUnitario, cantidad, envio, promociones})
    PE->>PE: filtrar aplica() → ordenar por prioridad → aplicar en cascada
    PE-->>VS: PricingResult {subtotal, pasos, total}
    end

    rect rgb(255, 245, 230)
    Note over VS,CH: PARTE 2 — CHAIN OF RESPONSIBILITY
    VS->>CH: handle({cliente, producto, cantidad, precioFinal=total, pago, traza: []})
    CH-->>VS: ResultadoPedido {aprobado, traza}
    end

    alt aprobado
        VS->>PS: ajustarStock(producto, -cantidad)
        VS->>VR: create(venta con subtotal, total, envio, medioPago)
        VS-->>TX: commit
        VS-->>VC: Venta
        VC-->>C: 201 {success:true, data: venta}
    else rechazado
        VS-->>TX: throw error → rollback
        VC-->>C: 400 {success:false, error:{code, message}}
    end
```

---

## 5. Secuencia de un rechazo (la cadena se detiene)

Ejemplo del enunciado: **Validar Cliente → OK, Validar Stock → OK, Validar Pago → ERROR**.

```mermaid
sequenceDiagram
    autonumber
    participant VS as VentasService
    participant H1 as Validar Cliente
    participant H2 as Validar Stock
    participant H3 as Validar Limite
    participant H4 as Validar Pago

    VS->>H1: handle(pedido)
    H1->>H1: validar() → OK
    H1->>H2: handle(pedido)
    H2->>H2: validar() → OK
    H2->>H3: handle(pedido)
    H3->>H3: validar() → OK
    H3->>H4: handle(pedido)
    H4->>H4: validar() → ERROR (saldo < total)
    H4-->>H3: ResultadoPedido {aprobado:false, rechazadoPor:"Validar Pago", motivo, error}
    H3-->>H2: (propaga el resultado)
    H2-->>H1: (propaga el resultado)
    H1-->>VS: ResultadoPedido rechazado + traza de 4 pasos
    Note over VS: lanza resultado.error → rollback → HTTP 400
```

Si el rechazo ocurriera en `Validar Stock`, los pasos 5 en adelante **no existirían**: `Validar Limite` y `Validar Pago` jamás reciben el pedido.
