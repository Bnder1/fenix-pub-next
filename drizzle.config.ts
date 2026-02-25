import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema:    './src/lib/schema.ts',
  out:       './drizzle',
  dialect:   'postgresql',
  dbCredentials: {
    // drizzle-kit requires a direct (unpooled) connection
    url: (process.env.NETLIFY_DATABASE_URL_UNPOOLED
       ?? process.env.NETLIFY_DATABASE_URL
       ?? process.env.DATABASE_URL)!,
  },
});
