import { getFolders, getQueries, getSqlQueryById } from '@/lib/actions/database/sql/cache-actions';
import React, { Suspense } from 'react'
import SqlEditorSidebar from './_components/Sidebar';
import SqlEditorPage from '../_components/SqlEditorPage';

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database/sql_editor">) => {
  const p = await params;
  const sp = await searchParams;

  
  const currentQueryId = sp["q"] as string;
  
  const folders = await getFolders(p.projectId)
  const currentQuery = currentQueryId ? await getSqlQueryById(currentQueryId, p.projectId) : null
  const queries = await getQueries(p.projectId)

  return (
    <>
      <SqlEditorSidebar 
        folders={folders}
        queries={queries}
      />
      <SqlEditorPage 
        currentSql={currentQuery}
        folders={folders}
        queries={queries}
      />
    </>
  )
}

export default page