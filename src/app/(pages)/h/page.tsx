import { getUser } from '@/lib/actions/auth/getUser'
import { getUserProjects } from '@/lib/actions/projects/getUserProjects'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {}

const page = async (props: Props) => {

  const user = await getUser()

  if (!user) redirect('/')

  const projects = getUserProjects(user.id)

  return (
    <h1>men</h1>
  )
}

export default page