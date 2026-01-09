import Loader from '@/components/Loader';
import { Separator } from '@/components/ui/separator'
import React, { Suspense } from 'react'
import { getBucketNames } from '@/lib/actions/storage/files/cache-actions';
import { getFolderData } from '@/lib/actions/storage/files/folder/cache-actions';
import EdgeFunctionsNavbar from './_components/EdgeFunctionNavbar';
import { getEdgeFunctions } from '@/lib/actions/functions/cache-actions';
import CreateEdgeFunctionPage from './_components/pages/CreateFunctionPage';
import EdgeFunctionsPage from './_components/pages/FunctionsPage';

type PageType = 
  | "functions"
  | "variables"

const FunctionsPage = async ({ params, searchParams }: PageProps<"/proj/[projectId]/functions">) => {
  const p = await params;
  const sp = await searchParams;

  // Determine current page - default to table_editor
  const currentPage = (sp["page"] as PageType) || 'functions';

  let pageContent: React.ReactNode;

  switch (currentPage) {
    case 'functions': {
      const funcs = await getEdgeFunctions(p.projectId)

      if (sp["new"] && sp['new'] === "true") {
        pageContent = (
          <CreateEdgeFunctionPage />
        )

        break
      }
      

      pageContent = (
        <EdgeFunctionsPage 
          projectId={p.projectId}
          functions={funcs}
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
          <span className="font-semibold text-3xl mr-8">Edge Functions</span>
          <EdgeFunctionsNavbar />
        </header>

        <Separator />

        <div className="flex-1 flex overflow-hidden fullscreen">
          {pageContent}
        </div>
      </div>
    </Suspense>
  );
}

export default FunctionsPage