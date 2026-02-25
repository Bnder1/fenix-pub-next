import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import SettingsForm from './SettingsForm';

export const metadata = { title: 'Paramètres — Admin' };

export default async function SettingsPage() {
  let rows: { id: number; key: string; value: string | null }[] = [];
  try {
    rows = await db.select().from(settings);
  } catch (err) {
    console.error('[settings page] DB error:', err);
  }
  const s = Object.fromEntries(rows.map(r => [r.key, r.value ?? '']));
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Paramètres</h1>
      <SettingsForm settings={s} />
    </div>
  );
}
