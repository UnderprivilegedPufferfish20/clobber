"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function useSavePreselection(projectId: string) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const page = searchParams.get("page") || "table_editor";
    const table = searchParams.get("table");
    const schema = searchParams.get("schema");
    const query = searchParams.get("q");

    // Debounce the save to avoid too many requests
    const timeoutId = setTimeout(async () => {
      try {
        await fetch("/api/save-preselection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            page,
            table,
            schema,
            query,
          }),
        });
      } catch (error) {
        console.error("Failed to save preselection:", error);
      }
    }, 1000); // Save 1 second after navigation stops

    return () => clearTimeout(timeoutId);
  }, [projectId, searchParams]);
}