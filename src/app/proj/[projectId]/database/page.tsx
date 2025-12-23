import { Separator } from "@/components/ui/separator";
import { DatabaseNavbar } from "./_components/NavMenu";
import TableView from "./_components/pages/TableEditorPage";
import TableEditorSidebar from "./_components/sidebars/TableEditorSidebar";
import SqlEditorSidebar from "./_components/sidebars/SqlEditorSidebar";
import SqlEditorPage from "./_components/pages/SqlEditorPage";
import FunctionsPage from "./_components/pages/FunctionsPage";
import IndexesPage from "./_components/pages/IndexesPage";
import TriggersPage from "./_components/pages/TriggersPage";
import { Suspense } from "react";
import EnumsPage from "./_components/pages/EnumsPage";
import { getEnums, getFolders, getFunctions, getIndexes, getQueries, getSchemas, getTables, getTriggers } from "@/lib/actions/database/getActions";
import Loader from "@/components/Loader";

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params;
  const sp = await searchParams;

  const schema = sp["schema"] ? sp['schema'] as string : 'public'

  const schemas = await getSchemas(p.projectId);
  const triggers = await getTriggers(p.projectId, schema);
  const functions = await getFunctions(p.projectId, schema);
  const indexes = await getIndexes(p.projectId, schema);
  const enums = await getEnums(p.projectId, schema);
  const tables = await getTables(p.projectId, schema);
  const folders = await getFolders(p.projectId);
  const queries = await getQueries(p.projectId)

  return (
    <Suspense fallback={<Loader sz={168}/>}>

      <div className="w-full h-full flex flex-col overflow-hidden">


        <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
          <span className="font-semibold text-3xl mr-8">Database</span>
          <DatabaseNavbar />
        </header>

        <Separator />

        <div className="flex-1 flex overflow-hidden">
          {(!sp["page"] || sp["page"] === 'table_editor') ? (
            <>
              <TableEditorSidebar 
                schemas={schemas}
                tables={tables}
              />
              <div className="flex-1">
                <TableView projectId={p.projectId} />
              </div>
            </>
          ) : (sp["page"] === 'sql_editor') ? (
            <>
              <SqlEditorSidebar 
                folders={folders}
                queries={queries}
              />
              <div className="flex-1 overflow-hidden">
                <SqlEditorPage />
              </div>
            </>
          ) : (sp['page'] === "functions") ? (
            <FunctionsPage
              schemas={schemas}
              functions={functions} 
              projectId={p.projectId} 
            />
          ) : (sp['page'] === "indexes") ? (
            <IndexesPage
              schemas={schemas}
              indexes={indexes}
              projectId={p.projectId}
            />
          ) : (sp['page'] === "triggers") ? (
            <TriggersPage
              schemas={schemas}
              triggers={triggers} 
              projectId={p.projectId} 
            />
          ) : (sp['page'] === 'enums') ? (
            <EnumsPage
              schemas={schemas}
              enums={enums} 
              projectId={p.projectId} 
            />
          ) : (
            <p>Not Implemented</p>
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default page;