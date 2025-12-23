"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Preselection = {
  page: string;
  table?: string | null;
  schema?: string | null;
  query?: string | null;
} | null;

export function PreselectionHandler({
  projectId,
  searchParams,
  preselections,
}: {
  projectId: string;
  searchParams: Record<string, string>;
  preselections: Preselection;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once and only if URL has no params
    if (hasRedirected.current) return;
    
    const hasParams = Object.keys(searchParams).length > 0;
    
    // If user already has URL params, respect their navigation
    if (hasParams) return;
    
    // If no preselections, do nothing
    if (!preselections) return;

    hasRedirected.current = true;

    // Build redirect URL based on saved preferences
    const params = new URLSearchParams();
    
    if (preselections.page === "table_editor") {
      params.set("page", "table_editor");
      if (preselections.table) params.set("table", preselections.table);
      if (preselections.schema) params.set("schema", preselections.schema);
    } else if (preselections.page === "sql_editor") {
      params.set("page", "sql_editor");
      if (preselections.query) params.set("q", preselections.query);
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, []); // Empty deps - only run once on mount

  return null; // This component only handles logic, no UI
}