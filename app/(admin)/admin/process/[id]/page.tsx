import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProcessStepForm } from '@/components/admin/ProcessStepForm';
import { createClient } from '@/lib/supabase/server';
import { updateProcessStep, deleteProcessStep } from '../actions';

export const metadata = { title: 'Edit process step' };

export default async function EditProcessStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase.from('process_steps').select('*').eq('id', id).maybeSingle();
  if (!row) notFound();

  const update = updateProcessStep.bind(null, id);
  const remove = deleteProcessStep.bind(null, id);

  return (
    <>
      <AdminHeader title={`${row.number} · ${row.title_en}`} back={{ href: '/admin/process', label: 'Process steps' }} />
      <main className="p-10">
        <ProcessStepForm row={row} action={update} submitLabel="Save changes" onDelete={remove} />
      </main>
    </>
  );
}
