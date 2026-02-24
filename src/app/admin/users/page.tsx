import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import UsersClient from './UsersClient';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Utilisateurs — Admin' };

export default async function UsersPage() {
  let list: {
    id: number;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    role: string | null;
    active: boolean | null;
    createdAt: Date | null;
  }[] = [];

  try {
    list = await db.select({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      company:   users.company,
      phone:     users.phone,
      role:      users.role,
      active:    users.active,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
  } catch {}

  // Serialise les dates pour le client
  const serialized = list.map(u => ({
    ...u,
    createdAt: u.createdAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Utilisateurs ({list.length})</h1>
      </div>
      <UsersClient initialUsers={serialized} />
    </div>
  );
}
