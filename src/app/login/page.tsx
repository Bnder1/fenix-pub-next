'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const params      = useSearchParams();
  const redirect    = params.get('redirect') ?? '/';
  const registered  = params.get('registered') === '1';
  // NextAuth redirige vers /login?error=... quand il y a une erreur serveur
  const urlError    = params.get('error');

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(() => {
    if (!urlError) return '';
    if (urlError === 'CredentialsSignin') return 'Email ou mot de passe incorrect.';
    if (urlError === 'Configuration')     return 'Erreur de configuration serveur — vérifiez les variables d\'environnement (AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD).';
    return `Erreur d'authentification (${urlError}).`;
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      setLoading(false);
      if (res?.ok) {
        window.location.href = redirect; // hard reload — session cookie doit être relu
      } else {
        const code = res?.error ?? '';
        if (code === 'CredentialsSignin' || code === '') {
          setError('Email ou mot de passe incorrect.');
        } else if (code === 'Configuration') {
          setError('Erreur de configuration serveur — vérifiez les variables d\'environnement.');
        } else {
          setError(`Erreur de connexion (${code || 'inconnue'}).`);
        }
      }
    } catch {
      setLoading(false);
      setError('Erreur de connexion — vérifiez votre connexion internet.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-purple-700">FENIX<span className="text-pink-500">PUB</span></Link>
          <p className="text-gray-500 mt-2 text-sm">Connectez-vous à votre compte</p>
        </div>

        {registered && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
            Compte créé ! Connectez-vous ci-dessous.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-60">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-purple-700 hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
