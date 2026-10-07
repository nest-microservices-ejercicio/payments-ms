import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {

  //? ✅ Conexion http comun
  const app = await NestFactory.create(AppModule, {
    rawBody: true // mada el body como un buffer
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // NestJS elimina campos que no están en el DTO
      forbidNonWhitelisted: true, // Retorna un error si viene un campo que no está en el DTO
    })
  )

  //? 🎈 Conexion de microservicios con Nats
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: envs.natsServers
    }
  }, {
    inheritAppConfig: true //- esto nos permite pasar un error de los dto, a otro servicio que lo consuma
  })

  //? 🎈 Levantamos los microservicios 
  await app.startAllMicroservices();

  //? ✅ Levantamos la app comun
  await app.listen(envs.port);

}
bootstrap();
