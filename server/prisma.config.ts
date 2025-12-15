import { defineConfig, env } from 'prisma/config';
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: isProd
      ? 'node dist/prisma/seed.js'
      : 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
