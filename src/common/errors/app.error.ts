/** Error operacional base. Todo error de negocio/HTTP del sistema extiende de aquí. */
export class AppError extends Error {
  readonly isOperational = true;

  constructor(
    message: string,
    readonly statusCode: number = 500,
    readonly code: string = 'INTERNAL_ERROR',
    readonly details?: unknown
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409, 'CONFLICT');
  }
}

/** Regla de negocio incumplida (ej: cliente bloqueado, stock insuficiente). */
export class BusinessRuleError extends AppError {
  constructor(message: string, code = 'BUSINESS_RULE_VIOLATION') {
    super(message, 400, code);
  }
}
