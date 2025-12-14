import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SchemaPicker from "./_components/SchemaPicker";
import { getSchemas, getTables } from "@/lib/actions/database/actions";
import DatabaseSidebar from "./_components/Sidebar";
import { DatabaseNavbar } from "./_components/NavMenu";
import { Separator } from "@/components/ui/separator";

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {

  const p = await params;
  const sp = await searchParams

  const schemas = await getSchemas(p.projectId);
  const tables = await getTables(p.projectId, sp["schema"] ? sp['schema'][0] : "public");


  return (
    <div className='fullscreen flex flex-col items-center'>

      <header className="fullwidth h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
        <span className="font-semibold text-3xl mr-8">Database</span>

        <DatabaseNavbar />

        
      </header>

      <Separator />

      <div className="fullscreen flex items-center">
        <DatabaseSidebar />

        <div className="fullscreen flex flex-col items-center justify-center">
          <p className="text-muted-foreground">No data here...</p>
        </div>
      </div>
    </div>
  )
}

export default page