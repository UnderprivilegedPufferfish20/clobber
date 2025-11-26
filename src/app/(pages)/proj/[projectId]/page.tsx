import { Button } from '@/components/ui/button'
import { getUser, getUserById } from '@/lib/actions/auth/getUser'
import { getProjectById } from '@/lib/actions/projects/getProjectById'
import { HouseIcon, Users2Icon } from 'lucide-react'
import { redirect } from 'next/navigation'
import React from 'react'
import InviteUsersDialog from './_components/InviteDialog'
import { Separator } from '@/components/ui/separator'



const page = async ({ params }: PageProps<"/proj/[projectId]">) => {

  const p = await params;

  console.log("@@PARAMS: ", p)

  const projectId = p.projectId
  const project = await getProjectById(projectId)

  if (!project) throw new Error("Project not found");

  const user = await getUser()

  if (!user) {
    console.log("User not found")
    redirect('/')
  };

  const usersProjects = (await getUserById(user.id))?.projects

  if (!usersProjects?.some(p => p.id === project.id) && !project.collaborators.some(c => c.id == user.id)) {
    console.log("User did not own project or isn't invited")
    redirect('/')
  }



  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-header-heading">Home</h1>
        <InviteUsersDialog projectId={projectId}/>
      </div>
      <Separator />
    </div>
  )
}

export default page