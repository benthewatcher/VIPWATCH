import { AdminHeader } from '@/components/admin/AdminHeader';
import { TestimonialForm } from '@/components/admin/TestimonialForm';
import { createTestimonial } from '../actions';

export const metadata = { title: 'New testimonial' };

export default function NewTestimonialPage() {
  return (
    <>
      <AdminHeader title="New testimonial" back={{ href: '/admin/testimonials', label: 'Testimonials' }} />
      <main className="p-10">
        <TestimonialForm row={null} action={createTestimonial} submitLabel="Create testimonial" />
      </main>
    </>
  );
}
