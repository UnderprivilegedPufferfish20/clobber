import CardPage from '@/components/CardPage'
import { get_policies } from '@/lib/actions/auth/cache-actions'
import { getSchemas } from '@/lib/actions/database/sql/cache-actions'
import { PolicyType, TableCardProps, TablePolicy } from '@/lib/types'
import PolicyCard from './_components/cards/PolicyCard'
import AddPolicySheet from './_components/sheets/AddPolicySheet'
import { getRoles } from '@/lib/actions/database/roles/cache-actions'

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/auth/policies">) => {
  
  const { projectId } = await params
  const sp = await searchParams

  const schema = sp['schema'] as string ?? "public"

  type TAddProps = {
    projectId: string
    schemas: string[]
    roles: string[]
  }


  const schemas = await getSchemas(projectId)
  const policies = await get_policies(projectId, schema)
  const roles = await getRoles(projectId)



  return (
    <CardPage<TableCardProps, TAddProps> 
      title='Policies'
      description='Ensure data security and unified governance'
      projectId={projectId}
      schemas={schemas}
      data={policies.map(p => ({
        ...p,
        schemas,
        roles: roles.map(r => r.name)
      }))}
      DisplayCard={PolicyCard}
      AddSheet={AddPolicySheet}
      addSheetProps={{
        projectId,
        schemas,
        roles: roles.map(r => r.name)
      }}
    />
  )
}

export default page