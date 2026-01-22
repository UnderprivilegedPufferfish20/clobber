import { getSchema, getSchemas } from "@/lib/actions/database/cache-actions"
import SchemaEditorPage from "./_components/SchemaEditorPage"

export default async function page({ params, searchParams }: PageProps<"/proj/[projectId]/database">) {
  const p = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"

  const currentSchema = await getSchema(p.projectId, schema)
  const schemas = await getSchemas(p.projectId)

  return (
      <SchemaEditorPage 
        current_schema={currentSchema}
        projectId={p.projectId}
        schemas={schemas}   
      />
  )
}