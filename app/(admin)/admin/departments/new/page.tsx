import { AdminHeader } from '@/components/admin/AdminHeader';
import { DepartmentForm } from '@/components/admin/DepartmentForm';
import { createDepartment } from '../actions';

export const metadata = { title: 'New department' };

export default function NewDepartmentPage() {
  return (
    <>
      <AdminHeader title="New department" back={{ href: '/admin/departments', label: 'Departments' }} />
      <main className="p-10">
        <DepartmentForm row={null} action={createDepartment} submitLabel="Create department" />
      </main>
    </>
  );
}
