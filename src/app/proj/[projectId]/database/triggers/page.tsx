import { getSchemas } from "@/lib/actions/database/cache-actions"
import CardPage from "../_components/CardPage"
import { getTriggers } from "@/lib/actions/database/triggers/cache-actions"
import TriggerCard from "../_components/cards/TriggerCard"
import { TriggerType } from "@/lib/types"
import AddTriggerSheet from "./_components/sheets/AddTriggerSheet"

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"
  const schemas = await getSchemas(p.projectId)
  const triggers = await getTriggers(p.projectId, schema)

  return (
    <CardPage<TriggerType> 
      projectId={p.projectId}
      AddSheet={AddTriggerSheet}
      DisplayCard={TriggerCard}
      data={triggers}
      description="Run a function on a database action"
      schemas={schemas}
      title="Triggers"
    />
  )
}


export default page;