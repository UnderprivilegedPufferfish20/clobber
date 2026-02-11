"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLang } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { executeQuery } from "@/lib/actions/database";
import { updateSqlQuery } from "@/lib/actions/database/sql";
import { Prisma, sql } from "@prisma/client";
import { useTheme } from "next-themes";

export default function SqlEditorPage({
  folders,
  queries,
  currentSql
}: {
  folders: Prisma.SqlFolderGetPayload<{include: { queries: true }}>[],
  queries: sql[],
  currentSql: sql | null
}) {

  const savedQuery = currentSql ? currentSql.query : ""

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const projectId = pathname.split("/")[2] ?? "";
  const sqlId = searchParams.get("q") || ""; // <-- query id from ?q=

  const queryClient = useQueryClient();

  const [query, setQuery] = useState(savedQuery);

  const isDirty = useMemo(() => query !== savedQuery, [query, savedQuery]);

  const runKey = useMemo(
    () => ["sql-run", projectId, sqlId, query.trim()],
    [projectId, sqlId, query]
  );

  const runMutation = useMutation({
    mutationFn: () => executeQuery({ query, projectId }),
    onSuccess: (data) => {
      queryClient.setQueryData(runKey, data);
    },
    onError: (err: any) => {
      console.error("Query execution failed:", err);
    },
  });

  const runQuery = () => {
    if (!query.trim() || !projectId) return;
    runMutation.mutate();
  };

  const result = (queryClient.getQueryData(runKey) as any) ?? null;
  const rows = result?.rows ?? null;
  const columns = result?.columns ?? null;

  // -----------------------------
  // Save edited query (only if ?q= exists)
  // -----------------------------
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!sqlId) throw new Error("Missing query id (?q=)");
      return await updateSqlQuery(
        sqlId,
        projectId,
        query,
      );
    },
    onSuccess: (updated) => {
      const newSaved = updated?.query ?? query;
      setQuery(newSaved);

      // keep cached entity in sync
      queryClient.setQueryData(["sql", projectId, sqlId], updated);
    },
    onError: (err: any) => {
      console.error("Save failed:", err);
    },
  });

  const saveQuery = () => {
    if (!sqlId || !isDirty || saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const { theme } = useTheme()

  const editorRef = useRef<EditorView | null>(null);

  function handleEditorDidMount(view: EditorView) {
    editorRef.current = view;
  }

  return (
    <>
      <ResizablePanelGroup direction="vertical" className="fullscreen">
        <ResizablePanel 
          defaultSize={75}
          onResize={() => {
          // Manually trigger layout when the panel resizes
          if (editorRef.current) {
            editorRef.current.requestMeasure();
          }}}
        >
          <div className="flex flex-col h-full">
            <div className="p-2 flex items-center gap-2">
              <Button
                onClick={runQuery}
                disabled={runMutation.isPending || !query.trim() || !projectId}
              >
                {runMutation.isPending ? "Running..." : "Run Query"}
              </Button>

              {sqlId && (
                <Button
                  variant="secondary"
                  onClick={saveQuery}
                  disabled={!(saveMutation.isPending || isDirty)}
                >
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              )}

              {!sqlId && (
                <span className="text-sm text-muted-foreground">
                  Open a saved query with <code>?q=&lt;id&gt;</code> to enable saving.
                </span>
              )}
            </div>

            <div className="flex-1">
                <CodeMirror
                  value={query}
                  onChange={(value) => setQuery(value)}
                  height="100%"
                  extensions={[
                    sqlLang(),
                    EditorView.lineWrapping,
                  ]}
                  theme={theme === "dark" ? githubDark : githubLight}
                  onCreateEditor={handleEditorDidMount}
                />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={25}>
          <div className="h-full overflow-auto">
            {runMutation.error ? (
              <div className="text-red-500 font-semibold">
                {runMutation.error instanceof Error
                  ? runMutation.error.message
                  : "An error occurred"}
              </div>
            ) : rows && columns ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/5">
                    {columns.map((columnName: string) => (
                      <TableHead className="border-l border-r border" key={columnName}>{columnName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row: any, rowIndex: number) => (
                    <TableRow key={rowIndex}>
                      {columns.map((columnName: string) => (
                        <TableCell key={columnName} className="border-l border-r border">
                          {JSON.stringify(row[columnName])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-gray-500">Run a query to see results here.</div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}