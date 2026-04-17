import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LoggerMiddleware } from './common/middlewares';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // host: 'localhost',
      // port: 5432,
      // username: process.env.POSTGRES_USER ?? 'user',
      // password: process.env.POSTGRES_PASSWORD ?? 'securepass',
      // database: process.env.POSTGRES_DB ?? 'sketcherry',
      url: `postgres://${process.env.POSTGRES_USER ?? 'user'}:${process.env.POSTGRES_PASSWORD ?? 'securepass'}@db:5432/${process.env.POSTGRES_DB ?? 'sketcherry'}`,
      entities: [path.join(__dirname, '**', '*.entity{.ts,.js}')],
      synchronize: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT as string) ?? 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"SketCherry" <${process.env.EMAIL_USER}>`,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'files'),
      serveRoot: '/files',
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('auth', 'users');
  }
}
