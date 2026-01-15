import { getSchemas } from "@/lib/actions/database/cache-actions"
import { getIndexes } from "@/lib/actions/database/indexes/cache-actions"
import IndexCard from "../_components/cards/IndexCard"
import { SchemaEditorNode } from "@/lib/types/schemaEditor"
import { IndexType } from "@/lib/types"
import AddIndexSheet from "./_components/sheets/AddIndexSheet"
import CardPage from "@/components/CardPage"

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"
  const schemas = await getSchemas(p.projectId)
  const indexes = await getIndexes(p.projectId, schema)

  return (
    <CardPage<IndexType>
      projectId={p.projectId}
      AddSheet={AddIndexSheet}
      DisplayCard={IndexCard}
      data={indexes}
      description="Make queries run faster"
      schemas={schemas}
      title="Indexes"
    />
  )
}


export default page;