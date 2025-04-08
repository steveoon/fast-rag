import { embedMany } from 'ai';
import { registry } from '@/lib/utils/models-registry';

export async function embedding(values: string[]) {
  const { embeddings } = await embedMany({
    model: registry.textEmbeddingModel('openai/text-embedding-3-small'),
    values,
  });
  return embeddings;
}
