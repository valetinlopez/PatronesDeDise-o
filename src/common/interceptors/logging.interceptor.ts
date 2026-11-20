import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Equivalente a requestLogger: método, URL, status y duración. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`),
        error: () => this.logger.warn(`${req.method} ${req.url} falló ${Date.now() - start}ms`),
      })
    );
  }
}
