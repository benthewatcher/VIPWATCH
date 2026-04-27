import { AdminHeader } from '@/components/admin/AdminHeader';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { createService } from '../actions';

export const metadata = { title: 'New service' };

export default function NewServicePage() {
  return (
    <>
      <AdminHeader title="New service" back={{ href: '/admin/services', label: 'Services' }} />
      <main className="p-10">
        <ServiceForm row={null} action={createService} submitLabel="Create service" />
      </main>
    </>
  );
}
