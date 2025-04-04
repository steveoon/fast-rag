import { createClient } from '@/lib/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserClients } from '@/lib/actions/get-user-clients';
import ClientsList from '@/components/modules/clients-list';
import TranslationWrapper from '@/components/auth-translations';

export default async function ClientsManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const clients = await getUserClients(user.id);

  return (
    <TranslationWrapper namespace="Platform.ClientsManagement">
      {t => (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4 dark:text-blue-300">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <ClientsList initialClients={clients} userId={user.id} />
        </div>
      )}
    </TranslationWrapper>
  );
}
