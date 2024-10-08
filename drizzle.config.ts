import { defineConfig } from 'drizzle-kit';
// import { env } from '@/lib/env.mjs';

export default defineConfig({
  schemaFilter: ['public'],
  schema: './lib/db/schema/*',
  dialect: 'postgresql',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
