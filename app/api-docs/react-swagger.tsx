'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export function ReactSwagger() {
  const [spec, setSpec] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/swagger')
      .then(res => res.json())
      .then(data => setSpec(data))
      .catch(err => console.error('Failed to load Swagger spec:', err));
  }, []);

  if (!mounted || !spec) {
    return <div className="p-8 text-center">加载 API 文档中...</div>;
  }

  return (
    <SwaggerUI
      spec={spec}
      docExpansion="list"
      defaultModelsExpandDepth={-1}
      supportedSubmitMethods={[]}
    />
  );
}
