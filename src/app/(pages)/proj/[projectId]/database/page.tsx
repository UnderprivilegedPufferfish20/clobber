import { Separator } from "@/components/ui/separator";
import DatabaseSidebar from "./_components/sidebars/TableEditorSidebar";
import { DatabaseNavbar } from "./_components/NavMenu";
import TableView from "./_components/pages/TableEditorPage";
import TableEditorSidebar from "./_components/sidebars/TableEditorSidebar";
import SqlEditorSidebar from "./_components/sidebars/SqlEditorSidebar";
import prisma from "@/lib/db";
import SqlEditorPage from "./_components/pages/SqlEditorPage";

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params;
  const sp = await searchParams;

  const folders = await prisma.sqlFolder.findMany({
    where: { projectId: p.projectId }, include: { queries: true }
  })

  const queries = await prisma.sql.findMany({
    where: { projectId: p.projectId }
  })

  return (
    <div className="w-full h-full flex flex-col"> {/* Changed from fullscreen flex flex-col */}
      <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
        <span className="font-semibold text-3xl mr-8">Database</span>
        <DatabaseNavbar />
      </header>

      <Separator />

      <div className="flex-1 flex overflow-hidden min-h-0"> {/* Key change: overflow-hidden on parent, min-h-0 */}
        {(!sp["page"] || sp["page"] === 'table_editor') ? (
          <>
            <TableEditorSidebar />
            <div className="flex-1 overflow-hidden"> {/* Container for TableView */}
              <TableView projectId={p.projectId} />
            </div>
          </>
        ) : (sp["page"] === 'sql_editor') ? (
          <>
            <SqlEditorSidebar />
            <div className="flex-1 overflow-hidden">
              <SqlEditorPage />
            </div>
          </>
        ) : (
          <p>
            Not Implemented
          </p>
        )}
      </div>
    </div>
  )
}

export default page