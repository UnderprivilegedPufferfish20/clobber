import { getSchema, getSchemas } from "@/lib/actions/database/cache-actions"
import SchemaEditorPage from "./_components/SchemaEditorPage"
import { parseFiltersParam } from "@/lib/utils"
import { getTableData, getTables } from "@/lib/actions/database/tables/cache-actions"
import DataViewer from "@/components/DataViewer"
import BackHeader from "./_components/BackHeader"
import { getEnums } from "@/lib/actions/database/enums/cache-actions"
import { ColumnSortType, EnumType } from "@/lib/types"

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
  
  const sortObj: ColumnSortType[] = sortStr.split(";").map(s => {
    return { column: s.split(":")[0], dir: s.split(":")[1] as "ASC" | "DESC" }
  })

 
  const filters = parseFiltersParam(filterFromUrl)


  const start = performance.now();

  const enums: EnumType[] = []
  let tables: Record<string, string[]>;

  await Promise.all(
    schemas.map(async s => {
      const es = await getEnums(p.projectId, s)
      enums.push(...es)
    })
  )

  const tablesEntries = await Promise.all(
    schemas.map(async s => {
      const ts = await getTables(s, p.projectId);
      return [s, ts]
    })
  )

  tables = Object.fromEntries(tablesEntries)

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
    <>
      {table && schema && data ? (
        <div className="fullscreen flex flex-col">
          <BackHeader schema={schema} table={table} />
          <DataViewer 
            closeBtn={false}
            columns={data.columns}
            rowCnt={data.rowCount}
            data={data.rows}
            name={table}
            projectId={p.projectId}
            schema={schema}
            timeMs={queryTimeMs}
          />
        </div>
      ) : (
        <SchemaEditorPage 
          tables={tables}
          current_schema={currentSchema}
          projectId={p.projectId}
          schemas={schemas}
          enums={enums}
        />
      )}
    </>
  )
}