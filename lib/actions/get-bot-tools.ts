import { db } from '@/lib/db';
import { chat_bot_tools, client_tools, tools } from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';

export async function getBotTools(botId: string) {
  const toolsInfo = await db
    .select({
      name: tools.name,
      toolId: tools.id,
      clientToolId: client_tools.id,
      isEnabled: client_tools.is_enabled,
      config: chat_bot_tools.config,
    })
    .from(chat_bot_tools)
    .innerJoin(client_tools, eq(chat_bot_tools.client_tool_id, client_tools.id))
    .innerJoin(tools, eq(client_tools.tool_id, tools.id))
    .where(eq(chat_bot_tools.chat_bot_id, botId));

  return toolsInfo;
}
