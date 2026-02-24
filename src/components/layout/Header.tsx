'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user as { role?: string } | undefined;

  return (
    <header className="sticky top-0 z-50 bg-white/97 backdrop-blur-sm border-b border-black/8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-purple-700 tracking-tight">
          FENIX<span className="text-pink-500">PUB</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-gray-600 hover:text-purple-700 transition-colors">Accueil</Link>
          <Link href="/catalogue" className="text-gray-600 hover:text-purple-700 transition-colors">Catalogue</Link>
          <Link href="/contact" className="text-gray-600 hover:text-purple-700 transition-colors">Contact</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="text-orange-600 hover:text-orange-700 font-semibold">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link href="/panier" className="p-2 text-gray-600 hover:text-purple-700 transition-colors" aria-label="Panier">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-gray-500 hover:text-gray-700">
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/login" className="px-4 py-1.5 rounded-lg border border-purple-600 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors">
              Connexion
            </Link>
          )}
          <button className="md:hidden p-2 text-gray-700" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className="block w-5 h-0.5 bg-current mb-1"></span>
            <span className="block w-5 h-0.5 bg-current mb-1"></span>
            <span className="block w-5 h-0.5 bg-current"></span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-gray-700">Accueil</Link>
          <Link href="/catalogue" onClick={() => setMenuOpen(false)} className="text-gray-700">Catalogue</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)} className="text-gray-700">Contact</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-orange-600 font-semibold">Admin</Link>
          )}
          {session ? (
            <button className="text-left text-gray-500" onClick={() => signOut({ callbackUrl: '/' })}>Déconnexion</button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-purple-700">Connexion</Link>
          )}
        </nav>
      )}
    </header>
  );
}
