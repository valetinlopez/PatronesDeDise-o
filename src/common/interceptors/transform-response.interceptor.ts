import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse, ServiceResult } from '../interfaces';

/** Envuelve toda respuesta exitosa en { success, message, data, meta? } (response-helpers del BoilerPlate). */
@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse> {
    return next.handle().pipe(
      map((result: ServiceResult | undefined) => ({
        success: true as const,
        message: result?.message ?? 'OK',
        data: result?.data as unknown,
        ...(result?.meta && { meta: result.meta }),
      }))
    );
  }
}
