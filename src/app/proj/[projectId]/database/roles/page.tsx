import { RoleType } from '@/lib/types'
import AddRoleSheet from './_components/sheets/AddRoleSheet'
import { getSchemas } from '@/lib/actions/database/cache-actions'
import { getRoles } from '@/lib/actions/database/roles/cache-actions'
import CardPage from '@/components/CardPage'
import RoleCard from '../_components/cards/RoleCard'

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database/roles">) => {
  const p  = await params

  const schemas = await getSchemas(p.projectId)
  const roles = await getRoles(p.projectId)

  return (
    <CardPage<RoleType> 
      AddSheet={AddRoleSheet}
      DisplayCard={RoleCard}
      title='Roles'
      description='manage who can do what'
      schemas={schemas}
      projectId={p.projectId}
      data={roles}
      schemafilter={false}
    />
  )
}

export default page