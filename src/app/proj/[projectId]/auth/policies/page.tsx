import CardPage from '@/components/CardPage'
import { get_policies } from '@/lib/actions/auth/cache-actions'
import { getSchemas } from '@/lib/actions/database/sql/cache-actions'
import { PolicyType, TableCardProps, TablePolicy } from '@/lib/types'
import PolicyCard from './_components/cards/PolicyCard'
import AddPolicySheet from './_components/sheets/AddPolicySheet'
import { getRoles } from '@/lib/actions/database/roles/cache-actions'
import { getTables } from '@/lib/actions/database/tables/cache-actions'
import { getSchema } from '@/lib/actions/database/cache-actions'

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/auth/policies">) => {
  
  const { projectId } = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"

  type TAddProps = {
    tables: Record<string, string[]>
    roles: string[],
    project_id: string,
  }


  const schemas = await getSchemas(projectId)
  const policies = await get_policies(projectId, schema)
  const rlss = await getSchema(projectId, schema)
  const roles = await getRoles(projectId)
  

  const tableEntries = await Promise.all(
    schemas.map(async (s) => {
      const t = await getTables(s, projectId);
      return [s, t];
    })
  );

  
  
  const tables = Object.fromEntries(tableEntries);


  return (
    <CardPage<TableCardProps, TAddProps> 
      title='Policies'
      description='Ensure data security and unified governance'
      projectId={projectId}
      schemas={schemas}
      data={policies.map(p => ({
        ...p,
        tables,
        roles: roles.map(r => r.name),
        rls: rlss.find(v => v.name === p.name)!.rls
      }))}
      DisplayCard={PolicyCard}
      AddSheet={AddPolicySheet}
      addSheetProps={{
        project_id: projectId,
        tables,
        roles: roles.map(r => r.name)
      }}
    />
  )
}

export default page