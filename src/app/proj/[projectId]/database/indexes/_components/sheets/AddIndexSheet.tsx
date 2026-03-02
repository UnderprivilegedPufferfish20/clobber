"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  LucideIcon, 
  Binary,       // HASH: Bitwise/Equality
  Database,     // BRIN: Block Range/Storage level
  FileSearch,   // GIN: Inverted index for full-text/JSON
  Layers,       // GiST: General/Layered structures
  Network,      // SP-GiST: Space-partitioned trees
  TreePine,     // B-TREE: Standard balanced tree
  TypeIcon 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { INDEX_TYPES } from "@/lib/types";
import { getCols } from "@/lib/actions/database/columns/cache-actions";
import { createIndex } from "@/lib/actions/database/indexes";
import SheetWrapper from "@/components/SheetWrapper";
import TableSelectSheet from "@/components/TableSelectSheet";
import { MultiSelectCombobox } from "@/components/MultiSelectCombobox";


function AddIndexSheet({
  projectId,
  open,
  onOpenChange,
  tables
}: {
  projectId: string,
  open: boolean, 
  onOpenChange: Dispatch<SetStateAction<boolean>>,
  tables: Record<string, string[]>
}) {
  const queryClient = useQueryClient();


  const [schema, setSchema] = useState("")
  const [table, setTable] = useState("")
  const [cols, setCols] = useState<{ name: string, dtype: string }[]>([])
  const [type, setType] = useState<INDEX_TYPES>(INDEX_TYPES.BTREE)


  const colsQuery = useQuery({
    queryKey: ["cols", projectId, schema, table],
    queryFn: () => getCols(schema, projectId, table),
    enabled: Boolean(projectId && schema && table),
    staleTime: 30_000,
  });

  // getCols returns: { name, dtype }[]
  const availableCols = colsQuery.data ?? [];


  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      createIndex(
        {
          cols,
          schema,
          table,
          type
        },
        projectId
      )
    },
    onSuccess: () => {
      toast.success("Index created", { id: "add-index" });

      queryClient.invalidateQueries({
        queryKey: ["indexes", projectId, schema],
      });

      setSchema("")
      setCols([])
      setTable("")
      setType(INDEX_TYPES.BTREE)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create index", { id: "add-index" });
    },
  });


  // 2. The wrapper function to pass as a prop
  const handleUpdate = (vals: string[]) => {
    const transformed = vals.map(v => ({ name: v, dtype: 'default_type' }));
    setCols(transformed);
  };

  const indexTypeToIcon = (t: INDEX_TYPES): LucideIcon => {
    switch (t) {
      case INDEX_TYPES.BTREE:
        // B-Tree is a balanced tree structure; TreePine is a common visual metaphor.
        return TreePine;
      case INDEX_TYPES.HASH:
        // Hash indexes are for exact equality; Binary represents the bitwise nature.
        return Binary;
      case INDEX_TYPES.GIN:
        // Generalized Inverted Index; used for searching within complex data (JSONB).
        return FileSearch;
      case INDEX_TYPES.GiST:
        // Generalized Search Tree; often used for geometric/layered data.
        return Layers;
      case INDEX_TYPES.SPGiST:
        // Space-partitioned GiST; represents partitioned network-like structures.
        return Network;
      case INDEX_TYPES.BRIN:
        // Block Range Index; focuses on physical storage blocks.
        return Database;
      default:
        // Generic fallback for any unexpected types.
        return TypeIcon;
    }
  };

  const indexTypeToDescription = (t: INDEX_TYPES): string => {
    switch (t) {
      case INDEX_TYPES.BTREE:
        return "The default choice. Best for unique values, ranges, and sorted data.";
      case INDEX_TYPES.HASH:
        return "Optimized for simple equality (=) comparisons. Not range-capable.";
      case INDEX_TYPES.GIN:
        return "Generalized Inverted Index. Essential for JSONB, arrays, and full-text search.";
      case INDEX_TYPES.GiST:
        return "Generalized Search Tree. Ideal for geometric data and complex spatial queries.";
      case INDEX_TYPES.SPGiST:
        return "Space-Partitioned GiST. Best for non-balanced data like IP addresses or prefixes.";
      case INDEX_TYPES.BRIN:
        return "Block Range Index. Efficient for massive tables with physically sorted data.";
      default:
        return "A standard database index structure.";
    }
  };

  const IconForType = useMemo(() => {
    return indexTypeToIcon(type)
  }, [type])


  return (
    <SheetWrapper
      title="Create Index"
      description="Choose a schema + table, select an index type, and add indexed columns."
      onOpenChange={onOpenChange}
      open={open}
      submitButtonText="Create Index"
      isPending={isPending}
      onDiscard={() => {
        setSchema("")
        setCols([])
        setTable("")
        setType(INDEX_TYPES.BTREE)
      }}
      onSubmit={() => mutate()}
      isDirty={() => Boolean(schema || table) || cols.length > 0}
      disabled={!schema || !table || cols.length === 0}
    >

      <div className="flex flex-col gap-2">
        <h1>Table</h1>
        <TableSelectSheet 
          tables={tables}
          schema={schema}
          setSchema={setSchema}
          table={table}
          setTable={setTable}
        />
      </div>


      <div className="flex flex-col gap-2">
        <h1>Type</h1>

        <Select onValueChange={v => setType(v as INDEX_TYPES)} value={type}>
          <SelectTrigger className="fullwidth">
            <div className="flex items-center gap-2">
              <IconForType className="w-5 h-5"/>
              <p className="text-lg">{type}</p>
            </div>
          </SelectTrigger>
          <SelectContent className="z-200">
            {Object.values(INDEX_TYPES).map((t) => {
              const Icon = indexTypeToIcon(t)
              const desc = indexTypeToDescription(t)

              return (
                <SelectItem 
                  key={t} 
                  value={t}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5"/>
                      <p>{t}</p>
                    </div>
                    <p className="text-muted-foreground text-sm">{desc}</p>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <h1>Columns</h1>

        <MultiSelectCombobox 
          onChange={handleUpdate}
          options={availableCols.map(c => c.name)}
          value={cols.map(c => c.name)}
          searchPlaceholder={`Search Columns in "${table}"`}
          placeholder="Must have a column"
        />

        {colsQuery.isError && (
          <p className="mt-2 text-sm text-destructive">
            Failed to load columns.
          </p>
        )}
      
      </div>

    </SheetWrapper>
  );
}

export default AddIndexSheet;
