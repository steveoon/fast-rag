import type { JSX } from 'react';
export type Message = { success: string } | { error: string } | { message: string };

export function FormMessage({ message }: { message: Message }): [JSX.Element, boolean] {
  const isAccessDenied = 'error' in message && message.error.includes('access_denied');

  const messageElement = (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {'success' in message && (
        <div className="text-foreground border-l-2 border-foreground px-4 dark:text-dark-foreground dark:border-dark-foreground">
          {message.success}
        </div>
      )}
      {'error' in message && (
        <div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4 dark:text-dark-destructive-foreground dark:border-dark-destructive-foreground">
          {message.error}
        </div>
      )}
      {'message' in message && (
        <div className="text-foreground border-l-2 px-4 dark:text-dark-foreground dark:border-dark-foreground">
          {message.message}
        </div>
      )}
    </div>
  );

  return [messageElement, isAccessDenied];
}
