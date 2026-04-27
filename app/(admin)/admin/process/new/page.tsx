import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProcessStepForm } from '@/components/admin/ProcessStepForm';
import { createProcessStep } from '../actions';

export const metadata = { title: 'New process step' };

export default function NewProcessStepPage() {
  return (
    <>
      <AdminHeader title="New process step" back={{ href: '/admin/process', label: 'Process steps' }} />
      <main className="p-10">
        <ProcessStepForm row={null} action={createProcessStep} submitLabel="Create step" />
      </main>
    </>
  );
}
