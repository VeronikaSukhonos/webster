import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DataSource } from 'typeorm';
import path from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LoggerMiddleware } from './common/middlewares';
import { ProjectsModule } from './modules/projects/projects.module';
import { TemplatesModule } from './modules/templates/templates.module';

function getPostgresConfig() {
  return {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT as string) || 5432,
    username: process.env.POSTGRES_USER ?? 'user',
    password: process.env.POSTGRES_PASSWORD ?? 'securepass',
    database: process.env.POSTGRES_DB ?? 'sketcherry',
  };
}

async function ensurePostgresDatabaseExists(): Promise<void> {
  const config = getPostgresConfig();

  if (!/^[A-Za-z_][A-Za-z0-9_$]*$/.test(config.database)) {
    throw new Error(`Invalid POSTGRES_DB value: ${config.database}`);
  }

  const maintenanceDataSource = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: process.env.POSTGRES_MAINTENANCE_DB ?? 'postgres',
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

        return {
          type: 'postgres',
          ...getPostgresConfig(),
          entities: [path.join(__dirname, '**', '*.entity{.ts,.js}')],
          synchronize: true,
        };
      },
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
    ProjectsModule,
    TemplatesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('auth', 'users');
  }
}
