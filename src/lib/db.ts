import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton — neon() n'est appelé qu'au moment de la première requête,
// pas à l'import du module (évite l'erreur au build sans DATABASE_URL)
let _instance: DbInstance | null = null;

function getInstance(): DbInstance {
  if (!_instance) {
    _instance = drizzle(neon(process.env.DATABASE_URL!), { schema });
  }
  return _instance;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return getInstance()[prop as keyof DbInstance];
  },
});
