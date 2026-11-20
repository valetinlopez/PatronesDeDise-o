import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ServiceResult } from './common/interfaces';

/** /health queda fuera del prefijo /api/v1 pero usa el envoltorio estándar. */
@ApiExcludeController()
@SkipThrottle()
@Controller()
export class HealthController {
  @Get('health')
  health(): ServiceResult<{ status: string; timestamp: string }> {
    return { data: { status: 'ok', timestamp: new Date().toISOString() } };
  }
}
