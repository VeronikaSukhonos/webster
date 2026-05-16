import { DataSource } from 'typeorm';
import path from 'path';
import { config } from 'dotenv';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

config({ path: path.join(__dirname, '..', '..', '..', '.env') });

function getPostgresConfig() {
  return {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT as string) || 5432,
    username: process.env.POSTGRES_USER ?? 'user',
    password: process.env.POSTGRES_PASSWORD ?? 'securepass',
    database: process.env.POSTGRES_DB ?? 'sketcherry',
  };
}

const migrationsOptions: object =
  process.env.NODE_ENV === 'production'
    ? {
        synchronize: false,
        migrations: [path.join(__dirname, 'migrations', '**', '*{.js,.ts}')],
        migrationsRun: true,
        migrationsTableName: 'migrations',
        migrationsTransactionMode: 'all',
      }
    : { synchronize: true };

const sslOptions: object =
  process.env.DB_NEED_SSL_SETTINGS === 'true' ? { ssl: { rejectUnauthorized: false } } : {};

export const AppDataSource: DataSource = new DataSource({
  type: 'postgres',
  ...getPostgresConfig(),
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  ...migrationsOptions,
  ...sslOptions,
} as PostgresConnectionOptions);
