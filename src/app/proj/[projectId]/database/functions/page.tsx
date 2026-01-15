import { getSchemas } from "@/lib/actions/database/cache-actions"
import { getFunctions } from "@/lib/actions/database/functions/cache-actions"
import FunctionCard from "../_components/cards/FunctionCard"
import { DatabaseFunctionType } from "@/lib/types"
import AddFunctionSheet from "./_components/sheets/AddFunctionSheet"
import CardPage from "@/components/CardPage"

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"
  const schemas = await getSchemas(p.projectId)
  const functions = await getFunctions(p.projectId, schema)

  return (
    <CardPage<DatabaseFunctionType>
      projectId={p.projectId}
      AddSheet={AddFunctionSheet}
      DisplayCard={FunctionCard}
      data={functions}
      description="Resuable block of code"
      schemas={schemas}
      title="Functions"
    />
  )
}


export default page;