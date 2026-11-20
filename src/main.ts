import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  configureApp(app);

  const swagger = new DocumentBuilder()
    .setTitle('Sistema de Ventas')
    .setDescription('API de ventas (productos, clientes, ventas)')
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, swagger));

  app.enableShutdownHooks();
  const port = app.get(ConfigService).getOrThrow<number>('app.port');
  await app.listen(port);
}

bootstrap();
