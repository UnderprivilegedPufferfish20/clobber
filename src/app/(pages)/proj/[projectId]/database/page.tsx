import { Separator } from "@/components/ui/separator";
import { DatabaseNavbar } from "./_components/NavMenu";
import TableView from "./_components/pages/TableEditorPage";
import TableEditorSidebar from "./_components/sidebars/TableEditorSidebar";
import SqlEditorSidebar from "./_components/sidebars/SqlEditorSidebar";
import SqlEditorPage from "./_components/pages/SqlEditorPage";
import { PreselectionHandler } from "./_components/PreselectionHandler";
import prisma from "@/lib/db";
import FunctionsPage from "./_components/pages/FunctionsPage";
import IndexesPage from "./_components/pages/IndexesPage";

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params;
  const sp = await searchParams;

  // Fetch preselections for this project
  const preselections = await prisma.preselected.findUnique({
    where: { projectId: p.projectId }
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Client component handles redirect logic */}
      <PreselectionHandler 
        projectId={p.projectId}
        searchParams={sp as Record<string, string>}
        preselections={preselections}
      />

      <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
        <span className="font-semibold text-3xl mr-8">Database</span>
        <DatabaseNavbar />
      </header>

      <Separator />

      <div className="flex-1 flex overflow-hidden">
        {(!sp["page"] || sp["page"] === 'table_editor') ? (
          <>
            <TableEditorSidebar />
            <div className="flex-1">
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
        ) : (sp['page'] === "functions") ? (
          <FunctionsPage projectId={p.projectId} />
        ) : (sp['page'] === "indexes") ? (
          <IndexesPage projectId={p.projectId}/>
        ) : (
          <p>Not Implemented</p>
        )}
      </div>
    </div>
  );
};

export default page;