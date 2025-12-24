// /lib/hooks/useSelectedSchema.ts
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import * as React from "react";

const keyFor = (projectId: string) => `selected_schema:${projectId}`;

type UseSelectedSchemaArgs = {
  projectId: string;
  schemas: string[] | undefined;
  defaultSchema?: string; // fallback if schemas empty
  persist?: boolean; // localStorage
};

export function useSelectedSchema({
  projectId,
  schemas,
  defaultSchema = "public",
  persist = true,
}: UseSelectedSchemaArgs) {
  const [schema, _setSchema] = React.useState<string | null>(null);
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize from localStorage (optional) or from schemas[0]
  React.useEffect(() => {
    if (!projectId) return;

    const safeSchemas = schemas ?? [];

    let initial: string | null = null;

    if (persist) {
      const stored = typeof window !== "undefined" ? localStorage.getItem(keyFor(projectId)) : null;
      if (stored && safeSchemas.includes(stored)) initial = stored;
    }

    if (!initial) {
      initial = safeSchemas[0] ?? defaultSchema;
    }

    // Avoid resetting if already set
    _setSchema((prev) => prev ?? initial);
  }, [projectId, schemas, defaultSchema, persist]);

  // Keep schema valid if schemas list changes
  React.useEffect(() => {
    if (!schemas || schemas.length === 0) return;
    if (!schema) return;

    if (!schemas.includes(schema)) {
      _setSchema(schemas[0]);
    }
  }, [schemas, schema]);

  const setSchema = React.useCallback(
    (next: string) => {
      _setSchema(next);
      if (persist && projectId) {
        localStorage.setItem(keyFor(projectId), next);
        const params = new URLSearchParams(searchParams)
        params.set("schema", next)
        router.push(`${pathname}?${params}`)
      }
    },
    [persist, projectId]
  );

  return {
    schema: schema ?? defaultSchema,
    setSchema,
    isReady: schema !== null, // tells you initialization finished
  };
}
