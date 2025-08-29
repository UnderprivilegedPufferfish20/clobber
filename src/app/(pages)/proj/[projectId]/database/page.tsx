import CustomDataTable from "@/components/CustomDataTable";
import { getProjectById } from "@/lib/actions/projects/getProjectById";
import CreateDatabaseDialog from "./_components/CreateDatabaseDialog";
import { Separator } from "@/components/ui/separator";
import * as React from "react";

export type DatabaseType = {
  id: string;
  name: string;
  createdAt: Date;
};

export default async function Page({ params }: { params: { projectId:string } }) {
  const projectId = (await params).projectId

  const project = await getProjectById(projectId)

  if (!project) throw new Error("Couldn't find project");

  
  return (
    <div className="min-w-full h-full flex flex-col justify-start items-start gap-4 p-4">
      <div className="w-full flex items-center justify-between">
        <h1 className="font-semibold text-4xl">Databases</h1>
        <CreateDatabaseDialog triggerText="New Database" projectId={projectId}/>
      </div>
      <Separator />
      <CustomDataTable<DatabaseType>
        data={project.databases}
        enableRowSelection
        searchKey="name"
        initialPageSize={5}
        pageSizeOptions={[5, 10, 20]}
      />
    </div>
  );
}
