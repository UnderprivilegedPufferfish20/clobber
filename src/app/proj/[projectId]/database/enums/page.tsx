import { getSchemas } from "@/lib/actions/database/cache-actions"
import { getEnums } from "@/lib/actions/database/enums/cache-actions"
import CardPage from "../_components/CardPage"
import EnumCard from "../_components/cards/EnumCard"
import { EnumType } from "@/lib/types"
import AddEnumSheet from "./_components/sheets/AddEnumSheet"

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"
  const schemas = await getSchemas(p.projectId)
  const enums = await getEnums(p.projectId, schema)

  return (
    <CardPage<EnumType>
      projectId={p.projectId}
      AddSheet={AddEnumSheet}
      DisplayCard={EnumCard}
      data={enums}
      description="Data type with a list of possible values"
      schemas={schemas}
      title="Enums"
    />
  )
}


export default page;