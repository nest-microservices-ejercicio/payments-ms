import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    rawBody: true // mada el body como un buffer
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // NestJS elimina campos que no están en el DTO
      forbidNonWhitelisted: true, // Retorna un error si viene un campo que no está en el DTO
    })
  )

  await app.listen(envs.port);

}
bootstrap();
