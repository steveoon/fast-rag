declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';

  interface SwaggerUIProps {
    spec: Record<string, unknown>;
    url?: string;
    layout?: string;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    supportedSubmitMethods?: string[];
    options?: {
      deepLinking?: boolean;
      filter?: boolean;
      displayRequestDuration?: boolean;
      tryItOutEnabled?: boolean;
      showMutatedRequest?: boolean;
      supportedSubmitMethods?: string[];
      plugins?: Array<{
        components?: {
          authorizeBtn?: () => null;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

declare module 'swagger-ui-react/swagger-ui.css' {
  const content: unknown;
  export default content;
}
