import { getUser } from '@/lib/actions/auth/getUser'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  params: { projectId: string }
}

const page = async ({ params }: Props) => {
  const p = await params
  const user = await getUser()

  if (!user) redirect('/');

  return (
    <div>{p.projectId}</div>
  )
}

export default page