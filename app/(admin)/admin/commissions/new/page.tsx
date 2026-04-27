import { AdminHeader } from '@/components/admin/AdminHeader';
import { CommissionForm } from '@/components/admin/CommissionForm';
import { createCommission } from '../actions';

export const metadata = { title: 'New commission' };

export default function NewCommissionPage() {
  return (
    <>
      <AdminHeader title="New commission" back={{ href: '/admin/commissions', label: 'Commissions' }} />
      <main className="p-10">
        <CommissionForm row={null} action={createCommission} submitLabel="Create commission" />
        <p className="mt-6 text-xs text-text-muted max-w-md">
          You can add gallery images after the commission is created and saved.
        </p>
      </main>
    </>
  );
}
