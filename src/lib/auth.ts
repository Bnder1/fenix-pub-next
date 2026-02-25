import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // NextAuth v5 — trustHost requis derrière les proxies (Netlify, Vercel, etc.)
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',        type: 'email'    },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const email    = credentials?.email    as string | undefined;
          const password = credentials?.password as string | undefined;

          if (!email || !password) {
            console.warn('[auth] authorize: champs manquants');
            throw new CredentialsSignin('Champs requis manquants');
          }

          // ── Admin via variables d'environnement ──────────────────────────
          if (process.env.ADMIN_EMAIL) {
            if (email === process.env.ADMIN_EMAIL) {
              if (password === process.env.ADMIN_PASSWORD) {
                console.info('[auth] admin login OK:', email);
                return { id: '0', name: 'Admin', email, role: 'admin' };
              }
              console.warn('[auth] admin: mot de passe incorrect pour', email);
              throw new CredentialsSignin('Identifiants incorrects');
            }
          } else {
            console.warn('[auth] ADMIN_EMAIL non défini dans les variables d\'env');
          }

          // ── Utilisateur en base ──────────────────────────────────────────
          const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

          if (!user) {
            console.warn('[auth] utilisateur introuvable:', email);
            throw new CredentialsSignin('Identifiants incorrects');
          }
          if (!user.active) {
            console.warn('[auth] compte inactif:', email);
            throw new CredentialsSignin('Compte désactivé');
          }

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            console.warn('[auth] mot de passe incorrect pour:', email);
            throw new CredentialsSignin('Identifiants incorrects');
          }

          console.info('[auth] user login OK:', email, 'rôle:', user.role);
          return { id: String(user.id), name: user.name, email: user.email, role: user.role ?? 'client' };

        } catch (err) {
          // Re-throw auth errors as-is — ils sont gérés correctement par NextAuth
          if (err instanceof CredentialsSignin) throw err;
          // Toute autre exception (DB, réseau, etc.) est loggée et convertie
          console.error('[auth] authorize erreur inattendue:', err);
          throw new CredentialsSignin('Erreur serveur temporaire');
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string;
        (session.user as { role?: string; id?: string }).id   = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',   // Redirige les erreurs NextAuth vers notre page de login
  },
  session: { strategy: 'jwt' },
});
