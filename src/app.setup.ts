import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';

/** Configuración HTTP compartida entre main.ts y los tests e2e. */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.setGlobalPrefix(config.getOrThrow<string>('app.apiPrefix'), { exclude: ['health'] });
  app.use(helmet());
  app.use(compression());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false })
  );
}
