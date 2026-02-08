import { getIndexes, searchIndex } from '@/lib/actions/storage/vectors/cache-actions';
import React from 'react'
import IndexPage from '../_components/pages/IndexPage';
import VectorsPage from '../_components/pages/VectorsPage';

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/storage/vectors">) => {

  const p = await params;
  const sp = await searchParams;

  const indexes = await getIndexes(p.projectId)

  const index = sp['index'] as string || ""

  const searchVars = sp['search'] ? JSON.parse(sp['search'] as string) : null

  const searchResults = searchVars && index ? 
    await searchIndex(
      p.projectId,
      index,
      searchVars.namespace,
      searchVars.method,
      indexes.find(i => i.name === index)!.metric,
      searchVars.topk,
      searchVars.query
    ) : null

  return (
    <>
      {index ? (
        <IndexPage 
          index={indexes.find(i => i.name === index)!}
          project_id={p.projectId}
          searchResults={searchResults ? searchResults : null}
        />
      ): (
        <VectorsPage 
          projectId={p.projectId}
          indexDetails={indexes}
        />
      )}
    </>
  )
}

export default page