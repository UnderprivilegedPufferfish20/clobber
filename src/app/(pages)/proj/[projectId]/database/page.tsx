import { getProjectById } from "@/lib/actions/projects/getProjectById";
import CreateDatabaseDialog from "./_components/CreateDatabaseDialog";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { DATA_TYPES } from "@/lib/types";
import DatabaseTable from "./_components/DatabaseTable";


export default async function Page({ params }: PageProps<"/proj/[projectId]/database">) {
  const projectId = (await params).projectId

  const project = await getProjectById(projectId)

  if (!project) throw new Error("Couldn't find project");

  const data: {
    "Name": string[];
    "ID": string[];
    "Created At": string[];
    "Size (GB)": string[];
  } = {"ID": [], "Created At": [], 'Name': [], 'Size (GB)': []}

  project.databases.forEach(db => {
    data['Size (GB)'].push(String(0.25))
    data['ID'].push(db.id)
    data["Created At"].push(db.createdAt.toLocaleDateString())
    data['Name'].push(db.name)
  })
  
  return (
    <div className="page-container p-12">
      <div className="page-header">
        <h1 className="page-header-heading">Databases</h1>
        <CreateDatabaseDialog triggerText="New Database" projectId={projectId}/>
      </div>
      <Separator />

      <div className="mt-5">
        <DatabaseTable
          data={data}
          projectId={projectId}
        />
      </div>

    </div>
  );
}
