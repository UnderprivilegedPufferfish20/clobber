import React from 'react'
import SettingsPage from './_components/SettingsPage'
import { get_institution_by_id } from '@/lib/actions/database/cache-actions'

const page = async ({params}: PageProps<"/institutions/[institution_id]/settings">) => {
  const p = await params
  const inst = await get_institution_by_id(p.institution_id)

  if (!inst) throw new Error("Inst not found")

  return <SettingsPage inst={{
    id: inst.id,
    name: inst.name,
    ownerId: inst.ownerId,
    plan: inst.plan,
    slug: inst.slug
  }}/>
}

export default page