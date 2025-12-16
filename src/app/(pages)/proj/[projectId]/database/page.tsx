import { Separator } from "@/components/ui/separator";
import DatabaseSidebar from "./_components/Sidebar";
import { DatabaseNavbar } from "./_components/NavMenu";
import TableView from "./_components/TableView";

const page = async ({ params }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params;

  return (
    <div className="w-full h-full flex flex-col"> {/* Changed from fullscreen flex flex-col */}
      <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
        <span className="font-semibold text-3xl mr-8">Database</span>
        <DatabaseNavbar />
      </header>

      <Separator />

      <div className="flex-1 flex overflow-hidden min-h-0"> {/* Key change: overflow-hidden on parent, min-h-0 */}
        <DatabaseSidebar />
        <div className="flex-1 overflow-hidden"> {/* Container for TableView */}
          <TableView projectId={p.projectId} />
        </div>
      </div>
    </div>
  )
}

export default page