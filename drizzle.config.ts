import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema:    './src/lib/schema.ts',
  out:       './drizzle',
  dialect:   'postgresql',
  dbCredentials: {
    // pooler URL works with pg driver (no WS needed for drizzle-kit)
    url: (process.env.NETLIFY_DATABASE_URL
       ?? process.env.NETLIFY_DATABASE_URL_UNPOOLED
       ?? process.env.DATABASE_URL)!,
  },
});
