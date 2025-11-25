import CustomDataTable from "@/app/(pages)/proj/[projectId]/database/[databaseId]/_components/CustomDataTable";
import { getProjectById } from "@/lib/actions/projects/getProjectById";
import CreateDatabaseDialog from "./_components/CreateDatabaseDialog";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { DATA_TYPES } from "@/lib/types";


export default async function Page({ params }: { params: { projectId:string } }) {
  const projectId = (await params).projectId

  const project = await getProjectById(projectId)

  if (!project) throw new Error("Couldn't find project");

  const data: Record<string, any[]> = {"id": [], "Created At": [], 'Name': [], 'Size (GB)': []}

  project.databases.forEach(db => {
    data['Size (GB)'].push(0.25)
    data['id'].push(db.id)
    data["Created At"].push(db.createdAt)
    data['Name'].push(db.name)
  })
  
  return (
    <div className="min-w-full h-full flex flex-col justify-start items-start gap-4 p-4">
      <div className="w-full flex items-center justify-between">
        <h1 className="font-semibold text-4xl">Databases</h1>
        <CreateDatabaseDialog triggerText="New Database" projectId={projectId}/>
      </div>
      <Separator />
      <CustomDataTable
        className="w-full h-full"
        columns={{ 'Name': DATA_TYPES.STRING, "Created At": DATA_TYPES.DateTime, "id": DATA_TYPES.STRING, 'Size (GB)': DATA_TYPES.FLOAT, }}
        data={data}
        redirectOnClick
      />
    </div>
  );
}
