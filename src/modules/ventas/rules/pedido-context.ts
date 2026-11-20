import { AppError } from '../../../common/errors';

/** Un paso ejecutado de la cadena: queda registrado para poder mostrarlo o auditarlo. */
export interface PasoValidacion {
  handler: string;
  ok: boolean;
  detalle: string;
}

/**
 * Pedido que viaja por la cadena. Ya trae cliente y producto cargados y el precio final
 * calculado por Strategy, así los handlers son puros (sin base de datos ni DI).
 */
export interface PedidoContext {
  readonly cliente: { readonly nombre: string; readonly bloqueado: boolean };
  readonly producto: { readonly nombre: string; readonly stock: number };
  readonly cantidad: number;
  readonly precioFinal: number;
  readonly pago: { readonly medio: string; readonly saldoDisponible: number };
  /** Se completa a medida que cada handler se ejecuta. */
  readonly traza: PasoValidacion[];
}

/** Resultado de un solo handler (lo devuelve validar()). */
export type ResultadoPaso =
  | { ok: true; detalle: string }
  | { ok: false; detalle: string; error: AppError };

/** Resultado de toda la cadena. */
export interface ResultadoPedido {
  aprobado: boolean;
  /** Nombre del handler que rechazó (solo si no fue aprobado). */
  rechazadoPor?: string;
  motivo?: string;
  /** Error de negocio a lanzar para responder con el HTTP/mensaje correcto. */
  error?: AppError;
  traza: readonly PasoValidacion[];
}
