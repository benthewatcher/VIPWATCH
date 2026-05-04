import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { TestimonialForm } from '@/components/admin/TestimonialForm';
import { createClient } from '@/lib/supabase/server';
import { updateTestimonial, deleteTestimonial } from '../actions';

export const metadata = { title: 'Edit testimonial' };

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createClient()) as any;
  const { data: row } = await supabase.from('testimonials').select('*').eq('id', id).maybeSingle();
  if (!row) notFound();

  const update = updateTestimonial.bind(null, id);
  const remove = deleteTestimonial.bind(null, id);

  return (
    <>
      <AdminHeader title={row.client_name ?? 'Edit testimonial'} back={{ href: '/admin/testimonials', label: 'Testimonials' }} />
      <main className="p-10">
        <TestimonialForm row={row} action={update} submitLabel="Save changes" onDelete={remove} />
      </main>
    </>
  );
}
