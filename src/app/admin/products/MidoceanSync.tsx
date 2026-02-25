'use client';

import { useState } from 'react';

interface Props {
  lastSync:  string;
  lastCount: string;
}

export default function MidoceanSync({ lastSync, lastCount }: Props) {
  const [loading,  setLoading]  = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [message,  setMessage]  = useState('');
  const [isError,  setIsError]  = useState(false);

  async function handleSync() {
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const res = await fetch('/api/admin/midocean/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setIsError(true);
        setMessage(data.error ?? 'Erreur inconnue');
      } else {
        setMessage(
          `Synchronisation terminée — ${data.synced} produits importés` +
          (data.errors > 0 ? ` (${data.errors} erreurs)` : '') +
          ` en ${(data.duration / 1000).toFixed(1)}s`
        );
        // Reload to update last sync info
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setIsError(true);
      setMessage('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage('');
    setIsError(false);
    try {
      const res  = await fetch('/api/admin/midocean/test');
      const data = await res.json();
      if (data.ok) {
        setMessage(`Connexion OK — ${data.count ?? '?'} produits disponibles`);
      } else {
        setIsError(true);
        setMessage(`Erreur : ${data.error}`);
      }
    } catch {
      setIsError(true);
      setMessage('Erreur réseau');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-blue-900">Catalogue Midocean</h2>
          <p className="text-xs text-blue-700 mt-0.5">
            {lastSync
              ? `Dernière sync : ${new Date(lastSync).toLocaleString('fr-FR')} — ${lastCount || '0'} produits`
              : 'Pas encore synchronisé'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing || loading}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            {testing ? 'Test…' : 'Tester la connexion'}
          </button>
          <button
            onClick={handleSync}
            disabled={loading || testing}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Synchronisation…' : 'Synchroniser'}
          </button>
        </div>
      </div>
      {message && (
        <p className={`mt-3 text-xs font-medium ${isError ? 'text-red-700' : 'text-green-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
