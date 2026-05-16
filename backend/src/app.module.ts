import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DataSource } from 'typeorm';
import path from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { SocialAccountsModule } from './modules/social-accounts/social-accounts.module';
import { LoggerMiddleware } from './common/middlewares';
import { AppDataSource } from './db/data-source';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

async function ensurePostgresDatabaseExists(): Promise<void> {
  const config = AppDataSource.options as PostgresConnectionOptions;

  if (!config.database || !/^[A-Za-z_][A-Za-z0-9_$]*$/.test(config.database)) {
    throw new Error(`Invalid POSTGRES_DB value: ${config.database}`);
  }

  const sslOptions: object =
    process.env.DB_NEED_SSL_SETTINGS === 'true' ? { ssl: { rejectUnauthorized: false } } : {};

  const maintenanceDataSource = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: process.env.POSTGRES_MAINTENANCE_DB ?? 'postgres',
    ...sslOptions,
  });

  await maintenanceDataSource.initialize();

  try {
    const existingDatabases: unknown = await maintenanceDataSource.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database],
    );

    if (!Array.isArray(existingDatabases)) {
      throw new Error('Unexpected database lookup result');
    }

    if (existingDatabases.length === 0) {
      await maintenanceDataSource.query(`CREATE DATABASE "${config.database}"`);
    }
  } catch (error) {
    if (
      !(typeof error === 'object' && error !== null && 'code' in error && error.code === '42P04')
    ) {
      throw error;
    }
  } finally {
    await maintenanceDataSource.destroy();
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', path.join('..', '.env')],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        await ensurePostgresDatabaseExists();

        return AppDataSource.options;
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT as string) ?? 465,
        secure: (parseInt(process.env.EMAIL_PORT as string) ?? 465) === 465,
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
    SocialAccountsModule,
    ProjectsModule,
    TemplatesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('auth', 'users', 'projects', 'templates');
  }
}
