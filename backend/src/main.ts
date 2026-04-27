import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, BadRequestException, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors';
import { ExceptionsFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('SketCherry API Documentation')
    .setDescription(
      'SketCherry is a simple online graphic editor that empowers anyone - regardless of design experience - to effortlessly create stunning visuals',
    )
    .addBearerAuth({
      type: 'http',
      description: 'Access token for API obtained through login or refresh',
    })
    .addGlobalResponse({ status: 500, description: 'Internal server error' })
    .build();

  app.setGlobalPrefix('api');
  app.enableCors({
    credentials: true,
    origin: [process.env.APP_URL],
  });
  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errors.map((err) => ({
            param: err.property,
            error: err.constraints?.[Object.keys(err.constraints)[0]],
          })),
        });
      },
    }),
  );
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );
  app.useGlobalFilters(new ExceptionsFilter());
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, config), {
    customSiteTitle: 'SketCherry API Documentation',
    jsonDocumentUrl: 'api/docs/json',
  });

  await app.listen(process.env.API_PORT ?? 3000);
  console.log(`API is running on: ${await app.getUrl()}/api`);
}

void bootstrap();
