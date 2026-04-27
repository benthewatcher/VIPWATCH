import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { createClient } from '@/lib/supabase/server';
import { updateService, deleteService } from '../actions';

export const metadata = { title: 'Edit service' };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase.from('services').select('*').eq('id', id).maybeSingle();
  if (!row) notFound();

  const update = updateService.bind(null, id);
  const remove = deleteService.bind(null, id);

  return (
    <>
      <AdminHeader title={row.title_en ?? 'Edit service'} back={{ href: '/admin/services', label: 'Services' }} />
      <main className="p-10">
        <ServiceForm row={row} action={update} submitLabel="Save changes" onDelete={remove} />
      </main>
    </>
  );
}
