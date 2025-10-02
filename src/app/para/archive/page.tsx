import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import MobileNav from '@/components/MobileNav';
import ArchiveView from '@/components/para/ArchiveView';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch archived sources
  const { data: archivedSources } = await supabase
    .from('sources')
    .select(`
      *,
      summaries (*)
    `)
    .eq('user_id', user.id)
    .eq('archived', true)
    .order('archived_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Archive</h1>
          <p className="text-gray-600">
            Inactive sources that you want to keep for reference
          </p>
        </div>

        <ArchiveView initialSources={archivedSources || []} />
      </div>
    </div>
  );
}
