import { getApiDocs } from '@/lib/swagger';
import { ReactSwagger } from './react-swagger';

export default async function ApiDocsPage() {
  const spec = await getApiDocs();

  return (
    <section className="container mx-auto pt-4 pb-8">
      <div className="bg-white dark:bg-gray-900 py-2 rounded-lg shadow-md">
        <ReactSwagger spec={spec as Record<string, unknown>} />
      </div>
    </section>
  );
}
