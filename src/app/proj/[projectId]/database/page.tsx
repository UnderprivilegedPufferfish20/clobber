import { getSchema, getSchemas } from "@/lib/actions/database/cache-actions"
import SchemaEditorPage from "./_components/SchemaEditorPage"
import { parseFiltersParam } from "@/lib/utils"
import { getTableData } from "@/lib/actions/database/tables/cache-actions"

export default async function page({ params, searchParams }: PageProps<"/proj/[projectId]/database">) {
  const p = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"
  const table = sp['table'] ? sp['table'] as string : null

  const currentSchema = await getSchema(p.projectId, schema)
  const schemas = await getSchemas(p.projectId)

  let limit: number;
  let offset: number;

  if (!sp['limit'] || Number(sp["limit"]) === undefined) { 
    limit = 50
  } else {
    limit = Number(sp["limit"])
  };

  if (!sp['offset'] || Number(sp["offset"]) === undefined) { 
    offset = 0
  } else {
    offset = Number(sp["offset"])
  };

  const filterFromUrl = sp['filter'] as string ?? ""

  const sortStr = sp["sort"] as string || "";
  let sortColumn: string | undefined;
  let sortDir: "ASC" | "DESC" | undefined;
  if (sortStr) {
    const [col, dir] = sortStr.split(":");
    sortColumn = col;
    sortDir = dir as "ASC" | "DESC";
  }

  const sortObj = sortColumn && sortDir ? { column: sortColumn, direction: sortDir } : undefined

  const filters = parseFiltersParam(filterFromUrl)


  const start = performance.now();

  const data = table ? await getTableData<any>(
    p.projectId,
    schema,
    table,
    Number(limit),
    offset,
    filters,
    `${schema}-${table}`,
    sortObj
  ) : null
  const queryTimeMs = performance.now() - start;

  return (
      <SchemaEditorPage 
        current_schema={currentSchema}
        projectId={p.projectId}
        schemas={schemas}
        
        columns={data?.columns}
        data={data?.rows}
        name={table ? table : undefined}
        rowCnt={data?.rowCount}
        timeMs={queryTimeMs}
      />
  )
}