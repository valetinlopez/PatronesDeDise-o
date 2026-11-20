# Scripts - Automatización y Demo

## Responsabilidad

- `install.sh` / `install.bat`: verifican Node y npm, instalan dependencias, copian `.env.example` a `.env` y ejecutan lint
- `demo.ts` (`npm run demo`): ejecuta por consola los 5 escenarios del TP con las **mismas clases** que la API, **sin Nest ni base de datos**

## Escenarios del demo

1. Pedido aprobado (VIP + cantidad + promo + envío express)
2. Rechazado por falta de stock (los controles siguientes no se ejecutan)
3. Rechazado por problema de pago
4. Desafío: `DescuentoBlackFriday` combinado con las demás estrategias
5. Desafío: `ValidarLimiteCompra` corta la cadena antes del pago

## Reglas para AI Agents

- `demo.ts` debe usar `PricingEngine`, `ESTRATEGIAS_DE_PRECIO` y `crearHandlersDePedido()`: nunca duplicar la lógica de precio o de validación.
- Un escenario nuevo = una llamada más a `ejecutar({...})` en `main()`.
- Mantener `install.sh` e `install.bat` equivalentes, con mensajes en español y pasos numerados `[1/5]`.
- No documentar aquí scripts que no existan.
