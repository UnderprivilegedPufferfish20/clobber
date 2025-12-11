import { ColumnDefinition } from "@/lib/types/table";
import { DataTable } from "./_components/DataTable";
import { useQuery } from "@tanstack/react-query";
import getTables from "@/lib/actions/database/getTables";
import getSchema from "@/lib/actions/database/getSchema";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SchemaPicker from "./_components/SchemaPicker";

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database/[databaseId]">) => {

  const p = await params;

  const tables: any = await getTables(p.projectId, p.databaseId);
  const schemas: any = await getSchema(p.projectId, p.databaseId);

  interface UserColumnData {
    name: string[];
    age: number[];
    email: string[];
  }

  type UserColumnKey = keyof UserColumnData & string;

  const userData: UserColumnData = {
  name: ["Alice", "Bob", "Charlie"],
  age: [25, 32, 29],
  email: ["alice@test.com", "bob@test.com", "charlie@test.com"],
};

const userColumns: ColumnDefinition<UserColumnKey, UserColumnData>[] = [
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
  {
    key: "email",
    label: "Email",
    render: ({ value }) =>
      value ? (
        <a
          href={`mailto:${value}`}
          className="hover:underline text-primary"
        >
          {value as string}
        </a>
      ) : (
        ""
      ),
  },
];



    return (
      <div className='w-full min-w-full max-w-full h-full min-h-full max-h-full flex flex-col items-center justify-between'>
          <div className="w-full min-w-full max-w-full h-12 min-h-12 max-h-12 border-b-2 flex items-center">
            <SchemaPicker 
              rows={schemas.rows}
              databaseId={p.databaseId}
              projectId={p.projectId}
            />
          </div>

          <DataTable 
            columns={userColumns}
            data={userData}
            // getRowKey={i => `user-row-${i}`}
          />

          <div className="w-full min-w-full max-w-full h-12 min-h-12 max-h-12 flex items-center border-t-2">
            <Button
              className="border-r-2 flex items-center justify-center hover:bg-gray-900 rounded-none bg-transparent h-full min-h-full max-h-full"
            >
               <PlusIcon stroke="white"/> 
            </Button>

            {tables.rows.length ? (
              <div className="flex items-center">
                <div className="px-0">
                  <Skeleton className="h-8 w-32 bg-gray-200" />
                </div>
                <div className="px-0">
                  <Skeleton className="h-8 w-32 bg-gray-200" />
                </div>
                <div className="px-0">
                  <Skeleton className="h-8 w-32 bg-gray-200" />
                </div>
              </div>
            ) : (
 
              <p className="text-lg text-muted-foreground text-center">No tables yet</p>
   
            )}
          </div> 
      </div>
    )
}

export default page