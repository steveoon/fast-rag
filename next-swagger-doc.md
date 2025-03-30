# Install

`yarn add next-swagger-doc`

## Usage #1: next-swagger-doc with Next.js 13

To incorporate next-swagger-doc with your Next.js 13 project, follow these steps. This setup will generate Swagger documentation for your API based on your code and provide a built-in Swagger UI for viewing the documentation.

1. Create Swagger Spec
   Next, create a new file lib/swagger.ts. This file uses the next-swagger-doc library to create a Swagger specification based on the API routes in your Next.js project.

```
import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api", // define api folder under app folder
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Next Swagger API Example",
        version: "1.0",
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
```

2. Create Swagger UI Component
   Generate a new file named app/api-doc/react-swagger.tsx. In this file, create and export a React component that utilizes the swagger-ui-react library to render the Swagger UI according to the provided specification.

For demonstration purposes, here is an example using swagger-ui-react

Feel free to employ any alternative swagger UI library, such as stoplightio/elements. I have added an example using this library in the example folder.

```
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

type Props = {
  spec: Record<string, any>,
};

function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
3. Create API Documentation Page
Create a new file app/api-doc/page.tsx. This page imports the Swagger spec and the Swagger UI component to display the Swagger documentation.

import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}
```

4. Add Swagger Comment to API Route
   Lastly, add a Swagger comment to your API route in app/api/hello/route.ts. This comment includes metadata about the API endpoint which will be read by next-swagger-doc and included in the Swagger spec.

```
/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Returns the hello world
 *     responses:
 *       200:
 *         description: Hello World!
 */
export async function GET(_request: Request) {
  // Do whatever you want
  return new Response('Hello World!', {
    status: 200,
  });
}
```

## Usage #2: Create an single API document

`yarn add next-swagger-doc swagger-ui-react`

Create an live swagger page, e.g: pages/api-doc.tsx

```
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { createSwaggerSpec } from 'next-swagger-doc';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic<{
  spec: any;
}>(import('swagger-ui-react'), { ssr: false });

function ApiDoc({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {
  return <SwaggerUI spec={spec} />;
}

export const getStaticProps: GetStaticProps = async () => {
  const spec: Record<string, any> = createSwaggerSpec({
    apiFolder: 'pages/api' // or 'src/pages/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Next Swagger API Example',
        version: '1.0',
      },
    },
  });

  return {
    props: {
      spec,
    },
  };
};

export default ApiDoc;
```
