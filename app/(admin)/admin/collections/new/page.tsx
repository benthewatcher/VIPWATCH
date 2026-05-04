import { AdminHeader } from '@/components/admin/AdminHeader';
import { CollectionForm } from '@/components/admin/CollectionForm';
import { createCollection } from '../actions';

export const metadata = { title: 'New collection' };

export default function NewCollectionPage() {
  return (
    <>
      <AdminHeader title="New collection" back={{ href: '/admin/collections', label: 'Collections' }} />
      <main className="p-10">
        <CollectionForm row={null} action={createCollection} submitLabel="Create collection" />
        <p className="mt-6 text-xs text-text-muted">You can add commissions to the collection after creating it.</p>
      </main>
    </>
  );
}
