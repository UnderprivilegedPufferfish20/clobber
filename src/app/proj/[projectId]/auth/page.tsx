import { parseFiltersParam } from "@/lib/utils";
import DataViewer from "@/components/DataViewer";
import { AuthUserType } from "@/lib/types";
import { getTableData } from "@/lib/actions/database/tables/cache-actions";

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/auth">) => {
  
  const p = await params;
  const sp = await searchParams;

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
  const users = await getTableData<AuthUserType>(
    p.projectId,
    "auth",
    "users",
    Number(limit),
    offset,
    filters,
    "auth-users",
    sortObj
  )
  const queryTimeMs = performance.now() - start;

  return (
      <DataViewer<AuthUserType> 
        data={users.rows}
        schema="auth"
        rowCnt={users.rowCount ?? 0}
        projectId={p.projectId}
        columns={users.columns}
        name="users"
        timeMs={queryTimeMs}
        closeBtn={false}
      />
 
  )
}

export default page