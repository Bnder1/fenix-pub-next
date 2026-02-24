import NextAuth from 'next-auth';
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
        const email    = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        // Admin via variables d'environnement
        if (
          process.env.ADMIN_EMAIL &&
          email    === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { id: '0', name: 'Admin', email, role: 'admin' };
        }

        // Utilisateur en base
        try {
          const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (!user || !user.active) return null;
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;
          return { id: String(user.id), name: user.name, email: user.email, role: user.role ?? 'client' };
        } catch {
          return null;
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
  },
  session: { strategy: 'jwt' },
});
