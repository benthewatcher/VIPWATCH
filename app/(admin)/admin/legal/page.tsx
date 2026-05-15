import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = { title: 'Legal' };

export default function LegalPage() {
  return (
    <>
      <AdminHeader title="Legal" />
      <main className="p-10">
        <p className="text-text-muted text-sm max-w-xl">
          Privacy policy, terms of service and other legal pages are stored in the
          <code className="px-1.5 py-0.5 bg-bg-secondary border border-divider mx-1 text-xs">legal_pages</code>
          table. A dedicated editor for these will land here next; for now you can edit the rows
          directly in the Supabase Table Editor.
        </p>
      </main>
    </>
  );
}
