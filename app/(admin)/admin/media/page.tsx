import { AdminHeader } from '@/components/admin/AdminHeader';
import { MediaLibrary } from '@/components/admin/MediaLibrary';

export const metadata = { title: 'Media library' };
export const dynamic = 'force-dynamic';

export default function MediaPage() {
  return (
    <>
      <AdminHeader
        title="Media library"
        back={{ href: '/admin', label: 'Admin' }}
      />
      <div className="px-10 py-8">
        <MediaLibrary />
      </div>
    </>
  );
}
