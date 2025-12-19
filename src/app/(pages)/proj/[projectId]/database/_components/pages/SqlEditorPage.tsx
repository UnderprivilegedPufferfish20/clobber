"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Editor from "@monaco-editor/react"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { executeQuery } from "@/lib/actions/database"

export default function SqlEditorPage() {
  const pathname = usePathname()
  const projectId = pathname.split("/")[2] ?? ""
  const [query, setQuery] = useState("")
  const queryClient = useQueryClient()
  
  // Unique query key based on current query and projectId
  const queryKey = ['sql-query', projectId, query.trim()]
  
  const {
    data: result,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => executeQuery({ query, projectId }),
    enabled: false, // Manual triggering only
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  const rows = result?.rows ?? null
  const columns = result?.columns ?? null

  const mutation = useMutation({
    mutationFn: () => executeQuery({ query, projectId }),
    onSuccess: (data) => {
      // Invalidate and refetch the query
      queryClient.setQueryData(queryKey, data)
    },
    onError: (err: any) => {
      console.error("Query execution failed:", err)
    }
  })

  const runQuery = () => {
    if (!query.trim()) return
    
    mutation.mutate()
    // Or use refetch for simpler invalidation
    // refetch()
  }

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="fullscreen"
    >
      <ResizablePanel defaultSize={75}>
        <div className="flex flex-col h-full">
          <div className="p-2 flex items-center gap-2">
            <Button 
              onClick={runQuery} 
              disabled={mutation.isPending || !query.trim()}
            >
              {mutation.isPending ? "Running..." : "Run Query"}
            </Button>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language="sql"
              theme="vs-dark"
              value={query}
              onChange={(value) => setQuery(value ?? "")}
              options={{
                minimap: { enabled: true },
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25}>
        <div className="h-full overflow-auto p-6">
          {error ? (
            <div className="text-red-500 font-semibold">
              {error instanceof Error ? error.message : "An error occurred"}
            </div>
          ) : rows && columns ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((columnName) => (
                    <TableHead key={columnName}>{columnName}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((columnName) => (
                      <TableCell key={columnName}>
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
  )
}