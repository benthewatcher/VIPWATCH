import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DepartmentForm } from '@/components/admin/DepartmentForm';
import { createClient } from '@/lib/supabase/server';
import { updateDepartment, deleteDepartment } from '../actions';

export const metadata = { title: 'Edit department' };

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createClient()) as any;
  const { data: row } = await supabase.from('home_departments').select('*').eq('id', id).maybeSingle();
  if (!row) notFound();

  const update = updateDepartment.bind(null, id);
  const remove = deleteDepartment.bind(null, id);

  return (
    <>
      <AdminHeader title={row.title_en ?? 'Edit department'} back={{ href: '/admin/departments', label: 'Departments' }} />
      <main className="p-10">
        <DepartmentForm row={row} action={update} submitLabel="Save changes" onDelete={remove} />
      </main>
    </>
  );
}
