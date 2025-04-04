import { createClient } from '@/lib/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getClientTokens } from '@/lib/actions/get-client-tokens';
import TokensList from '@/components/modules/tokens-list';
import TranslationWrapper from '@/components/auth-translations';
import BackButton from '@/components/back-button';

export default async function KeyManagementPage(props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const { clientId } = params;

  if (!clientId) {
    return redirect('/platform/clients-management');
  }

  const tokens = await getClientTokens(clientId);

  return (
    <TranslationWrapper namespace="Platform.KeyManagement">
      {t => (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <BackButton
            href="/platform/clients-management"
            size="default"
            label={t('backToClients')}
          />
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4 dark:text-blue-300">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <TokensList initialTokens={tokens} clientId={clientId} user={user} />
        </div>
      )}
    </TranslationWrapper>
  );
}
