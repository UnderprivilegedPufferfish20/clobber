import { getUser, getUserById } from '@/lib/actions/auth/getUser'
import { getProjectById } from '@/lib/actions/projects/getProjectById'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  params: { projectId: string }
}

const page = async ({ params }: Props) => {
  const projectId = (await params).projectId
  const project = await getProjectById(projectId)

  if (!project) throw new Error("Project not found");

  const user = await getUser()

  if (!user) {
    console.log("User not found")
    redirect('/')
  };

  const usersProjects = (await getUserById(user.id))?.projects

  if (!usersProjects?.some(p => p.id === project.id)) {
    console.log("User did not own project")
    redirect('/')
  }



  return (
    <div>{projectId}</div>
  )
}

export default page