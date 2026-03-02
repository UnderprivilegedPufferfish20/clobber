import { getSchemas } from "@/lib/actions/database/cache-actions"
import { getIndexes } from "@/lib/actions/database/indexes/cache-actions"
import { IndexType } from "@/lib/types"
import AddIndexSheet from "./_components/sheets/AddIndexSheet"
import CardPage from "@/components/CardPage"
import IndexCard from "./_components/cards/IndexCard"
import { getTables } from "@/lib/actions/database/tables/cache-actions"

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"
  const schemas = await getSchemas(p.projectId)
  const indexes = await getIndexes(p.projectId, schema)

  const tableEntries = await Promise.all(
    schemas.map(async (s) => {
      const t = await getTables(s, p.projectId);
      return [s, t];
    })
  );


  const tables = Object.fromEntries(tableEntries);

  type TAddProps = {
    projectId: string,
    tables: Record<string, string[]>
  }

  return (
    <CardPage<IndexType, TAddProps>
      projectId={p.projectId}
      AddSheet={AddIndexSheet}
      DisplayCard={IndexCard}
      data={indexes}
      description="Make queries run faster"
      schemas={schemas}
      title="Indexes"
      addSheetProps={{
        projectId: p.projectId,
        tables
      }}
    />
  )
}


export default page;