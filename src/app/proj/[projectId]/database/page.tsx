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
import Loader from "@/components/Loader";
import { getEnums, getFolders, getFunctions, getIndexes, getQueries, getSchema, getSchemas, getTables, getTriggers } from "@/lib/actions/database/getActions";
import SchemaEditorPage from "./_components/pages/SchemaEditorPage";

type PageType = 
  | 'schema_editor'
  | 'table_editor' 
  | 'sql_editor' 
  | 'functions' 
  | 'indexes' 
  | 'triggers' 
  | 'enums'
  | 'settings';

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database">) => {
  const p = await params;
  const sp = await searchParams;

  // Determine current page - default to table_editor
  const currentPage = (sp["page"] as PageType) || 'table_editor';
  const schema = sp["schema"] ? sp['schema'] as string : 'public';

  // Always fetch schemas (needed for all pages)
  const schemas = await getSchemas(p.projectId);

  // Fetch data conditionally based on current page
  let pageContent: React.ReactNode;

  switch (currentPage) {
    case 'table_editor': {
      const tables = await getTables(schema, p.projectId);
      pageContent = (
        <>
          <TableEditorSidebar schemas={schemas} tables={tables} />
          <div className="flex-1">
            <TableView projectId={p.projectId} />
          </div>
        </>
      );
      break;
    }

    case 'sql_editor': {
      const [folders, queries] = await Promise.all([
        getFolders(p.projectId),
        getQueries(p.projectId)
      ]);
      pageContent = (
        <>
          <SqlEditorSidebar folders={folders} queries={queries} />
          <div className="flex-1 overflow-hidden">
            <SqlEditorPage />
          </div>
        </>
      );
      break;
    }

    case 'functions': {
      const functions = await getFunctions(p.projectId, schema);
      pageContent = (
        <FunctionsPage
          schemas={schemas}
          functions={functions}
          projectId={p.projectId}
        />
      );
      break;
    }

    case 'indexes': {
      const indexes = await getIndexes(p.projectId, schema);
      pageContent = (
        <IndexesPage
          schemas={schemas}
          indexes={indexes}
          projectId={p.projectId}
        />
      );
      break;
    }

    case 'triggers': {
      const triggers = await getTriggers(p.projectId, schema);
      pageContent = (
        <TriggersPage
          schemas={schemas}
          triggers={triggers}
          projectId={p.projectId}
        />
      );
      break;
    }

    case 'enums': {
      const enums = await getEnums(p.projectId, schema);
      pageContent = (
        <EnumsPage
          schemas={schemas}
          enums={enums}
          projectId={p.projectId}
        />
      );
      break;
    }

    case "schema_editor": {
      const schemaEditorDisplay = await getSchema(p.projectId, schema)
      pageContent = (
        <SchemaEditorPage 
          projectId={p.projectId} 
          schemas={schemas} 
          schema={schemaEditorDisplay}
        />
      )
      break
    }

    default: {
      pageContent = <p>Not Implemented</p>;
    }
  }

  return (
    <Suspense fallback={<Loader sz={168} />}>
      <div className="fullscreen flex flex-col overflow-hidden">
        <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
          <span className="font-semibold text-3xl mr-8">Database</span>
          <DatabaseNavbar />
        </header>

        <Separator />

        <div className="flex-1 flex overflow-hidden fullscreen">
          {pageContent}
        </div>
      </div>
    </Suspense>
  );
};

export default page;