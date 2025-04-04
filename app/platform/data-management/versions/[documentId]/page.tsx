import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/utils/supabase/server';
import { redirect } from 'next/navigation';
import TranslationWrapper from '@/components/auth-translations';
import { getVersions } from '@/lib/actions';
import { getUserActiveKey } from '@/lib/actions/get-user-active-key';
import BackButton from '@/components/back-button';

export default async function VersionsPage(props: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await props.params;
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    apiKey,
  ] = await Promise.all([supabase.auth.getUser(), getUserActiveKey()]);

  if (!user || !apiKey) {
    return redirect('/sign-in');
  }

  const docVersions = await getVersions({ documentId, apiKey });

  return (
    <TranslationWrapper namespace="Platform.VersionsManagement">
      {t => (
        <div>
          <BackButton href="/platform/data-management" size="default" label={t('backToFiles')} />
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4 dark:text-blue-300">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Column.name')}</TableHead>
                <TableHead>{t('Column.version')}</TableHead>
                <TableHead>{t('Column.createdAt')}</TableHead>
                {/* <TableHead>{t('Column.preview')}</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {docVersions.map(item => {
                const { id, version, created_at, name } = item;
                return (
                  <TableRow key={id}>
                    <TableCell>{name}</TableCell>
                    <TableCell>{version}</TableCell>
                    <TableCell>{created_at}</TableCell>
                    {/* <TableCell>这是一个按钮</TableCell> */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </TranslationWrapper>
  );
}
