import { getSchemas } from "@/lib/actions/database/cache-actions"
import { getTriggers } from "@/lib/actions/database/triggers/cache-actions"
import { TriggerType } from "@/lib/types"
import AddTriggerSheet from "./_components/sheets/AddTriggerSheet"
import CardPage from "@/components/CardPage"
import TriggerCard from "./_components/cards/TriggerCard"
import { getTables } from "@/lib/actions/database/tables/cache-actions"
import { getFunctions } from "@/lib/actions/database/functions/cache-actions"

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"
  const schemas = await getSchemas(p.projectId)
  const triggers = await getTriggers(p.projectId, schema)

  const tableEntries = await Promise.all(
    schemas.map(async s => {
      const t = await getTables(s, p.projectId);
      return [s, t];
    })
  );

  const functionEntries = await Promise.all(
    schemas.map(async s => {
      const f = await getFunctions(p.projectId, s);
      console.log("@F: ", f)
      return [s, f.filter(s => s.return_type === "trigger").map(func => func.function_name)]
    })
  )

  const functions = Object.fromEntries(functionEntries)


  const tables = Object.fromEntries(tableEntries);


  type TAddProps = {
    projectId: string;
    schemas: string[];
    tables: Record<string, string[]>;
    functions:  Record<string, string[]>
  }

  return (
    <CardPage<TriggerType, TAddProps> 
      projectId={p.projectId}
      AddSheet={AddTriggerSheet}
      DisplayCard={TriggerCard}
      data={triggers}
      description="Run a function on a database action"
      schemas={schemas}
      title="Triggers"
      addSheetProps={{
        projectId: p.projectId,
        schemas,
        tables,
        functions
      }}
    />
  )
}


export default page;