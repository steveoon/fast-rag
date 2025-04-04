'use server';

import { db } from '../../db';
import { clients } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';

export async function isClientNameUnique(clientName: string): Promise<boolean> {
  const existingClients = await db
    .select()
    .from(clients)
    .where(eq(clients.name, clientName))
    .limit(1);

  return existingClients.length === 0;
}
