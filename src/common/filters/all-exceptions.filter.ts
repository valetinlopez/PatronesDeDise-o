import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../errors';
import { ApiErrorResponse } from '../interfaces';

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

/** Equivalente al errorHandler del BoilerPlate: normaliza TODO error a { success:false, error }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, code, message, details } = this.normalize(exception);

    if (status >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    }

    const body: ApiErrorResponse = {
      success: false,
      error: { code, message, ...(details !== undefined && { details }) },
    };
    res.status(status).json(body);
  }

  private normalize(e: unknown): NormalizedError {
    if (e instanceof AppError) {
      return { status: e.statusCode, code: e.code, message: e.message, details: e.details };
    }
    if (e instanceof HttpException) {
      const status = e.getStatus();
      const r = e.getResponse() as string | { message?: string | string[] };
      if (typeof r === 'object' && Array.isArray(r.message)) {
        return { status, code: 'VALIDATION_ERROR', message: r.message[0], details: r.message };
      }
      const message = typeof r === 'string' ? r : ((r.message as string) ?? e.message);
      return { status, code: status === 404 ? 'ROUTE_NOT_FOUND' : 'HTTP_ERROR', message };
    }
    return { status: 500, code: 'INTERNAL_ERROR', message: 'Error interno del servidor' };
  }
}
