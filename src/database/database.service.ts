import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private _db!: NeonHttpDatabase<typeof schema>;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const databaseUrl = this.config.getOrThrow<string>('DATABASE_URL');
    const sql = neon(databaseUrl);
    this._db = drizzle(sql, { schema });
    this.logger.log('Connected to Neon PostgreSQL via Drizzle');
  }

  get db() {
    return this._db;
  }
}
